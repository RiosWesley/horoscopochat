import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Initialize Firebase Admin SDK (only once)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Access the Gemini API Key from Firebase environment configuration
// Make sure you've set this using:
// firebase functions:config:set gemini.key="YOUR_API_KEY"
// Note: We will check for the key inside the function handler during runtime.
// Checking it here in the global scope can cause issues during deployment cold starts.
// const GEMINI_API_KEY = functions.config().gemini?.key;
// if (!GEMINI_API_KEY) {
//   console.error("FATAL ERROR: Gemini API Key not found in Firebase environment configuration.");
// }

// Define safety settings for the Gemini model
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Define the expected structure for incoming data
interface RequestData {
  taskType: "generateCreativeText" | "analyzeCommunicationStyle";
  // Define payload structure more specifically if possible, or use 'any'/'unknown' for now
  payload: any; 
}

// Initialize the Google Generative AI client (using config set earlier)
// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY); // Removed duplicate initialization


// Define the HTTPS Callable Function (v1 syntax)
export const callGemini = functions.https.onCall(async (data: unknown, context) => {
  functions.logger.info("callGemini function started.", { structuredData: true }); // Added start log

  // Access the API key from environment variables (recommended for v2)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
      functions.logger.error("Gemini API Key not found in environment variables (GEMINI_API_KEY).");
      // Provide a more specific error message for the client
      throw new functions.https.HttpsError("internal", "Configuration error: Missing API Key on the server.");
  }
  // Initialize the Google Generative AI client *inside* the handler
  const genAI = new GoogleGenerativeAI(apiKey);

  // --- Data Validation ---
  // The client SDK wraps the data in a 'data' field. The V1 handler might
  // or might not unwrap it automatically in a V2 environment. Check both.
  const actualPayload = (data as any)?.data || data;
  functions.logger.info("Received data/payload:", { originalData: data, actualPayload: actualPayload }); // Log both for debugging

  // Type assertion and validation on the actual data payload
  const requestData = actualPayload as RequestData; // Assert the type on the potentially unwrapped data
  if (!requestData || typeof requestData !== 'object' || !requestData.taskType || !requestData.payload) {
    functions.logger.error("Invalid request data structure after potential unwrap. Received:", { originalData: data, actualPayload: actualPayload }); // Log the invalid data
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid request structure. Expected { data: { taskType: '...', payload: {...} } }." // More specific error
    );
  }

  // Now use the validated and typed requestData
  const { taskType, payload } = requestData;
  functions.logger.info(`Processing task: ${taskType}`, { taskType }); // Log task type
  let prompt = "";
  let resultText = "";

  try {
    functions.logger.info("Initializing Gemini model..."); // Log model init
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b", safetySettings });
    functions.logger.info("Gemini model initialized."); // Log success

    switch (taskType) {
      case "generateCreativeText":
        // Payload now contains creativeType ('prediction' or 'poem')
        const { mostFrequentEmoji, favoriteWord, sentimentMix, chatSign, creativeType } = payload;
        functions.logger.info(`Generating creative text prompt for type: ${creativeType}`, { payload }); // Log payload including creativeType

        // Base context string
        const baseContext = `
          Dados de análise de um chat do WhatsApp:
          - Emoji mais usado: ${mostFrequentEmoji || "Nenhum"}
          - Palavra favorita (ignorando comuns): ${favoriteWord || "Nenhuma"}
          - Mix de sentimento (positivo/negativo): ${sentimentMix || "Equilibrado"}
          - "Signo" do chat (baseado na hora mais ativa): ${chatSign || "Explorador do ZapVerso"}`;

        // Generate specific prompt based on creativeType
        if (creativeType === 'prediction') {
          prompt = `
            ${baseContext}

            Com base nesses dados, especialmente o "Signo" (${chatSign || "Explorador"}) e o sentimento (${sentimentMix || "Equilibrado"}), crie uma previsão curta (2-3 frases), divertida e otimista no estilo 'horóscopo maluco' para este chat.
            Reflita o sentimento e o signo na sua previsão. Use português brasileiro.
            Não inclua introduções como "Aqui está sua previsão:", apenas o texto gerado.
          `;
        } else if (creativeType === 'poem') {
          prompt = `
            ${baseContext}

            Inspirado por esses dados, especialmente o sentimento (${sentimentMix || "Equilibrado"}) e o emoji (${mostFrequentEmoji || "Nenhum"}), escreva um pequeno poema ou haiku (3-5 linhas) sobre a vibe deste chat.
            Tente capturar o sentimento predominante. Use português brasileiro.
            Não inclua introduções como "Aqui está seu poema:", apenas o texto gerado.
          `;
        } else {
           functions.logger.error("Unknown creativeType received within generateCreativeText task:", { creativeType });
           throw new functions.https.HttpsError("invalid-argument", "Invalid 'creativeType' provided for generateCreativeText.");
        }
        break;

      case "analyzeCommunicationStyle":
        functions.logger.info("Generating style analysis prompt...", { payloadKeys: Object.keys(payload) }); // Log payload keys only
        // Payload should contain anonymized messages (string) and character limit info
        const { anonymizedMessages, charLimit } = payload;
        prompt = `
          Analise o seguinte trecho de uma conversa de chat (em português brasileiro), respeitando o limite de caracteres de ${charLimit} usado para selecioná-lo.
          Avalie o estilo de comunicação geral predominante com base nestes aspectos:
          1.  **Complexidade da Linguagem:** As frases são geralmente curtas e diretas ou mais longas e elaboradas? O vocabulário é simples ou variado/complexo?
          2.  **Diretividade:** A comunicação tende a ser mais direta ao ponto ou mais indireta/sugestiva?
          3.  **Formalidade:** O tom geral é mais informal (gírias, abreviações) ou mais formal?

          Forneça um resumo conciso (3-4 frases) descrevendo o estilo de comunicação predominante observado no trecho fornecido. Não analise participantes individuais, apenas o estilo geral. Não inclua saudações ou despedidas na sua resposta.

          Trecho do Chat para Análise:
          """
          ${anonymizedMessages}
          """
        `;
        break;

      default:
        functions.logger.error("Unknown taskType received:", { taskType }); // Log unknown task
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid 'taskType' provided."
        );
    }

    // Call the Gemini API
    functions.logger.info(`Calling Gemini API for task: ${taskType}`); // Log API call start
    functions.logger.info("Final prompt for Gemini:", { prompt }); // Log the final prompt
    const result = await model.generateContent(prompt);
    functions.logger.info("Gemini API call completed."); // Log API call end
    const response = result.response;

    if (!response) {
        functions.logger.error("Gemini API did not return a response."); // Log no response
        throw new Error("A API Gemini não retornou uma resposta válida.");
    }

    // Check for safety blocks or empty response
    if (response.promptFeedback?.blockReason) {
      functions.logger.warn("Gemini API call blocked:", { reason: response.promptFeedback.blockReason }); // Log block reason
      throw new functions.https.HttpsError(
        "internal", // Or perhaps 'permission-denied' depending on block reason
        `A solicitação foi bloqueada pela IA por motivos de segurança: ${response.promptFeedback.blockReason}` // Slightly clearer error
      );
    }

    resultText = response.text();
    functions.logger.info(`Gemini response text received successfully for task: ${taskType}`); // Log success

    // Return the result
    return { success: true, result: resultText };

  } catch (error) {
    functions.logger.error(`Error processing task ${taskType}:`, error); // Log the caught error
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao chamar a API de IA.";
    // Throwing an HttpsError allows the client to catch it gracefully
    throw new functions.https.HttpsError(
      "internal",
      `Falha ao processar a solicitação de IA: ${errorMessage}`
    );
  }
});


// --- Function to Save Analysis Results ---
// Define the structure of the data we expect to receive and save
// IMPORTANT: This MUST NOT include raw/parsed messages, only aggregated results.
interface AnalysisResultsToSave {
  totalMessages: number;
  messagesPerSender: Record<string, number>;
  emojiCounts: Record<string, number>;
  mostFrequentEmoji: string | null;
  // mostActiveHour: number | null; // Maybe save this?
  keywordCounts: {
    laughter: number;
    questions: number;
    positive: number;
    negative: number;
  };
  averageMessageLength: number;
  favoriteWord: string | null;
  punctuationEmphasisCount: number;
  capsWordCount: number;
  topExpressions: { text: string; count: number }[];
  statsPerSender: Record<string, {
    messageCount: number;
    averageLength: number;
    emojiCounts: Record<string, number>;
    keywordCounts: {
      laughter: number;
      questions: number;
      positive: number;
      negative: number;
    };
    passiveAggressivePercentage: number | null;
    flirtationPercentage: number | null;
    // averageResponseTimeMinutes: number | null; // Maybe save this?
  }>;
  passiveAggressivePercentage: number | null;
  flirtationPercentage: number | null;
  // AI Results
  aiPrediction: string | null;
  aiPoem: string | null;
  aiStyleAnalysis: string | null;
  // Heuristics
  generatedSign: string | null;
  // Add any other relevant aggregated/generated fields
  createdAt: admin.firestore.FieldValue; // Timestamp for saving
}

export const saveAnalysisResults = functions.https.onCall(async (data: unknown, context) => {
  functions.logger.info("saveAnalysisResults function started.");

  // Validate input data structure (ensure it matches AnalysisResultsToSave)
  // It's crucial to filter here on the server-side to prevent saving sensitive data
  const receivedData = (data as any)?.data || data; // Handle potential client SDK wrapping
  functions.logger.info("Received data for saving:", { receivedData });

  // **Perform strict validation and filtering here**
  // Only pick the fields defined in AnalysisResultsToSave from receivedData
  // Example (needs to be more robust based on actual AnalysisResults structure):
  if (!receivedData || typeof receivedData !== 'object') {
     throw new functions.https.HttpsError("invalid-argument", "Invalid data format received.");
  }

  const dataToSave: Partial<AnalysisResultsToSave> = {}; // Use Partial initially

  // --- Manually map and validate allowed fields ---
  if (typeof receivedData.totalMessages === 'number') dataToSave.totalMessages = receivedData.totalMessages;
  if (typeof receivedData.messagesPerSender === 'object') dataToSave.messagesPerSender = receivedData.messagesPerSender; // Consider if sender names are sensitive
  if (typeof receivedData.emojiCounts === 'object') dataToSave.emojiCounts = receivedData.emojiCounts;
  if (typeof receivedData.mostFrequentEmoji === 'string' || receivedData.mostFrequentEmoji === null) dataToSave.mostFrequentEmoji = receivedData.mostFrequentEmoji;
  if (typeof receivedData.keywordCounts === 'object') dataToSave.keywordCounts = receivedData.keywordCounts;
  if (typeof receivedData.averageMessageLength === 'number') dataToSave.averageMessageLength = receivedData.averageMessageLength;
  if (typeof receivedData.favoriteWord === 'string' || receivedData.favoriteWord === null) dataToSave.favoriteWord = receivedData.favoriteWord;
  if (typeof receivedData.punctuationEmphasisCount === 'number') dataToSave.punctuationEmphasisCount = receivedData.punctuationEmphasisCount;
  if (typeof receivedData.capsWordCount === 'number') dataToSave.capsWordCount = receivedData.capsWordCount;
  if (Array.isArray(receivedData.topExpressions)) dataToSave.topExpressions = receivedData.topExpressions;
  if (typeof receivedData.statsPerSender === 'object') dataToSave.statsPerSender = receivedData.statsPerSender; // Again, consider sender names
  if (typeof receivedData.passiveAggressivePercentage === 'number' || receivedData.passiveAggressivePercentage === null) dataToSave.passiveAggressivePercentage = receivedData.passiveAggressivePercentage;
  if (typeof receivedData.flirtationPercentage === 'number' || receivedData.flirtationPercentage === null) dataToSave.flirtationPercentage = receivedData.flirtationPercentage;
  if (typeof receivedData.aiPrediction === 'string' || receivedData.aiPrediction === null) dataToSave.aiPrediction = receivedData.aiPrediction;
  if (typeof receivedData.aiPoem === 'string' || receivedData.aiPoem === null) dataToSave.aiPoem = receivedData.aiPoem;
  if (typeof receivedData.aiStyleAnalysis === 'string' || receivedData.aiStyleAnalysis === null) dataToSave.aiStyleAnalysis = receivedData.aiStyleAnalysis;
  if (typeof receivedData.generatedSign === 'string' || receivedData.generatedSign === null) dataToSave.generatedSign = receivedData.generatedSign;
  // --- End mapping ---

  // Add server timestamp
  dataToSave.createdAt = admin.firestore.FieldValue.serverTimestamp();

  // Check if we actually have something to save after filtering
  if (Object.keys(dataToSave).length < 2) { // < 2 because createdAt is always added
     functions.logger.error("No valid data fields found after filtering.", { receivedData });
     throw new functions.https.HttpsError("invalid-argument", "No valid analysis data provided to save.");
  }


  try {
    const db = admin.firestore();
    const docRef = await db.collection("sharedAnalyses").add(dataToSave);
    functions.logger.info(`Analysis saved successfully with ID: ${docRef.id}`);
    return { success: true, analysisId: docRef.id };
  } catch (error) {
    functions.logger.error("Error saving analysis to Firestore:", error);
    throw new functions.https.HttpsError("internal", "Failed to save analysis results.");
  }
});


// --- Function to Get Saved Analysis Results ---
interface GetAnalysisPayload {
  analysisId: string;
}

export const getAnalysisResults = functions.https.onCall(async (data: unknown, context) => {
  functions.logger.info("getAnalysisResults function started.");

  const requestData = (data as any)?.data || data; // Handle potential client SDK wrapping
  const { analysisId } = requestData as GetAnalysisPayload;

  if (!analysisId || typeof analysisId !== 'string') {
    functions.logger.error("Invalid or missing analysisId.", { requestData });
    throw new functions.https.HttpsError("invalid-argument", "An 'analysisId' must be provided.");
  }

  functions.logger.info(`Attempting to fetch analysis with ID: ${analysisId}`);

  try {
    const db = admin.firestore();
    const docRef = db.collection("sharedAnalyses").doc(analysisId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      functions.logger.warn(`Analysis document not found for ID: ${analysisId}`);
      throw new functions.https.HttpsError("not-found", "Analysis not found.");
    } else {
      const savedData = docSnap.data();
      functions.logger.info(`Analysis data fetched successfully for ID: ${analysisId}`);
      // Convert Firestore Timestamp back to Date or ISO string if needed by client
      if (savedData?.createdAt?.toDate) {
         savedData.createdAt = savedData.createdAt.toDate().toISOString();
      }
      return { success: true, results: savedData };
    }
  } catch (error: any) {
     // Catch specific 'not-found' error to return it, otherwise log and return internal error
     if (error instanceof functions.https.HttpsError && error.code === "not-found") {
       throw error;
     }
     functions.logger.error(`Error fetching analysis ${analysisId} from Firestore:`, error);
     throw new functions.https.HttpsError("internal", "Failed to retrieve analysis results.");
  }
});
