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

  // Re-check API key just in case config wasn't deployed/set correctly
  const apiKey = functions.config().gemini?.key;
  if (!apiKey) {
      functions.logger.error("Gemini API Key not found in function runtime configuration.");
      throw new functions.https.HttpsError("internal", "API Key configuration error.");
  }
  // Initialize the Google Generative AI client *inside* the handler
  const genAI = new GoogleGenerativeAI(apiKey);

  // Type assertion and validation
  const requestData = data as RequestData; // Assert the type
  if (!requestData || !requestData.taskType || !requestData.payload) {
    functions.logger.error("Invalid request data structure:", { data }); // Log the invalid data
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with 'taskType' and 'payload' arguments."
    );
  }

  // Now use the validated and typed requestData
  const { taskType, payload } = requestData;
  functions.logger.info(`Processing task: ${taskType}`, { taskType }); // Log task type
  let prompt = "";
  let resultText = "";

  try {
    functions.logger.info("Initializing Gemini model..."); // Log model init
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });
    functions.logger.info("Gemini model initialized."); // Log success

    switch (taskType) {
      case "generateCreativeText":
        functions.logger.info("Generating creative text prompt...", { payload }); // Log payload
        // Payload should contain local analysis results
        const { mostFrequentEmoji, favoriteWord, sentimentMix, chatSign } = payload;
        prompt = `
          Com base nos seguintes dados de análise de um chat do WhatsApp:
          - Emoji mais usado: ${mostFrequentEmoji || "Nenhum"}
          - Palavra favorita (ignorando comuns): ${favoriteWord || "Nenhuma"}
          - Mix de sentimento (positivo/negativo): ${sentimentMix || "Equilibrado"}
          - "Signo" do chat (baseado na hora mais ativa): ${chatSign || "Explorador do ZapVerso"}

          Gere um dos seguintes, de forma aleatória (escolha um):
          1. Uma previsão curta (2-3 frases), divertida e otimista no estilo 'horóscopo maluco' para este chat.
          2. Um pequeno poema ou haiku (3-5 linhas) sobre a vibe deste chat.

          Seja criativo, use um tom leve e evite ser genérico. Use português brasileiro.
          Não inclua introduções como "Aqui está sua previsão:" ou "Aqui está seu poema:", apenas o texto gerado.
        `;
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
