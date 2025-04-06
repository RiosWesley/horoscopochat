"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMercadoPagoNotification = exports.getAnalysisResults = exports.saveAnalysisResults = exports.createMercadoPagoCheckout = exports.callGemini = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
// Initialize Firebase Admin SDK (only once)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
// Define safety settings for the Gemini model
const safetySettings = [
    { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: generative_ai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: generative_ai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];
// Define the HTTPS Callable Function (v1 syntax)
// Potentially remove the explicit ': Promise<any>' if TS can infer it, or specify a more concrete return type
exports.callGemini = functions.https.onCall(async (data, context) => {
    functions.logger.info("callGemini function started.", { structuredData: true });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        functions.logger.error("Gemini API Key not found in environment variables (GEMINI_API_KEY).");
        throw new functions.https.HttpsError("internal", "Configuration error: Missing API Key on the server.");
    }
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const actualPayload = data?.data || data;
    functions.logger.info("Received data/payload:", { originalData: data, actualPayload: actualPayload });
    // Improved validation
    if (!actualPayload || typeof actualPayload !== 'object') {
        functions.logger.error("Invalid request data: not an object.", { originalData: data, actualPayload: actualPayload });
        throw new functions.https.HttpsError("invalid-argument", "Invalid request structure. Expected { data: { taskType: '...', payload: {...} } } or { taskType: '...', payload: {...} }.");
    }
    const requestData = actualPayload; // Cast after checking it's an object
    if (!requestData.taskType || !requestData.payload) {
        functions.logger.error("Invalid request data structure: missing taskType or payload.", { requestData: requestData });
        throw new functions.https.HttpsError("invalid-argument", "Invalid request structure. Expected object with 'taskType' and 'payload' keys.");
    }
    // Destructure taskType and payload here, they are accessible within the function scope
    const { taskType, payload } = requestData;
    functions.logger.info(`Processing task: ${taskType}`, { taskType });
    try { // Start of main try block
        let prompt = ""; // Declare prompt within the try block, accessible by switch cases
        functions.logger.info("Initializing Gemini model...");
        // Ensure model name is correct, "gemini-1.5-flash-8b" seems unusual, maybe "gemini-1.5-flash"? check Gemini docs
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });
        functions.logger.info("Gemini model initialized.");
        // --- Construct Prompt based on Task Type ---
        switch (taskType) {
            case "generateCreativeText": {
                const { mostFrequentEmoji, favoriteWord, sentimentMix, chatSign, creativeType } = payload;
                functions.logger.info(`Generating creative text prompt for type: ${creativeType}`, { payload });
                const baseContext = `
          Dados de análise de um chat do WhatsApp:
          - Emoji mais usado: ${mostFrequentEmoji || "Nenhum"}
          - Palavra favorita (ignorando comuns): ${favoriteWord || "Nenhuma"}
          - Mix de sentimento (positivo/negativo): ${sentimentMix || "Equilibrado"}
          - "Signo" do chat (baseado na hora mais ativa): ${chatSign || "Explorador do ZapVerso"}`;
                if (creativeType === 'prediction') {
                    prompt = `
            ${baseContext}
            Com base nesses dados, especialmente o "Signo" (${chatSign || "Explorador"}) e o sentimento (${sentimentMix || "Equilibrado"}), crie uma previsão curta (2-3 frases), divertida e otimista no estilo 'horóscopo maluco' para este chat.
            Reflita o sentimento e o signo na sua previsão. Use português brasileiro.
            Não inclua introduções como "Aqui está sua previsão:", apenas o texto gerado.
          `;
                }
                else if (creativeType === 'poem') {
                    prompt = `
            ${baseContext}
            Inspirado por esses dados, especialmente o sentimento (${sentimentMix || "Equilibrado"}) e o emoji (${mostFrequentEmoji || "Nenhum"}), escreva um pequeno poema ou haiku (3-5 linhas) sobre a vibe deste chat.
            Tente capturar o sentimento predominante. Use português brasileiro.
            Não inclua introduções como "Aqui está seu poema:", apenas o texto gerado.
          `;
                }
                else {
                    functions.logger.error("Unknown creativeType received within generateCreativeText task:", { creativeType });
                    throw new functions.https.HttpsError("invalid-argument", "Invalid 'creativeType' provided for generateCreativeText.");
                }
                break;
            }
            case "analyzeCommunicationStyle": {
                const { anonymizedMessages, charLimit } = payload;
                functions.logger.info("Generating style analysis prompt...", { payloadKeys: Object.keys(payload) });
                // Ensure charLimit is a number or provide a default
                const limit = typeof charLimit === 'number' && charLimit > 0 ? charLimit : 1000;
                prompt = `
          Analise o seguinte trecho de uma conversa de chat (em português brasileiro), respeitando o limite de caracteres de ${limit} usado para selecioná-lo.
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
            }
            case "analyzeFlagsPersonality": { // Line 124 starts here
                functions.logger.info("Generating flag personality analysis prompt...", { payloadKeys: Object.keys(payload) });
                const senderFlagData = payload;
                let flagPromptParts = [];
                for (const sender in senderFlagData) {
                    // Ensure senderFlagData[sender] exists before accessing its properties
                    if (senderFlagData.hasOwnProperty(sender) && senderFlagData[sender]) {
                        const flags = senderFlagData[sender];
                        if (flags && (flags.redFlagKeywords?.length > 0 || flags.greenFlagKeywords?.length > 0)) {
                            const maxKeywords = 15;
                            const redFlagsSample = flags.redFlagKeywords?.slice(0, maxKeywords).join(", ") || "Nenhuma";
                            const greenFlagsSample = flags.greenFlagKeywords?.slice(0, maxKeywords).join(", ") || "Nenhuma";
                            flagPromptParts.push(`- ${sender}:\n  - Red Flags (exemplos): ${redFlagsSample}\n  - Green Flags (exemplos): ${greenFlagsSample}`);
                        }
                    }
                }
                if (flagPromptParts.length === 0) {
                    functions.logger.warn("No senders with flags provided for analyzeFlagsPersonality task.");
                    // Ensure a consistent return structure
                    return { success: true, result: "{}" }; // Return stringified JSON for consistency or adjust client
                }
                prompt = `
          Analise as seguintes palavras/frases associadas a "Red Flags" (sinais de alerta) e "Green Flags" (sinais positivos) para cada participante de uma conversa de WhatsApp (em português brasileiro).
          Dados por Participante:
          ${flagPromptParts.join("\n\n")}
          Com base EXCLUSIVAMENTE nessas palavras/frases fornecidas para cada pessoa, gere uma breve análise de personalidade (1-2 frases) para CADA participante listado. Foque em traços que podem ser inferidos a partir das flags (ex: direto, cuidadoso, impaciente, encorajador, etc.).
          Seja conciso e direto ao ponto.
          Retorne a análise como um objeto JSON onde as chaves são os nomes dos participantes e os valores são as strings da análise de personalidade correspondente.
          Exemplo de formato de saída esperado:
          {
            "Nome Participante 1": "Parece ser [análise breve].",
            "Nome Participante 2": "Demonstra ser [análise breve]."
          }
          IMPORTANTE: Sua resposta deve conter APENAS o objeto JSON válido, sem nenhum texto antes ou depois, e sem usar blocos de código markdown (\`\`\`json ... \`\`\`).
        `; // <--- *** CORRECTION HERE: Escaped backticks ***
                break; // Line 136 ends around here
            } // Line 137
            default: { // Line 139
                // This ensures exhaustive checking at compile time
                // If taskType could be other strings, this assignment will fail
                const exhaustiveCheck = taskType;
                functions.logger.error("Unhandled taskType in switch:", { taskType: exhaustiveCheck });
                throw new functions.https.HttpsError("internal", `Unhandled task type received: ${taskType}` // Include the type for better debugging
                );
            } // Line 143 ends here
        } // End of switch
        // --- Call Gemini API ---
        functions.logger.info(`Calling Gemini API for task: ${taskType}`);
        functions.logger.debug("Final prompt for Gemini:", { prompt }); // Use debug for potentially long prompts
        const generationConfig = {
            responseMimeType: taskType === "analyzeFlagsPersonality" ? "application/json" : "text/plain",
        };
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig // Pass the config here
        });
        functions.logger.info("Gemini API call completed.");
        const response = result.response;
        if (!response) {
            functions.logger.error("Gemini API did not return a response object.");
            throw new functions.https.HttpsError("internal", "A API Gemini não retornou um objeto de resposta."); // More specific error
        }
        // Check for finishReason before accessing text()
        const finishReason = response.candidates?.[0]?.finishReason;
        const safetyRatings = response.candidates?.[0]?.safetyRatings;
        if (finishReason === "STOP") {
            // Continue processing
        }
        else if (finishReason === "MAX_TOKENS") {
            functions.logger.warn("Gemini response stopped due to MAX_TOKENS.");
            // Decide if partial response is acceptable or throw error
        }
        else if (finishReason === "SAFETY" || response.promptFeedback?.blockReason) {
            functions.logger.warn("Gemini API call blocked or response filtered:", {
                reason: finishReason || response.promptFeedback?.blockReason,
                safetyRatings: safetyRatings || response.promptFeedback?.safetyRatings,
            });
            throw new functions.https.HttpsError("internal", // Or perhaps 'resource-exhausted' or 'permission-denied' depending on context
            `A solicitação/resposta foi bloqueada pela IA por motivos de segurança/política.`);
        }
        else {
            functions.logger.error("Gemini response finished with unexpected reason or was empty:", { finishReason, response });
            throw new functions.https.HttpsError("internal", "A resposta da API Gemini foi inesperada ou vazia.");
        }
        // Access text only if finishReason is acceptable
        const resultText = response.text().trim(); // Declare resultText here
        functions.logger.info(`Gemini response text received successfully for task: ${taskType}`);
        // --- Process Response ---
        if (taskType === "analyzeFlagsPersonality") {
            // With responseMimeType: "application/json", Gemini should return valid JSON directly
            try {
                // Gemini 1.5 with application/json might already parse it, check response structure
                // Let's assume response.text() still returns the JSON string for now
                const jsonResult = JSON.parse(resultText);
                functions.logger.info("Parsed JSON result for analyzeFlagsPersonality:", { jsonResult });
                return { success: true, result: jsonResult }; // Return the parsed object
            }
            catch (parseError) {
                functions.logger.error("Failed to parse JSON from Gemini response even when application/json was requested.", { responseText: resultText, error: parseError });
                throw new functions.https.HttpsError("internal", "A IA retornou uma resposta inválida (JSON esperado falhou ao analisar).");
            }
        }
        else {
            // For other tasks, return plain text
            return { success: true, result: resultText };
        }
    }
    catch (error) { // Catch block for the main try
        functions.logger.error(`Error processing task ${taskType}:`, error); // taskType is accessible here
        if (error instanceof functions.https.HttpsError) {
            throw error; // Re-throw HttpsError directly
        }
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao chamar a API de IA.";
        throw new functions.https.HttpsError("internal", `Falha ao processar a solicitação de IA: ${errorMessage}`);
    }
}); // End of callGemini function
// --- Function to Create Mercado Pago Checkout Preference ---
const mercadopago_1 = require("mercadopago");
exports.createMercadoPagoCheckout = functions.https.onCall(async (data, context) => {
    functions.logger.info("createMercadoPagoCheckout function started.");
    const requestData = data?.data || data;
    // Validate payload
    if (!requestData || typeof requestData !== 'object') {
        functions.logger.error("Invalid request data: not an object.", { requestData });
        throw new functions.https.HttpsError("invalid-argument", "Invalid request structure.");
    }
    const { analysisId, title, unitPrice, successUrl, failureUrl, pendingUrl } = requestData;
    if (!analysisId || !title || typeof unitPrice !== 'number' || unitPrice <= 0 || !successUrl || !failureUrl || !pendingUrl) {
        functions.logger.error("Missing or invalid parameters in payload.", { requestData });
        throw new functions.https.HttpsError("invalid-argument", "Missing or invalid parameters: analysisId, title, unitPrice, successUrl, failureUrl, pendingUrl are required.");
    }
    // Retrieve Mercado Pago Access Token from config
    // IMPORTANT: Use sandbox token for testing, production token for live
    const accessToken = functions.config().mercadopago?.sandbox_access_token; // Use sandbox for now
    // const accessToken = functions.config().mercadopago?.access_token; // Use this for production
    if (!accessToken) {
        functions.logger.error("Mercado Pago Access Token not found in Firebase Functions config (mercadopago.sandbox_access_token).");
        throw new functions.https.HttpsError("internal", "Configuration error: Missing Mercado Pago Access Token on the server.");
    }
    try {
        // Initialize Mercado Pago client
        const client = new mercadopago_1.MercadoPagoConfig({ accessToken: accessToken, options: { timeout: 5000 } });
        const preference = new mercadopago_1.Preference(client);
        functions.logger.info(`Creating preference for analysisId: ${analysisId}`);
        const preferenceData = await preference.create({
            body: {
                items: [
                    {
                        id: analysisId, // Use analysisId as item ID
                        title: title, // e.g., "Desbloqueio Premium - Análise de Chat"
                        quantity: 1,
                        unit_price: unitPrice, // Price in BRL (e.g., 5.00 for R$ 5,00)
                        currency_id: "BRL", // Assuming Brazilian Real
                        description: `Acesso premium para análise ${analysisId}`,
                    },
                ],
                back_urls: {
                    success: successUrl, // e.g., https://your-app.com/payment/success?analysisId={analysisId}
                    failure: failureUrl, // e.g., https://your-app.com/payment/failure?analysisId={analysisId}
                    pending: pendingUrl, // e.g., https://your-app.com/payment/pending?analysisId={analysisId}
                },
                auto_return: "approved", // Automatically return to success URL on approval
                // Pass analysisId in external_reference for webhook identification
                external_reference: analysisId,
                notification_url: `https://<YOUR_REGION>-<YOUR_PROJECT_ID>.cloudfunctions.net/handleMercadoPagoNotification`, // REPLACE WITH YOUR ACTUAL WEBHOOK URL LATER
                // You might want to add payment method exclusions if needed
                // payment_methods: {
                //   excluded_payment_types: [ { id: "ticket" } ] // Example: exclude boleto
                // }
            },
        });
        functions.logger.info(`Preference created successfully for analysisId: ${analysisId}`, { preferenceId: preferenceData.id });
        // Return the checkout URL (init_point for sandbox or live)
        const checkoutUrl = preferenceData.sandbox_init_point || preferenceData.init_point;
        if (!checkoutUrl) {
            functions.logger.error("Mercado Pago did not return an init_point (checkout URL).", { preferenceData });
            throw new Error("Failed to get checkout URL from Mercado Pago.");
        }
        return { success: true, checkoutUrl: checkoutUrl };
    }
    catch (error) {
        functions.logger.error(`Error creating Mercado Pago preference for analysisId ${analysisId}:`, error?.cause || error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao criar preferência de pagamento.";
        // Check for specific Mercado Pago errors if possible
        const statusCode = error?.statusCode || 500;
        const mpErrorMessage = error?.cause?.[0]?.description || errorMessage;
        throw new functions.https.HttpsError(statusCode === 400 ? "invalid-argument" : "internal", `Falha ao criar checkout (${statusCode}): ${mpErrorMessage}`);
    }
});
exports.saveAnalysisResults = functions.https.onCall(async (data, context) => {
    functions.logger.info("saveAnalysisResults function started.");
    const receivedData = data?.data || data;
    functions.logger.info("Received data for saving:", { receivedData });
    // Ensure receivedData is an object before proceeding
    if (!receivedData || typeof receivedData !== 'object') {
        functions.logger.error("Invalid data format received for saving: not an object.", { receivedData });
        throw new functions.https.HttpsError("invalid-argument", "Invalid data format received.");
    }
    const dataToSave = {};
    // --- Manually map and validate allowed fields ---
    // (Keep your mapping logic as it is, it's good practice)
    if (typeof receivedData.totalMessages === 'number')
        dataToSave.totalMessages = receivedData.totalMessages;
    if (typeof receivedData.messagesPerSender === 'object' && receivedData.messagesPerSender !== null)
        dataToSave.messagesPerSender = receivedData.messagesPerSender;
    if (typeof receivedData.emojiCounts === 'object' && receivedData.emojiCounts !== null)
        dataToSave.emojiCounts = receivedData.emojiCounts;
    if (typeof receivedData.mostFrequentEmoji === 'string' || receivedData.mostFrequentEmoji === null)
        dataToSave.mostFrequentEmoji = receivedData.mostFrequentEmoji;
    if (typeof receivedData.keywordCounts === 'object' && receivedData.keywordCounts !== null)
        dataToSave.keywordCounts = receivedData.keywordCounts;
    if (typeof receivedData.averageMessageLength === 'number')
        dataToSave.averageMessageLength = receivedData.averageMessageLength;
    if (typeof receivedData.favoriteWord === 'string' || receivedData.favoriteWord === null)
        dataToSave.favoriteWord = receivedData.favoriteWord;
    if (typeof receivedData.punctuationEmphasisCount === 'number')
        dataToSave.punctuationEmphasisCount = receivedData.punctuationEmphasisCount;
    if (typeof receivedData.capsWordCount === 'number')
        dataToSave.capsWordCount = receivedData.capsWordCount;
    if (Array.isArray(receivedData.topExpressions))
        dataToSave.topExpressions = receivedData.topExpressions;
    if (typeof receivedData.statsPerSender === 'object' && receivedData.statsPerSender !== null)
        dataToSave.statsPerSender = receivedData.statsPerSender;
    if (typeof receivedData.passiveAggressivePercentage === 'number' || receivedData.passiveAggressivePercentage === null)
        dataToSave.passiveAggressivePercentage = receivedData.passiveAggressivePercentage;
    if (typeof receivedData.flirtationPercentage === 'number' || receivedData.flirtationPercentage === null)
        dataToSave.flirtationPercentage = receivedData.flirtationPercentage;
    if (typeof receivedData.aiPrediction === 'string' || receivedData.aiPrediction === null)
        dataToSave.aiPrediction = receivedData.aiPrediction;
    if (typeof receivedData.aiPoem === 'string' || receivedData.aiPoem === null)
        dataToSave.aiPoem = receivedData.aiPoem;
    if (typeof receivedData.aiStyleAnalysis === 'string' || receivedData.aiStyleAnalysis === null)
        dataToSave.aiStyleAnalysis = receivedData.aiStyleAnalysis;
    if (typeof receivedData.generatedSign === 'string' || receivedData.generatedSign === null)
        dataToSave.generatedSign = receivedData.generatedSign;
    if (typeof receivedData.isPremiumAnalysis === 'boolean')
        dataToSave.isPremiumAnalysis = receivedData.isPremiumAnalysis;
    if (typeof receivedData.totalRedFlags === 'number')
        dataToSave.totalRedFlags = receivedData.totalRedFlags;
    if (typeof receivedData.totalGreenFlags === 'number')
        dataToSave.totalGreenFlags = receivedData.totalGreenFlags;
    // Ensure aiFlagPersonalityAnalysis is an object or null
    if (typeof receivedData.aiFlagPersonalityAnalysis === 'object' || receivedData.aiFlagPersonalityAnalysis === null) {
        dataToSave.aiFlagPersonalityAnalysis = receivedData.aiFlagPersonalityAnalysis;
    }
    // --- End mapping ---
    dataToSave.createdAt = admin.firestore.FieldValue.serverTimestamp();
    // Check if we actually mapped any valid fields besides createdAt
    if (Object.keys(dataToSave).length <= 1) {
        functions.logger.error("No valid data fields found after filtering for saving.", { receivedData });
        throw new functions.https.HttpsError("invalid-argument", "No valid analysis data provided to save.");
    }
    try {
        const db = admin.firestore();
        const docRef = await db.collection("sharedAnalyses").add(dataToSave);
        functions.logger.info(`Analysis saved successfully with ID: ${docRef.id}`);
        return { success: true, analysisId: docRef.id };
    }
    catch (error) {
        functions.logger.error("Error saving analysis to Firestore:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        throw new functions.https.HttpsError("internal", `Failed to save analysis results: ${errorMessage}`);
    }
});
exports.getAnalysisResults = functions.https.onCall(async (data, context) => {
    functions.logger.info("getAnalysisResults function started.");
    // Use consistent payload unwrapping
    const requestData = data?.data || data;
    // Add type checking for requestData itself
    if (!requestData || typeof requestData !== 'object') {
        functions.logger.error("Invalid request data for getAnalysisResults: not an object.", { requestData });
        throw new functions.https.HttpsError("invalid-argument", "Invalid request structure.");
    }
    const { analysisId } = requestData; // Cast after checking it's an object
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
        }
        else {
            const savedData = docSnap.data(); // Cast to your interface for better type safety
            if (savedData?.createdAt && typeof savedData.createdAt?.toDate === 'function') {
                // Convert Firestore Timestamp to ISO string for JSON serialization
                savedData.createdAt = savedData.createdAt.toDate().toISOString();
            }
            // Ensure other potential Timestamp fields are also converted if they exist
            functions.logger.info(`Successfully fetched analysis ${analysisId}`);
            return { success: true, results: savedData };
        }
    }
    catch (error) {
        // Re-throw specific known errors
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        // Log unknown errors and throw a generic internal error
        functions.logger.error(`Error fetching analysis ${analysisId} from Firestore:`, error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        throw new functions.https.HttpsError("internal", `Failed to retrieve analysis results: ${errorMessage}`);
    }
});
// --- Webhook Handler for Mercado Pago Notifications ---
const mercadopago_2 = require("mercadopago"); // Import Payment type
exports.handleMercadoPagoNotification = functions.https.onRequest(async (request, response) => {
    functions.logger.info("handleMercadoPagoNotification received request:", { method: request.method, query: request.query, body: request.body });
    // Respond quickly to Mercado Pago to avoid timeouts, especially for initial verification pings
    if (request.method !== "POST") {
        functions.logger.warn("Received non-POST request.");
        response.status(405).send("Method Not Allowed");
        return;
    }
    // Extract notification details from query parameters (for payment notifications)
    const topic = request.query.topic || request.body.topic;
    const paymentId = request.query.id || request.body.data?.id;
    if (topic === "payment" && paymentId) {
        functions.logger.info(`Processing payment notification for ID: ${paymentId}`);
        try {
            // Retrieve Mercado Pago Access Token from config
            const accessToken = functions.config().mercadopago?.sandbox_access_token; // Use sandbox for now
            if (!accessToken) {
                functions.logger.error("Mercado Pago Access Token not found for webhook processing.");
                // Respond 500 but don't throw, as MP might retry
                response.status(500).send("Internal Server Error: Missing MP config.");
                return;
            }
            // Initialize Mercado Pago client
            const client = new mercadopago_1.MercadoPagoConfig({ accessToken: accessToken, options: { timeout: 5000 } });
            const payment = new mercadopago_2.Payment(client);
            // Fetch payment details from Mercado Pago
            const paymentInfo = await payment.get({ id: String(paymentId) });
            functions.logger.info(`Fetched payment info for ID ${paymentId}:`, { status: paymentInfo.status, external_reference: paymentInfo.external_reference });
            // Check if payment is approved and has the external reference (analysisId)
            if (paymentInfo.status === "approved" && paymentInfo.external_reference) {
                const analysisId = paymentInfo.external_reference;
                functions.logger.info(`Payment approved for analysisId: ${analysisId}. Updating Firestore.`);
                const db = admin.firestore();
                const analysisRef = db.collection("sharedAnalyses").doc(analysisId);
                // Update the document to mark as premium
                await analysisRef.update({
                    isPremiumAnalysis: true,
                    paymentStatus: "approved", // Optionally store status
                    paymentId: paymentId, // Optionally store payment ID
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                functions.logger.info(`Successfully updated analysis ${analysisId} to premium.`);
                // Respond 200 OK to Mercado Pago
                response.status(200).send("OK");
            }
            else {
                functions.logger.warn(`Payment status not 'approved' or missing external_reference for payment ID ${paymentId}. Status: ${paymentInfo.status}`);
                // Respond 200 OK even if not approved, to acknowledge receipt
                response.status(200).send("Notification received, but payment not processed for premium update.");
            }
        }
        catch (error) {
            functions.logger.error(`Error processing Mercado Pago notification for payment ID ${paymentId}:`, error);
            // Respond 500 to indicate an error processing
            response.status(500).send("Error processing notification.");
        }
    }
    else {
        functions.logger.info("Received notification is not a payment topic or missing ID. Ignoring.");
        // Respond 200 OK to acknowledge other notification types or invalid ones
        response.status(200).send("Notification received but not processed.");
    }
});
//# sourceMappingURL=index.js.map