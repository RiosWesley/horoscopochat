import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from '@/firebaseConfig';
import { Button } from '@/components/ui/button';
import { Share2, Clock, Award, Star, Gift, MessageSquareText, Users, Laugh, HelpCircle as QuestionIcon, Text, TrendingUp, TrendingDown, UserCircle, Palette, Calendar, Clock1, Smile, Zap, BarChart, PieChart, LineChart, Link as LinkIcon, ClipboardCopy, Loader2 } from 'lucide-react';
import { useChatAnalysis } from '@/context/ChatAnalysisContext';
import GradientBackground from '@/components/GradientBackground';
import ResultCard, { ShareButton } from '@/components/ResultCard';
import { toast } from 'sonner';
import FloatingEmoji from '@/components/FloatingEmoji';
import ContactBubble from '@/components/ContactBubble';
import EmojiCloud from '@/components/EmojiCloud';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import SenderFocus from '@/components/SenderFocus';
import ShareableImage from '@/components/ShareableImage';
import TimelineChart from '@/components/TimelineChart';
import type { AnalysisResults as FullAnalysisResults, SenderStats } from '../lib/analyzeChat';
import type { ParsedMessage } from '../lib/parseChat';
// Import the exported type from functions - Adjust path if build process changes it
import type { AnalysisResultsToSave } from '../../functions/src/index';

// Initialize Firebase Functions for saving/loading
const functions = getFunctions(firebaseApp);
const saveAnalysisFunction = httpsCallable(functions, 'saveAnalysisResults');
const getAnalysisFunction = httpsCallable(functions, 'getAnalysisResults');


// --- Helper Functions ---
const findTopItem = (record: Record<string, number> | undefined | null): string | null => {
  if (!record) return null;
  let topItem: string | null = null;
  let maxCount = 0;
  for (const item in record) {
    if (item && record[item] > 0 && record[item] > maxCount) {
      maxCount = record[item];
      topItem = item;
    }
  }
  return topItem;
};

const formatKeywordCategory = (category: string | null): string | null => {
  if (!category) return null;
  switch (category) {
    case 'laughter': return 'Risadas';
    case 'questions': return 'Perguntas';
    case 'positive': return 'Positividade';
    case 'negative': return 'Intensidade'; // Or 'Negatividade'
    default: return category.charAt(0).toUpperCase() + category.slice(1);
  }
};

// Type guard to check if results are fully loaded from context
function isFullAnalysisResults(results: any): results is FullAnalysisResults {
  // Check for properties that are less likely to be in the saved subset
  return results && typeof results.messagesPerDate !== 'undefined' && typeof results.messagesPerDayOfWeek !== 'undefined';
}


const ResultsPage = () => {
  const navigate = useNavigate();
  const { analysisId } = useParams<{ analysisId?: string }>();
  const [showPremium, setShowPremium] = useState(false);
  const [isPremiumMock, setIsPremiumMock] = useState(false); // For testing premium features locally
  const [timeOfDay, setTimeOfDay] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [sharedLinkId, setSharedLinkId] = useState<string | null>(analysisId || null);
  const [sharedLink, setSharedLink] = useState<string | null>(analysisId ? window.location.href : null);
  const [loadedResults, setLoadedResults] = useState<AnalysisResultsToSave | null>(null); // Use imported type
  const [isLoadingShared, setIsLoadingShared] = useState(!!analysisId);
  const [errorLoadingShared, setErrorLoadingShared] = useState<string | null>(null);

  const context = useChatAnalysis();
  const {
    analysisResults: contextAnalysisResults,
    parsedMessages: contextParsedMessages,
    isLoading: contextIsLoading,
    error: contextError,
    selectedChartView,
    setSelectedChartView,
    focusedSender,
    setFocusedSender,
    resetAnalysis,
    setGeneratedSign,
    aiPrediction,
    aiPoem,
    aiStyleAnalysis,
    generatedSign: contextGeneratedSign,
  } = context;

  // Determine which results to use: loaded from Firestore or from context
  const analysisResults: FullAnalysisResults | AnalysisResultsToSave | null = analysisId ? loadedResults : contextAnalysisResults;
  const isLoading = analysisId ? isLoadingShared : contextIsLoading;
  const error = analysisId ? errorLoadingShared : contextError;
  // Note: parsedMessages are NOT available for shared links for privacy

  const [calculatedDates, setCalculatedDates] = useState<{ activeDays: number; timeSpan: string }>({ activeDays: 0, timeSpan: 'Período Indefinido' });

  // Effect to fetch data if analysisId is present
  useEffect(() => {
    if (analysisId) {
      setIsLoadingShared(true);
      setErrorLoadingShared(null);
      setLoadedResults(null);

      getAnalysisFunction({ analysisId })
        .then((result) => {
          const data = result.data as { success: boolean; results?: AnalysisResultsToSave; message?: string };
          if (data.success && data.results) {
            setLoadedResults(data.results);
            setSharedLinkId(analysisId);
            setSharedLink(window.location.href);
            toast.success("Análise compartilhada carregada!");
          } else {
            throw new Error(data.message || "Falha ao carregar análise compartilhada.");
          }
        })
        .catch((err: any) => {
          console.error("Erro ao buscar análise compartilhada:", err);
          const errorMsg = `Não foi possível carregar a análise (${err.message || 'Erro desconhecido'}). Verifique o link ou tente novamente.`;
          setErrorLoadingShared(errorMsg);
          toast.error(errorMsg);
        })
        .finally(() => {
          setIsLoadingShared(false);
        });
    } else {
      // Clear loaded state if navigating away from a shared link view
      setLoadedResults(null);
      setSharedLinkId(null);
      setSharedLink(null);
      setIsLoadingShared(false);
      setErrorLoadingShared(null);
    }
  }, [analysisId, navigate]);


  // Effect to calculate dates (runs only when not loading shared data)
  useEffect(() => {
    if (!analysisId && contextParsedMessages && contextParsedMessages.length > 0) {
      const validTimestamps = contextParsedMessages
        .map(msg => msg.timestamp)
        .filter((ts): ts is Date => ts !== null)
        .sort((a, b) => a.getTime() - b.getTime());

      if (validTimestamps.length > 0) {
        const firstDate = validTimestamps[0];
        const lastDate = validTimestamps[validTimestamps.length - 1];
        const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const activeDays = diffDays + 1;
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const timeSpan = `${firstDate.toLocaleDateString('pt-BR', options)} - ${lastDate.toLocaleDateString('pt-BR', options)}`;
        setCalculatedDates({ activeDays, timeSpan });
      } else {
         setCalculatedDates({ activeDays: 0, timeSpan: 'Datas inválidas' });
      }
    } else if (!analysisId) {
       setCalculatedDates({ activeDays: 0, timeSpan: 'Nenhuma mensagem válida' });
    }

    // Handle navigation/errors based on the correct loading/error state
    if (!isLoading && !analysisResults && !error && !analysisId) {
      toast.error("Nenhum resultado de análise encontrado.");
      navigate('/instructions');
    }
    if (error && !analysisId) {
       toast.error(`Erro ao carregar resultados: ${error}`);
    }

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setTimeOfDay('Bom dia');
    else if (hour >= 12 && hour < 18) setTimeOfDay('Boa tarde');
    else setTimeOfDay('Boa noite');
  }, [analysisId, contextParsedMessages, isLoading, error, navigate, analysisResults]);


  // --- Heuristics Generation ---
  // Define generateHeuristics function locally or import if moved to utils
  const generateHeuristics = (results: FullAnalysisResults) => {
      let sign = "Explorador do ZapVerso ✨";
      let signDescriptor = "";
      let signoDescription = "Um perfil de chat equilibrado e misterioso.";
      const funFacts: string[] = [];

      if (results.mostActiveHour !== null && results.mostActiveHour !== undefined) {
         if (results.mostActiveHour >= 22 || results.mostActiveHour < 6) { sign = `Coruja Noturna 🦉`; signoDescription = "As madrugadas são seu palco principal para conversas profundas ou divertidas."; }
         else if (results.mostActiveHour >= 6 && results.mostActiveHour < 12) { sign = `Madrugador Tagarela ☀️`; signoDescription = "Você começa o dia com energia total no chat, resolvendo tudo logo cedo."; }
         else if (results.mostActiveHour >= 12 && results.mostActiveHour < 18) { sign = `Vespertino Vibrante 🌇`; signoDescription = "A tarde é seu momento de ouro para interações e trocas de ideias."; }
         else { sign = `Sereno Notívago 🌙`; signoDescription = "Prefere a calma do início da noite para colocar a conversa em dia."; }
      }

      if (results.mostFrequentEmoji && ['😂', '🤣', 'lol'].includes(results.mostFrequentEmoji)) { signDescriptor = "Comediante"; signoDescription += " Seu humor contagiante ilumina o chat!"; }
      else if (results.mostFrequentEmoji && ['❤️', '🥰', '😍'].includes(results.mostFrequentEmoji)) { signDescriptor = "Amoroso"; signoDescription += " O afeto transborda em suas mensagens."; }
      else if (results.mostFrequentKeywordCategory === 'positive' && results.keywordCounts.positive > results.keywordCounts.negative) { signDescriptor = "Otimista"; signoDescription += " Sempre vendo o lado bom e espalhando positividade."; }
      else if (results.mostFrequentKeywordCategory === 'negative' && results.keywordCounts.negative > results.keywordCounts.positive) { signDescriptor = "Intenso"; signoDescription += " Você se expressa com paixão e clareza, mesmo nos momentos difíceis."; }
      else if (results.mostFrequentKeywordCategory === 'questions') { signDescriptor = "Curioso"; signoDescription += " Sua mente está sempre buscando entender e explorar."; }
      else if (results.mostFrequentEmoji) { signDescriptor = `do ${results.mostFrequentEmoji}`; signoDescription += ` O emoji ${results.mostFrequentEmoji} é sua marca registrada!`; }

      if (signDescriptor) { sign = `${signDescriptor} ${sign}`; }
      else if (results.mostFrequentEmoji) {
          signDescriptor = `do ${results.mostFrequentEmoji}`;
          sign = `${signDescriptor} ${sign}`;
          signoDescription += ` O emoji ${results.mostFrequentEmoji} é sua marca registrada!`;
      }

      if (results.mostActiveHour !== null && results.mostActiveHour !== undefined) {
        if (results.mostActiveHour >= 22 || results.mostActiveHour < 6) { funFacts.push("Você brilha mais quando a lua aparece no chat."); }
        else if (results.mostActiveHour >= 12 && results.mostActiveHour < 18) { funFacts.push("A tarde é seu momento de pico nas conversas!"); }
        else { funFacts.push("Manhãs ou noites tranquilas? Seu pico de chat é fora do comum!"); }
      }

      if (results.totalMessages > 500) { funFacts.push(`Com ${results.totalMessages} mensagens, suas conversas renderiam um bom capítulo!`); }
      else if (results.totalMessages < 50) { funFacts.push("Direto ao ponto: poucas mensagens, muita objetividade?"); }
      const senderCount = Object.keys(results.messagesPerSender).length;
      if (senderCount === 1) { funFacts.push("Mestre dos monólogos digitais ou uma conversa muito focada?"); }
      else if (senderCount > 5) { funFacts.push(`Malabarista social! Gerenciando papos com ${senderCount} participantes.`); }
      if (results.mostFrequentEmoji) { funFacts.push(`Seu emoji ${results.mostFrequentEmoji} aparece com frequência, revelando um traço marcante!`); }
      if (results.keywordCounts.laughter > results.keywordCounts.questions && results.keywordCounts.laughter > 5) { funFacts.push("Seu bom humor transparece nas mensagens! Muitas risadas detectadas."); }
      else if (results.keywordCounts.questions > results.keywordCounts.laughter && results.keywordCounts.questions > 5) { funFacts.push("Curiosidade em alta! Você faz bastante perguntas."); }
      if (results.averageMessageLength > 100) { funFacts.push("Você gosta de detalhar! Suas mensagens costumam ser longas."); }
      else if (results.averageMessageLength < 20) { funFacts.push("Direto e reto! Suas mensagens são curtinhas."); }
      else if (funFacts.length < 3) { funFacts.push("Suas mensagens têm um tamanho equilibrado, nem muito longas, nem muito curtas."); }
      if (results.punctuationEmphasisCount > 5) { funFacts.push("Você gosta de dar ênfase!!! Isso demonstra intensidade."); }
      else if (results.punctuationEmphasisCount > 0) { funFacts.push("Uma exclamaçãozinha extra aqui e ali para dar um toque especial!"); }
      if (results.capsWordCount > 10) { funFacts.push("Às vezes você GRITA no chat? Notamos um uso frequente de CAPS."); }
      else if (results.capsWordCount > 0) { funFacts.push("Um CAPS LOCK ocasional para destacar o ponto principal."); }
      const sentimentRatio = results.keywordCounts.positive / (results.keywordCounts.negative + 1);
      if (sentimentRatio > 2) { funFacts.push("Sua vibe é majoritariamente positiva, espalhando boas energias!"); }
      else if (sentimentRatio < 0.5 && results.keywordCounts.negative > 3) { funFacts.push("Um toque de realismo (ou seria intensidade?) marca suas conversas."); }
      const sortedSenders = Object.entries(results.messagesPerSender).sort(([, countA], [, countB]) => countB - countA);
      if (sortedSenders.length > 2 && sortedSenders[0][1] > (results.totalMessages * 0.3)) { funFacts.push(`Parece que ${sortedSenders[0][0]} domina a conversa por aqui!`); }

      const defaultFacts = ["Seu estilo de chat é único como uma impressão digital cósmica.", "Há mais segredos escondidos nas entrelinhas...", "Cada mensagem sua carrega uma energia particular."];
      let factIndex = 0;
      while (funFacts.length < 3 && factIndex < defaultFacts.length) { if (!funFacts.includes(defaultFacts[factIndex])) { funFacts.push(defaultFacts[factIndex]); } factIndex++; }

      return { generatedSign: sign, generatedSignoDescription: signoDescription, generatedFunFacts: funFacts.slice(0, 3) };
  };

  const { generatedSign: calculatedSign, generatedSignoDescription, generatedFunFacts } = useMemo(() => {
    // Only generate heuristics if we have the full analysis results from context
    if (analysisResults && isFullAnalysisResults(analysisResults)) {
        return generateHeuristics(analysisResults);
    }
    // If loading shared results or full results are unavailable, return defaults
    return {
        generatedSign: "Explorador do ZapVerso ✨", // Default sign
        generatedSignoDescription: null, // Description not available for shared
        generatedFunFacts: [] // Fun facts not available for shared
    };
  }, [analysisResults]);

  // Update context only if we calculated the sign from context data
  useEffect(() => {
    if (!analysisId && calculatedSign && setGeneratedSign) {
      setGeneratedSign(calculatedSign);
    }
  }, [analysisId, calculatedSign, setGeneratedSign]);

  // Use the sign from the correct source
  // If analysisId exists, display a generic placeholder as sign is not saved
  // Otherwise, use the calculatedSign from heuristics
  const displaySign = analysisId ? "Signo (Compartilhado)" : (calculatedSign ?? "Signo Indefinido");

  // --- Emoji Cloud Data ---
  const emojiCloudData = useMemo(() => {
    if (!analysisResults?.emojiCounts) return [];
    return Object.entries(analysisResults.emojiCounts)
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count);
  }, [analysisResults]);


  const shareableImageRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (!shareableImageRef.current) {
      toast.error("Erro ao encontrar o componente para compartilhar.");
      return;
    }
    toast.info("Gerando imagem para compartilhar...");

    try {
      const canvas = await html2canvas(shareableImageRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Falha ao gerar imagem (Blob).");
          return;
        }

        const file = new File([blob], "horoscopo-chat.png", { type: "image/png" });
        const shareData = {
          files: [file],
          title: 'Meu Horóscopo de Chat!',
          text: `Veja meu resultado no Horóscopo das Mensagens: ${displaySign}`,
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            toast.success("Compartilhado com sucesso!");
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              console.error("Erro ao compartilhar:", err);
              toast.error(`Erro ao compartilhar: ${(err as Error).message}`);
            }
          }
        } else {
          toast.info("API de compartilhamento não suportada. Iniciando download...");
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'horoscopo-chat.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
          toast.success("Imagem baixada! Agora você pode compartilhar manualmente.");
        }
      }, "image/png");

    } catch (error) {
      console.error("Erro ao gerar imagem com html2canvas:", error);
      toast.error("Ocorreu um erro ao gerar a imagem para compartilhar.");
    }
  };

  const handleAnalyzeAnother = () => {
    if (resetAnalysis) {
      resetAnalysis();
    }
    navigate('/instructions', { replace: true });
    toast.info("Pronto para analisar um novo chat!");
  };

  const handlePremiumClick = () => setShowPremium(true);
  const handleBackToResults = () => setShowPremium(false);
  const handleSubscribe = () => { toast.success('Obrigado por se interessar! Em um app real, isto processaria sua assinatura.'); setTimeout(() => setShowPremium(false), 1500); };

  const handleSenderClick = (sender: string) => {
    if (!analysisId) {
      setFocusedSender(sender);
      toast.info(`Analisando ${sender}...`);
    }
  };

  // --- Function to Save Analysis and Generate Link ---
  const handleSaveAndShare = async () => {
    // Use context results for saving, ensure they exist
    if (!contextAnalysisResults) { // Removed check for contextGeneratedSign as it's not saved
       toast.error("A análise original não está disponível para salvar.");
       return;
    }
    if (sharedLinkId) {
       toast.info("O link já foi gerado para esta análise.");
       return;
    }

    setIsSaving(true);
    toast.info("Salvando análise e gerando link...");

    // Prepare data payload - select ONLY non-sensitive fields from context results
    // Ensure the fields match the AnalysisResultsToSave interface
    const dataToSave: Omit<AnalysisResultsToSave, 'createdAt'> = {
        totalMessages: contextAnalysisResults.totalMessages,
        messagesPerSender: contextAnalysisResults.messagesPerSender,
        emojiCounts: contextAnalysisResults.emojiCounts,
        mostFrequentEmoji: contextAnalysisResults.mostFrequentEmoji,
        // Explicitly map required keyword counts
        keywordCounts: {
            laughter: contextAnalysisResults.keywordCounts['laughter'] ?? 0,
            questions: contextAnalysisResults.keywordCounts['questions'] ?? 0,
            positive: contextAnalysisResults.keywordCounts['positive'] ?? 0,
            negative: contextAnalysisResults.keywordCounts['negative'] ?? 0,
        },
        averageMessageLength: contextAnalysisResults.averageMessageLength,
        favoriteWord: contextAnalysisResults.favoriteWord,
        punctuationEmphasisCount: contextAnalysisResults.punctuationEmphasisCount,
        capsWordCount: contextAnalysisResults.capsWordCount,
        topExpressions: contextAnalysisResults.topExpressions,
        // Ensure statsPerSender matches the expected structure
        statsPerSender: Object.entries(contextAnalysisResults.statsPerSender).reduce((acc, [sender, stats]) => {
            // Explicitly pick fields and map keywordCounts for each sender
            // Use the specific type from AnalysisResultsToSave['statsPerSender'][string]
            const senderData: AnalysisResultsToSave['statsPerSender'][string] = {
                messageCount: stats.messageCount,
                averageLength: stats.averageLength,
                emojiCounts: stats.emojiCounts,
                keywordCounts: { // Explicitly map required keyword counts
                    laughter: stats.keywordCounts['laughter'] ?? 0,
                    questions: stats.keywordCounts['questions'] ?? 0,
                    positive: stats.keywordCounts['positive'] ?? 0,
                    negative: stats.keywordCounts['negative'] ?? 0,
                },
                passiveAggressivePercentage: stats.passiveAggressivePercentage,
                flirtationPercentage: stats.flirtationPercentage,
                // averageResponseTimeMinutes: stats.averageResponseTimeMinutes, // Uncomment if saving this
            };
            acc[sender] = senderData;
            return acc;
        }, {} as AnalysisResultsToSave['statsPerSender']), // Use the specific type from AnalysisResultsToSave
        passiveAggressivePercentage: contextAnalysisResults.passiveAggressivePercentage,
        flirtationPercentage: contextAnalysisResults.flirtationPercentage,
        aiPrediction: aiPrediction,
        aiPoem: aiPoem,
        aiStyleAnalysis: aiStyleAnalysis,
        // generatedSign: contextGeneratedSign, // DO NOT SAVE - Calculated client-side
        isPremiumAnalysis: isPremiumMock, // Save the premium status flag
    };

    try {
        const result = await saveAnalysisFunction(dataToSave);
        const saveData = result.data as { success: boolean; analysisId?: string; message?: string };

        if (saveData.success && saveData.analysisId) {
            const newId = saveData.analysisId;
            setSharedLinkId(newId);
            const newUrl = `${window.location.origin}/results/${newId}`;
            setSharedLink(newUrl);
            navigate(`/results/${newId}`, { replace: true });
            toast.success("Análise salva! Link de compartilhamento gerado.");
        } else {
            throw new Error(saveData.message || "Falha ao salvar análise.");
        }
    } catch (error: any) {
        console.error("Erro ao salvar análise:", error);
        toast.error(`Falha ao salvar: ${error.message || 'Erro desconhecido.'}`);
        setSharedLinkId(null);
        setSharedLink(null);
    } finally {
        setIsSaving(false);
    }
  };


  const { activeDays, timeSpan } = calculatedDates;

  // --- Mock Results Title --- (Only used when not shared)
  const mockResults = {
    title: "Seu Horóscopo de Chat!",
  };
  const genericChatName = "Sua Conversa";

  // --- Render Logic ---

  if (isLoading) {
    return (
      <GradientBackground>
        <div className="flex items-center justify-center h-screen text-white text-xl">
          {analysisId ? "Carregando análise compartilhada..." : "Carregando resultados..."} ✨
        </div>
      </GradientBackground>
    );
  }

  if (analysisId && errorLoadingShared) {
     return (
      <GradientBackground>
        <div className="flex flex-col items-center justify-center h-screen text-white p-4">
          <h1 className="text-2xl font-bold mb-4">Oops! Algo deu errado.</h1>
          <p className="text-center mb-6">{errorLoadingShared}</p>
          <Button onClick={() => navigate('/instructions')} className="cosmic-btn">
            Analisar um Chat
          </Button>
        </div>
      </GradientBackground>
     );
  }

  if (!analysisResults && !analysisId) {
     return (
      <GradientBackground>
        <div className="flex flex-col items-center justify-center h-screen text-white p-4">
          <h1 className="text-2xl font-bold mb-4">Oops! Algo deu errado.</h1>
          <p className="text-center mb-6">{contextError || "Não foi possível carregar os resultados da análise."}</p>
          <Button onClick={() => navigate('/instructions')} className="cosmic-btn">
            Tentar Novamente
          </Button>
        </div>
      </GradientBackground>
     );
  }

  if (!analysisResults) {
     return <GradientBackground><div className="text-white p-4">Erro inesperado: Resultados da análise são nulos.</div></GradientBackground>;
  }


  return (
    <GradientBackground>
      <div className="flex flex-col min-h-screen pb-24 px-4 pt-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
             <h2 className="text-lg font-medium opacity-80">{timeOfDay}, Astroanalista!</h2>
             <h1 className="text-3xl font-bold">{analysisId ? "Análise Compartilhada" : mockResults.title}</h1>
          </div>
          {!analysisId && (
             <Badge variant="outline" className="bg-white/20">
               <Calendar className="h-3.5 w-3.5 mr-1" />
               <span className="text-xs">{activeDays} dia{activeDays !== 1 ? 's' : ''}</span>
             </Badge>
          )}
        </div>

        {/* Chat Info Strip */}
        <div className="bg-white/10 rounded-xl p-3 mb-6 flex justify-between items-center">
          <div>
             <h3 className="font-medium">{analysisId ? "Resultado Salvo" : genericChatName}</h3>
             {!analysisId && <p className="text-xs opacity-70">{timeSpan}</p>}
          </div>
          <div className="text-right">
             <p className="font-bold">{analysisResults.totalMessages ?? 'N/A'}</p>
             <p className="text-xs opacity-70">mensagens</p>
          </div>
        </div>

        {/* Generated Sign Card */}
        <div className="cosmic-card bg-gradient-purple-pink text-white mb-8">
          <div className="text-center">
            <FloatingEmoji emoji="✨" size="md" />
            <h2 className="text-2xl font-bold my-2">{displaySign || "Signo Indefinido"}</h2>
            {/* Show description only if available and not shared */}
            {!analysisId && generatedSignoDescription && <p className="text-sm opacity-90 px-4">{generatedSignoDescription}</p>}
            <FloatingEmoji emoji="✨" size="md" />
          </div>
        </div>

        {/* Participants Card */}
        <ResultCard title="Participantes" variant="primary">
          <div className="space-y-4">
            {!analysisId && <p className="text-sm opacity-80 mb-2">Clique em um participante para ver detalhes:</p>}
            <div className="flex flex-wrap gap-2 justify-center">
              {analysisResults.messagesPerSender && Object.entries(analysisResults.messagesPerSender)
                .sort(([, countA], [, countB]) => (countB ?? 0) - (countA ?? 0))
                .map(([sender, count]) => (
                  <div
                    key={sender}
                    className={`transition-transform ${!analysisId ? 'cursor-pointer hover:scale-105' : ''}`}
                    onClick={() => !analysisId && handleSenderClick(sender)}
                  >
                    <ContactBubble
                      name={sender}
                      messageCount={count ?? 0}
                    />
                  </div>
                ))}
            </div>
          </div>
        </ResultCard>

        {/* Activity Card */}
        {isFullAnalysisResults(analysisResults) && !analysisId && (
          <ResultCard title="Atividade do Chat" variant="default">
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <ToggleGroup type="single" value={selectedChartView} onValueChange={(value) => value && setSelectedChartView(value as any)}>
                  <ToggleGroupItem value="daily" aria-label="Daily View" className="flex gap-1 items-center">
                    <LineChart className="h-3.5 w-3.5" /> Dias
                  </ToggleGroupItem>
                  <ToggleGroupItem value="weekly" aria-label="Weekly View" className="flex gap-1 items-center">
                    <BarChart className="h-3.5 w-3.5" /> Semanas
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              {selectedChartView === 'daily' && analysisResults.messagesPerDate && (
                <TimelineChart
                  data={Object.entries(analysisResults.messagesPerDate).map(([date, count]) => ({ name: date, value: count }))}
                  viewType="daily"
                />
              )}
              {selectedChartView === 'weekly' && analysisResults.messagesPerDayOfWeek && (
                 <TimelineChart
                   data={Object.entries(analysisResults.messagesPerDayOfWeek).map(([dayIndex, count]) => ({ name: dayIndex, value: count }))}
                   viewType="weekly"
                 />
              )}
            </div>
          </ResultCard>
        )}

        {/* Overview Card */}
        <ResultCard title="Visão Geral do Chat" variant="default">
           <div className="space-y-3">
             <div className="flex justify-between items-center"><span className="font-medium flex items-center"><MessageSquareText className="w-4 h-4 mr-2 opacity-70"/>Total de Mensagens:</span><span className="font-bold text-lg">{analysisResults.totalMessages ?? 'N/A'}</span></div>
             <div className="flex justify-between items-center"><span className="font-medium flex items-center"><Text className="w-4 h-4 mr-2 opacity-70"/>Tamanho Médio:</span><span className="font-bold text-lg">{analysisResults.averageMessageLength?.toFixed(0) ?? 'N/A'} <span className="text-xs opacity-70">caracteres</span></span></div>
             {isFullAnalysisResults(analysisResults) && analysisResults.mostFrequentKeywordCategory === 'laughter' && (<p className="text-sm opacity-80 pt-1 flex items-center"><Laugh className="w-4 h-4 mr-1 text-yellow-500"/> Clima geral: Descontraído</p>)}
             {isFullAnalysisResults(analysisResults) && analysisResults.mostFrequentKeywordCategory === 'questions' && (<p className="text-sm opacity-80 pt-1 flex items-center"><QuestionIcon className="w-4 h-4 mr-1 text-blue-500"/> Clima geral: Investigativo</p>)}
           </div>
        </ResultCard>

        {/* Per-Sender Analysis */}
        {analysisResults.statsPerSender && Object.keys(analysisResults.statsPerSender).length > 1 && (
          <ResultCard title="Análise por Participante" variant="secondary">
            <div className="space-y-4">
              {Object.entries(analysisResults.statsPerSender)
                .sort(([, statsA], [, statsB]) => (statsB?.messageCount ?? 0) - (statsA?.messageCount ?? 0))
                .map(([sender, stats]) => {
                  const safeStats = stats || {};
                  // Ensure keywordCounts exists before calculating ratio
                  const senderSentimentRatio = (safeStats.keywordCounts?.positive ?? 0) / ((safeStats.keywordCounts?.negative ?? 0) + 1);
                  const topSenderEmoji = findTopItem(safeStats.emojiCounts);
                  const topSenderKeywordCat = findTopItem(safeStats.keywordCounts);

                  return (
                    <div
                      key={sender}
                      className={`border-b border-gray-300/30 pb-3 last:border-b-0 rounded-md p-2 transition-colors ${!analysisId ? 'hover:bg-white/5 cursor-pointer' : ''} ${sender === focusedSender ? 'bg-white/10' : ''}`}
                      onClick={() => !analysisId && handleSenderClick(sender)}
                    >
                      <h4 className="font-semibold mb-1 flex items-center"><UserCircle className="w-4 h-4 mr-2 opacity-70"/>{sender}</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs opacity-80">
                        <span>{safeStats.messageCount ?? 0} msg{(safeStats.messageCount ?? 0) > 1 ? 's' : ''}</span>
                        <span>Média: {safeStats.averageLength?.toFixed(0) ?? 'N/A'} chars</span>
                        {topSenderEmoji && <span className="truncate flex items-center"><Smile className="w-3.5 h-3.5 mr-1"/> {topSenderEmoji}</span>}
                        {topSenderKeywordCat && <span className="truncate flex items-center"><Zap className="w-3.5 h-3.5 mr-1"/> {formatKeywordCategory(topSenderKeywordCat)}</span>}
                        {/* Check for averageResponseTimeMinutes specifically */}
                        {safeStats.averageResponseTimeMinutes !== undefined && safeStats.averageResponseTimeMinutes !== null ? (
                          <span className="truncate flex items-center"><Clock1 className="w-3.5 h-3.5 mr-1"/> Resposta: {safeStats.averageResponseTimeMinutes} min</span>
                        ) : !analysisId ? (
                          <span className="truncate flex items-center text-gray-400"><Clock1 className="w-3.5 h-3.5 mr-1"/> Sem respostas</span>
                        ) : null}
                        <span className="col-span-2 sm:col-span-1">
                          Vibe: {senderSentimentRatio > 1.5 ? <TrendingUp className="w-4 h-4 inline text-green-400" /> : senderSentimentRatio < 0.7 ? <TrendingDown className="w-4 h-4 inline text-red-400" /> : <span className="text-gray-400">~</span>}
                        </span>
                        {/* Show premium stats if the analysis was saved as premium OR if premium mock is active */}
                        {(loadedResults?.isPremiumAnalysis || (!analysisId && isPremiumMock)) && (
                          <>
                            <span className="truncate flex items-center text-yellow-400"><Users className="w-3.5 h-3.5 mr-1"/> P.A.: {safeStats.passiveAggressivePercentage?.toFixed(1) ?? '0.0'}%</span>
                            <span className="truncate flex items-center text-pink-200"><Smile className="w-3.5 h-3.5 mr-1"/> Flerte: {safeStats.flirtationPercentage?.toFixed(1) ?? '0.0'}%</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
              })}
            </div>
          </ResultCard>
        )}

        {/* Sentiment Mix Card */}
        <ResultCard title="Mix de Vibrações" variant="default">
          {analysisResults.keywordCounts && (analysisResults.keywordCounts.positive > 0 || analysisResults.keywordCounts.negative > 0) ? (
            <div className="space-y-2">
              <div className="flex items-center mb-2"><span className="mr-2 opacity-80">Balanço Energético:</span></div>
              <div className="w-full bg-gray-200 rounded-full h-6 flex overflow-hidden">
                {analysisResults.keywordCounts.positive > 0 && (<div className="h-6 bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-xs text-white font-medium" style={{ width: `${(analysisResults.keywordCounts.positive / (analysisResults.keywordCounts.positive + analysisResults.keywordCounts.negative + 0.001)) * 100}%` }} title={`Positivas: ${analysisResults.keywordCounts.positive}`}>Positiva</div>)}
                {analysisResults.keywordCounts.negative > 0 && (<div className="h-6 bg-gradient-to-r from-red-400 to-rose-500 flex items-center justify-center text-xs text-white font-medium" style={{ width: `${(analysisResults.keywordCounts.negative / (analysisResults.keywordCounts.positive + analysisResults.keywordCounts.negative + 0.001)) * 100}%` }} title={`Negativas: ${analysisResults.keywordCounts.negative}`}>Negativa</div>)}
              </div>
              <p className="text-xs text-center opacity-70 pt-1">Baseado na contagem de palavras-chave positivas e negativas.</p>
            </div>
          ) : (<p className="text-sm opacity-70 text-center py-4">Não foi possível determinar o balanço de vibrações.</p>)}
        </ResultCard>

        {/* Expressions Card */}
        <ResultCard title="Suas Expressões Favoritas" variant="primary">
          <div className="space-y-4">
            {analysisResults.topExpressions && analysisResults.topExpressions.length > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {analysisResults.topExpressions.map((exp, index) => (
                  <div key={index} className="bg-white/20 rounded-full px-3 py-1.5 text-sm font-medium">
                    {exp.text} <span className="opacity-70 text-xs">({exp.count}x)</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm opacity-70 text-center">Nenhuma expressão recorrente encontrada.</p>
            )}

            <Separator className="bg-white/20" />

            {analysisResults.favoriteWord ? (
              <div className="text-center">
                <p className="text-sm opacity-80">Sua palavra favorita é:</p>
                <div className="inline-block bg-gradient-to-r from-cosmic-pink to-cosmic-purple text-white font-bold px-4 py-2 rounded-full mt-2">
                  {analysisResults.favoriteWord}
                </div>
              </div>
            ) : (
              <p className="text-sm opacity-70 text-center">Nenhuma palavra favorita identificada.</p>
            )}
          </div>
        </ResultCard>

        {/* Highlights Card */}
        <ResultCard title="Destaques do Chat" variant="primary">
          <div className="space-y-4">
            {analysisResults.mostFrequentEmoji ? (<> <div className="flex justify-between items-center"><span className="font-medium">Emoji Principal:</span><span className="text-4xl">{analysisResults.mostFrequentEmoji}</span></div> <p className="text-sm">Seu espírito animal digital é o {analysisResults.mostFrequentEmoji}!</p> </>) : (<p className="text-sm opacity-70">Nenhum emoji frequente encontrado.</p>)}
            {/* Most Active Hour might not be saved, handle this */}
            {isFullAnalysisResults(analysisResults) && analysisResults.mostActiveHour !== undefined && analysisResults.mostActiveHour !== null ? (<> <div className="flex items-center"><Clock className="h-5 w-5 mr-2" /><span className="font-medium">Horário Nobre: </span><span className="ml-2 bg-white/30 px-2 py-0.5 rounded font-bold">{`${analysisResults.mostActiveHour.toString().padStart(2, '0')}:00 - ${(analysisResults.mostActiveHour + 1).toString().padStart(2, '0')}:00`}</span></div> <p className="text-sm">Sua energia de chat bomba entre <strong>{analysisResults.mostActiveHour}:00</strong> e <strong>{(analysisResults.mostActiveHour + 1)}:00</strong>.</p> </>) : analysisId ? null : (<p className="text-sm opacity-70">Não foi possível determinar o horário nobre.</p>)}
            {analysisResults.favoriteWord ? (<div className="flex justify-between items-center pt-2"><span className="font-medium">Palavra Favorita:</span><span className="bg-white/30 px-3 py-1 rounded-full font-bold">{analysisResults.favoriteWord}</span></div>) : (<div className="flex justify-between items-center pt-2"><span className="font-medium">Palavra Favorita:</span><span className="text-sm opacity-70">Nenhuma palavra marcante encontrada.</span></div>)}
          </div>
        </ResultCard>

        {/* Emoji Cloud Card */}
        <ResultCard title="Seu Universo de Emoji" variant="secondary">
          {emojiCloudData.length > 0 ? (
             <EmojiCloud emojis={emojiCloudData} />
          ) : (
             <p className="text-sm opacity-70 text-center py-4">Nenhum emoji encontrado.</p>
          )}
        </ResultCard>

        {/* Fun Facts Card - Hide if shared link as they are generated dynamically */}
        {!analysisId && (
          <ResultCard title="Pequenas Verdades Cósmicas" variant="accent">
             {generatedFunFacts.length > 0 ? (<ul className="space-y-3">{generatedFunFacts.map((fact, index) => (<li key={index} className="flex items-start"><span className="mr-2 text-lg">•</span><span>{fact}</span></li>))}</ul>) : (<p className="text-sm opacity-70 text-center py-4">Nenhuma verdade cósmica encontrada por enquanto.</p>)}
          </ResultCard>
        )}

        {/* --- Premium Section --- */}
        {/* Show premium stats if viewing a saved analysis that was premium OR has AI results, OR if premium mock is active (and not viewing shared) */}
        {(analysisId && (loadedResults?.isPremiumAnalysis || loadedResults?.aiPrediction || loadedResults?.aiPoem || loadedResults?.aiStyleAnalysis)) || (!analysisId && isPremiumMock) ? (
          <>
            {/* Premium Stats Card (PA & Flirt) - Now shown if premium or shared */}
            {/* Also ensure the specific percentages exist before rendering the card */}
            {(analysisResults.passiveAggressivePercentage !== null || analysisResults.flirtationPercentage !== null) && (
              <ResultCard title="Análises Premium (PA/Flerte)" variant="accent">
                <div className="space-y-3">
                  {analysisResults.passiveAggressivePercentage !== null && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium flex items-center"><Users className="w-4 h-4 mr-2 opacity-70"/>Passivo-Agressivo (% msgs):</span>
                      <span className="font-bold text-lg">{analysisResults.passiveAggressivePercentage?.toFixed(1) ?? '0.0'}%</span>
                    </div>
                  )}
                  {analysisResults.flirtationPercentage !== null && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium flex items-center"><Smile className="w-4 h-4 mr-2 opacity-70"/>Flerte (% msgs):</span>
                      <span className="font-bold text-lg">{analysisResults.flirtationPercentage?.toFixed(1) ?? '0.0'}%</span>
                    </div>
                  )}
                  <p className="text-xs opacity-70 pt-1">Porcentagem de mensagens com indicadores passivo-agressivos ou de flerte.</p>
                </div>
              </ResultCard>
            )}
            {/* Display AI results if they exist in loaded data */}
            {analysisId && (loadedResults?.aiPrediction || loadedResults?.aiPoem || loadedResults?.aiStyleAnalysis) && (
              <ResultCard title="Resultados da IA (Salvos)" variant="secondary" className="mt-4">
                <div className="space-y-3 text-sm">
                  {loadedResults?.aiPrediction && <div><h4 className="font-semibold mb-1 text-indigo-700">🔮 Previsão:</h4><p className="text-gray-700 whitespace-pre-wrap">{loadedResults.aiPrediction}</p></div>}
                  {loadedResults?.aiPoem && <div className="mt-2 pt-2 border-t"><h4 className="font-semibold mb-1 text-indigo-700">✍️ Poema:</h4><p className="text-gray-700 whitespace-pre-wrap">{loadedResults.aiPoem}</p></div>}
                  {loadedResults?.aiStyleAnalysis && <div className="mt-2 pt-2 border-t"><h4 className="font-semibold mb-1 text-indigo-700">🎭 Estilo:</h4><p className="text-gray-700 whitespace-pre-wrap">{loadedResults.aiStyleAnalysis}</p></div>}
                </div>
              </ResultCard>
            )}
            {/* Button to navigate to the dedicated premium area (only if not shared link AND premium mock is active) */}
            {!analysisId && isPremiumMock && (
              <div className="mt-4 mb-2 flex justify-center">
                <Button
                  onClick={() => navigate('/premium')}
                  className="bg-gradient-to-r from-cosmic-purple to-cosmic-pink hover:from-cosmic-purple/90 hover:to-cosmic-pink/90 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  Ver Área Premium Completa ✨
                </Button>
              </div>
            )}
          </>
        ) : ( // Show upsell only if not viewing shared link AND not premium mock
           !analysisId && !isPremiumMock && (
             <ResultCard title="Desbloqueie Análises Premium ✨" variant="accent">
               <div className="text-center py-4">
                 <p className="mb-3">Obtenha insights sobre flerte, passivo-agressividade, IA e mais com o Premium!</p>
                 <Button onClick={handlePremiumClick} size="sm" className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white">Ver Vantagens Premium</Button>
               </div>
             </ResultCard>
           )
        )}

        {/* --- Action Buttons --- */}

        {/* Save/Share Button & Link Display */}
        {!analysisId && ( // Only show save button if not viewing a shared link
          <div className="my-4 flex flex-col items-center space-y-2">
             <Button onClick={handleSaveAndShare} disabled={isSaving || !!sharedLinkId} variant="outline" size="sm">
               {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
               {sharedLinkId ? 'Link Gerado!' : 'Salvar e Gerar Link'}
             </Button>
             {sharedLink && (
               <div className="flex items-center space-x-2 p-2 bg-black/20 rounded-md text-xs w-full max-w-md">
                 <input
                   type="text"
                   value={sharedLink}
                   readOnly
                   className="flex-grow bg-transparent outline-none text-white/80"
                   onFocus={(e) => e.target.select()}
                 />
                 <Button
                   size="icon"
                   variant="ghost"
                   className="h-6 w-6"
                   onClick={() => {
                     navigator.clipboard.writeText(sharedLink);
                     toast.success("Link copiado!");
                   }}
                 >
                   <ClipboardCopy className="h-4 w-4" />
                 </Button>
               </div>
             )}
          </div>
        )}

        {/* Temporary Button to Toggle Premium Mock Status (Hide if shared link) */}
        {!analysisId && (
          <div className="my-4 flex justify-center">
             <Button onClick={() => setIsPremiumMock(!isPremiumMock)} variant="outline" size="sm">
               {isPremiumMock ? 'Desativar Premium (Teste)' : 'Ativar Premium (Teste)'}
             </Button>
          </div>
        )}

        {/* Bottom Buttons */}
        <div className="mt-8 mb-4">
           {/* Premium Upsell Button (Hide if shared link or already premium) */}
           {!analysisId && !isPremiumMock && (
             <Button onClick={handlePremiumClick} className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-semibold py-4 rounded-xl shadow-lg">Desbloqueie Análises Premium ✨</Button>
           )}
        </div>
        <div className="flex justify-center space-x-4 mb-16">
           {/* Analyze Another Button (Always show?) */}
           <Button onClick={handleAnalyzeAnother} variant="outline" size="sm" className="border-white/30 bg-white/10 text-sm">Analisar Outro Chat</Button>
           {/* Tutorial Button (Always show?) */}
           <Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-sm">Ver Tutorial</Button>
        </div>
        {/* Share Button (Always show?) */}
        <ShareButton onClick={handleShare} />
      </div>

      {/* Sender Focus Modal (Hide if shared link) */}
      {!analysisId && focusedSender && analysisResults?.statsPerSender?.[focusedSender] && (
        <SenderFocus
          sender={focusedSender}
          // Cast needed here, ensure the data passed is compatible with SenderStats expected by SenderFocus
          stats={analysisResults.statsPerSender[focusedSender] as SenderStats}
          onClose={() => setFocusedSender(null)}
        />
      )}

      {/* Hidden Shareable Image Component - Positioned off-screen */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <ShareableImage
          ref={shareableImageRef}
          totalMessages={analysisResults.totalMessages ?? 0}
          generatedSign={displaySign}
          generatedSignoDescription={!analysisId ? generatedSignoDescription : undefined} // Only pass if not shared
          mostFrequentEmoji={analysisResults.mostFrequentEmoji}
        />
      </div>
    </GradientBackground>
  );
};

export default ResultsPage;