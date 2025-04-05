import React, { useState, useCallback, useMemo } from 'react'; // Import useMemo
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BrainCircuit, Feather, Sparkles, Loader2, Users, Smile, HeartCrack, Percent } from 'lucide-react'; // Import icons, added Users, Smile, HeartCrack, Percent
import { useChatAnalysis } from '@/context/ChatAnalysisContext'; // Import context hook
import { getFunctions, httpsCallable } from "firebase/functions"; // Import Firebase functions
import { firebaseApp } from '@/firebaseConfig'; // Import Firebase config
import { toast } from 'sonner'; // Import toast
import type { ParsedMessage } from '../lib/parseChat'; // Import ParsedMessage type

// Initialize Firebase Functions
const functions = getFunctions(firebaseApp);
const callGeminiFunction = httpsCallable(functions, 'callGemini');

// Constants for rate limiting
const AI_CALL_LIMIT = 3; // Max calls
const AI_CALL_WINDOW = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper to anonymize messages
const anonymizeMessages = (messages: ParsedMessage[]): string => {
  const senderMap: Record<string, string> = {};
  let senderCounter = 1;
  return messages
    .map(msg => {
      if (!msg.sender || msg.isSystemMessage) return null; // Skip system messages or messages without sender
      if (!senderMap[msg.sender]) {
        senderMap[msg.sender] = `Pessoa ${senderCounter++}`;
      }
      // Format: "Sender: Message"
      return `${senderMap[msg.sender]}: ${msg.message}`;
    })
    .filter(Boolean) // Remove null entries
    .join('\n'); // Join messages with newline
};

// Helper function to shuffle an array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }
  return shuffled;
}

// New component for rendering compatibility
interface RenderCompatibilityProps {
  analysisResults: ReturnType<typeof useChatAnalysis>['analysisResults'];
}

const RenderCompatibility: React.FC<RenderCompatibilityProps> = ({ analysisResults }) => {
  const compatibilityPairs = useMemo(() => {
    if (!analysisResults || !analysisResults.statsPerSender || Object.keys(analysisResults.statsPerSender).length < 2) {
      return { pairs: [], leftover: null };
    }

    const senders = Object.keys(analysisResults.statsPerSender);
    const shuffledSenders = shuffleArray(senders);
    const pairs: { p1: string; p2: string; score: number }[] = [];
    let leftover: string | null = null;

    for (let i = 0; i < shuffledSenders.length; i += 2) {
      if (i + 1 < shuffledSenders.length) {
        const score = Math.floor(Math.random() * 70) + 30; // Random % between 30 and 99
        pairs.push({ p1: shuffledSenders[i], p2: shuffledSenders[i + 1], score });
      } else {
        leftover = shuffledSenders[i]; // Odd one out
      }
    }
    return { pairs, leftover };
  }, [analysisResults]);

  if (!analysisResults || Object.keys(analysisResults.statsPerSender).length < 2) {
    return <p className="text-sm text-gray-500 italic">Compatibilidade aplicável apenas para 2 ou mais participantes.</p>;
  }

  return (
    <div className="space-y-2 text-sm">
      {compatibilityPairs.pairs.map((pair, index) => (
        <div key={index} className="flex items-center justify-between p-1 bg-pink-50 rounded-md">
          <span>{pair.p1} & {pair.p2}</span>
          <span className="font-semibold text-pink-700">{pair.score}% <Percent className="inline h-3 w-3" /></span>
        </div>
      ))}
      {compatibilityPairs.leftover && (
        <div className="flex items-center text-gray-600 italic mt-2">
          <HeartCrack className="w-4 h-4 mr-2 text-gray-500" />
          <span>{compatibilityPairs.leftover} ficou sem par... 😢</span>
        </div>
      )}
    </div>
  );
};


const PremiumPage: React.FC = () => {
  const {
    parsedMessages,
    aiPrediction,
    setAiPrediction,
    aiPoem,
    setAiPoem,
    aiStyleAnalysis,
    setAiStyleAnalysis,
    lastAiCallTime,
    setLastAiCallTime,
    aiCallCount,
    setAiCallCount,
    analysisResults, // Need analysis results for non-AI premium features later
    generatedSign // Get the generated sign from context
  } = useChatAnalysis();

  const [isPredictionLoading, setIsPredictionLoading] = useState(false);
  const [isPoemLoading, setIsPoemLoading] = useState(false);
  const [isStyleLoading, setIsStyleLoading] = useState(false);

  const callAIFeature = useCallback(async (featureType: 'prediction' | 'poem' | 'style') => {
    const now = Date.now();

    // Rate Limiting Check
    if (now - lastAiCallTime < AI_CALL_WINDOW && aiCallCount >= AI_CALL_LIMIT) {
      const timeLeft = Math.ceil((AI_CALL_WINDOW - (now - lastAiCallTime)) / 1000 / 60);
      toast.warning(`Limite de chamadas IA atingido. Tente novamente em ${timeLeft} minuto(s).`);
      return;
    }

    // Reset count if window expired
    const currentCount = now - lastAiCallTime >= AI_CALL_WINDOW ? 1 : aiCallCount + 1;

    if (!parsedMessages || parsedMessages.length === 0) {
      toast.error("Não há mensagens para analisar.");
      return;
    }

    // Set loading state based on feature type
    if (featureType === 'prediction') setIsPredictionLoading(true);
    else if (featureType === 'poem') setIsPoemLoading(true);
    else if (featureType === 'style') setIsStyleLoading(true);

    try {
      // Prepare data for the Cloud Function
      const anonymizedChat = anonymizeMessages(parsedMessages);
      // Limit context size (e.g., last 500 lines or ~4k tokens) - adjust as needed
      const contextLimit = 500;
      const limitedChat = anonymizedChat.split('\n').slice(-contextLimit).join('\n');

      let taskType: "generateCreativeText" | "analyzeCommunicationStyle";
      let payload: any;

      switch (featureType) {
        case 'prediction':
        case 'poem': // Prediction and Poem use the same taskType and similar payload structure
          taskType = "generateCreativeText";
          // The function expects analysis results, not a pre-made prompt
          // We need to get these from the analysisResults in context
          if (!analysisResults) {
            toast.error("Resultados da análise não encontrados para gerar texto criativo.");
            throw new Error("Analysis results missing."); // Throw to exit and reset loading
          }
          // Construct payload based on what the function expects
          const sentimentRatio = analysisResults.keywordCounts.positive / (analysisResults.keywordCounts.negative + 1);
          const sentimentMix = sentimentRatio > 1.5 ? 'Positivo' : sentimentRatio < 0.7 ? 'Negativo' : 'Equilibrado';
          // Note: The function expects 'chatSign', which isn't directly in analysisResults.
          // We might need to pass the heuristic sign generated in ResultsPage or recalculate/simplify here.
          // For now, let's pass a placeholder or omit it if the function handles missing fields.
          payload = {
            mostFrequentEmoji: analysisResults.mostFrequentEmoji,
            favoriteWord: analysisResults.favoriteWord,
            sentimentMix: sentimentMix,
            chatSign: generatedSign || "Indefinido", // Pass the sign from context, with a fallback
            // Add a sub-type to differentiate poem/prediction if needed by the function prompt logic
            creativeType: featureType // Send 'prediction' or 'poem'
          };
          break;
        case 'style':
          taskType = "analyzeCommunicationStyle";
          payload = {
            anonymizedMessages: limitedChat,
            charLimit: contextLimit,
          };
          break;
        default:
           toast.error("Tipo de recurso de IA desconhecido.");
           throw new Error("Unknown AI feature type."); // Throw to exit and reset loading
      }

      toast.info(`Solicitando ${featureType} da IA... Isso pode levar um momento.`);

      // Log the data being sent to the function
      console.log("Calling Cloud Function with:", { taskType, payload });

      // Call the Cloud Function with the correct structure
      const result = await callGeminiFunction({ taskType, payload });
      // The function now returns { success: true, result: "..." }
      const textResult = (result?.data as any)?.result?.trim() || null;

      if (!(result?.data as any)?.success || !textResult) {
        throw new Error("A IA não retornou um resultado válido.");
      }

      // Update context state based on feature type
      if (featureType === 'prediction') setAiPrediction(textResult);
      else if (featureType === 'poem') setAiPoem(textResult);
      else if (featureType === 'style') setAiStyleAnalysis(textResult);

      // Update rate limiting state
      setLastAiCallTime(now);
      setAiCallCount(currentCount);

      // Use featureType for user message, but use taskType for logging if needed
      toast.success(`${featureType.charAt(0).toUpperCase() + featureType.slice(1)} gerado com sucesso!`);

    } catch (error: any) {
       // Check if it's an HttpsError thrown by the function for specific feedback
       if (error.code && error.message) {
         console.error(`Erro da Cloud Function (${error.code}) ao chamar IA para ${featureType}:`, error.message);
         toast.error(`Falha ao gerar ${featureType}: ${error.message}`);
       } else {
         console.error(`Erro inesperado ao chamar IA para ${featureType}:`, error);
         toast.error(`Falha ao gerar ${featureType}. ${error.message || 'Tente novamente mais tarde.'}`);
       }
    } finally {
      // Reset loading state based on feature type
      if (featureType === 'prediction') setIsPredictionLoading(false);
      else if (featureType === 'poem') setIsPoemLoading(false);
      else if (featureType === 'style') setIsStyleLoading(false);
    }
  }, [parsedMessages, analysisResults, generatedSign, lastAiCallTime, aiCallCount, setAiPrediction, setAiPoem, setAiStyleAnalysis, setLastAiCallTime, setAiCallCount]); // Add analysisResults and generatedSign to dependencies


  // TODO: Fetch and display actual non-AI premium content based on context/state (analysisResults)

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col">
      <header className="mb-8 flex items-center justify-between">
        <Link to="/results" className="flex items-center text-blue-600 hover:underline">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Voltar aos Resultados
        </Link>
        <h1 className="text-3xl font-bold text-center text-purple-700">✨ Área Premium ✨</h1>
        <div className="w-20"></div> {/* Spacer */}
      </header>

      <main className="flex-grow">
        <Card className="mb-6 bg-gradient-to-br from-purple-100 to-indigo-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-purple-800">Análises Exclusivas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Aqui você encontrará insights mais profundos e análises avançadas sobre sua conversa.
            </p>
            {/* AI Premium Content */}
            <div className="space-y-4 mb-6">
              {/* AI Prediction Card */}
              <Card className="bg-white p-4">
                <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
                   <CardTitle className="text-lg text-indigo-700 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-yellow-500"/> Previsão do Chat (IA)</CardTitle>
                   <Button size="sm" onClick={() => callAIFeature('prediction')} disabled={isPredictionLoading || isPoemLoading || isStyleLoading}>
                     {isPredictionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4"/>}
                     Gerar
                   </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {isPredictionLoading ? (
                    <p className="text-gray-500 italic">Gerando previsão...</p>
                  ) : aiPrediction ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{aiPrediction}</p>
                  ) : (
                    <p className="text-gray-500 italic">Clique em "Gerar" para obter uma previsão divertida sobre o chat.</p>
                  )}
                </CardContent>
              </Card>

              {/* AI Poem Card */}
              <Card className="bg-white p-4">
                 <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
                   <CardTitle className="text-lg text-indigo-700 flex items-center"><Feather className="w-5 h-5 mr-2 text-blue-500"/> Poema do Chat (IA)</CardTitle>
                   <Button size="sm" onClick={() => callAIFeature('poem')} disabled={isPredictionLoading || isPoemLoading || isStyleLoading}>
                     {isPoemLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Feather className="mr-2 h-4 w-4"/>}
                     Gerar
                   </Button>
                 </CardHeader>
                 <CardContent className="p-0">
                   {isPoemLoading ? (
                     <p className="text-gray-500 italic">Gerando poema...</p>
                   ) : aiPoem ? (
                     <p className="text-gray-700 whitespace-pre-wrap">{aiPoem}</p>
                   ) : (
                     <p className="text-gray-500 italic">Clique em "Gerar" para criar um poema inspirado na conversa.</p>
                   )}
                 </CardContent>
              </Card>

              {/* AI Style Analysis Card */}
              <Card className="bg-white p-4">
                 <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
                   <CardTitle className="text-lg text-indigo-700 flex items-center"><BrainCircuit className="w-5 h-5 mr-2 text-green-500"/> Estilo de Comunicação (IA)</CardTitle>
                   <Button size="sm" onClick={() => callAIFeature('style')} disabled={isPredictionLoading || isPoemLoading || isStyleLoading}>
                     {isStyleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4"/>}
                     Analisar
                   </Button>
                 </CardHeader>
                 <CardContent className="p-0">
                   {isStyleLoading ? (
                     <p className="text-gray-500 italic">Analisando estilo...</p>
                   ) : aiStyleAnalysis ? (
                     <p className="text-gray-700 whitespace-pre-wrap">{aiStyleAnalysis}</p>
                   ) : (
                     <p className="text-gray-500 italic">Clique em "Analisar" para um resumo do estilo de comunicação.</p>
                   )}
                 </CardContent>
              </Card>
            </div>

            {/* Non-AI Premium Content */}
            <h3 className="text-xl font-semibold text-purple-800 mb-3 mt-6">Outras Análises Premium</h3>
            <div className="space-y-4">
              {/* Passive-Aggressive Analysis Card */}
              <Card className="bg-white p-4">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-lg text-indigo-700 flex items-center"><Users className="w-5 h-5 mr-2 text-orange-600"/> Análise Passivo-Agressiva</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {analysisResults ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium">Geral (% msgs):</span>
                        <span className="font-bold text-orange-700">{analysisResults.passiveAggressivePercentage?.toFixed(1) ?? '0.0'}%</span>
                      </div>
                      {Object.keys(analysisResults.statsPerSender).length > 1 && (
                        <div>
                          <h5 className="text-sm font-semibold mt-3 mb-1 text-gray-600">Por Participante:</h5>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {Object.entries(analysisResults.statsPerSender)
                              .sort(([, a], [, b]) => (b.passiveAggressivePercentage ?? 0) - (a.passiveAggressivePercentage ?? 0))
                              .map(([sender, stats]) => (
                                <li key={sender}>
                                  <span className="font-medium">{sender}:</span> {stats.passiveAggressivePercentage?.toFixed(1) ?? '0.0'}%
                                </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Dados de análise não disponíveis.</p>
                  )}
                </CardContent>
              </Card>

              {/* Flirtation Analysis Card */}
              <Card className="bg-white p-4">
                 <CardHeader className="p-0 pb-2">
                   <CardTitle className="text-lg text-indigo-700 flex items-center"><Smile className="w-5 h-5 mr-2 text-pink-500"/> Análise de Flerte</CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                   {analysisResults ? (
                     <div className="space-y-3">
                       <div className="flex justify-between items-center text-base">
                         <span className="font-medium">Geral (% msgs):</span>
                         <span className="font-bold text-pink-600">{analysisResults.flirtationPercentage?.toFixed(1) ?? '0.0'}%</span>
                       </div>
                       {Object.keys(analysisResults.statsPerSender).length > 1 && (
                         <div>
                           <h5 className="text-sm font-semibold mt-3 mb-1 text-gray-600">Por Participante:</h5>
                           <ul className="list-disc list-inside text-sm space-y-1">
                             {Object.entries(analysisResults.statsPerSender)
                               .sort(([, a], [, b]) => (b.flirtationPercentage ?? 0) - (a.flirtationPercentage ?? 0))
                               .map(([sender, stats]) => (
                                 <li key={sender}>
                                   <span className="font-medium">{sender}:</span> {stats.flirtationPercentage?.toFixed(1) ?? '0.0'}%
                                 </li>
                             ))}
                           </ul>
                         </div>
                       )}
                       {/* Compatibility Section */}
                       <div className="pt-3 mt-3 border-t border-gray-200">
                          <h5 className="text-sm font-semibold mb-2 text-gray-600">💘 Compatibilidade Amorosa:</h5>
                          <RenderCompatibility analysisResults={analysisResults} />
                       </div>
                     </div>
                   ) : (
                     <p className="text-gray-500 italic">Dados de análise não disponíveis.</p>
                   )}
                 </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="text-center mt-8 text-gray-500 text-sm">
        Horóscopo das Mensagens © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default PremiumPage;
