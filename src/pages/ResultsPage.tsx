import React, { useState, useEffect, useRef, useCallback } from 'react'; // Import useRef, useCallback
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas'; // Import html2canvas
// Removed Firebase functions imports as AI calls are now in PremiumPage
// import { getFunctions, httpsCallable } from "firebase/functions";
// import { firebaseApp } from '@/firebaseConfig';
import { Button } from '@/components/ui/button';
// Removed BrainCircuit, Sparkles from imports as they are no longer used for AI sections
import { Share2, Clock, Award, Star, Gift, MessageSquareText, Users, Laugh, HelpCircle as QuestionIcon, Text, TrendingUp, TrendingDown, UserCircle, Palette, Calendar, Clock1, Smile, Zap, BarChart, PieChart, LineChart } from 'lucide-react';
import { useChatAnalysis } from '@/context/ChatAnalysisContext';
import GradientBackground from '@/components/GradientBackground';
import ResultCard, { ShareButton } from '@/components/ResultCard';
import { toast } from 'sonner';
import FloatingEmoji from '@/components/FloatingEmoji';
import SentimentChart from '@/components/SentimentChart';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import ContactBubble from '@/components/ContactBubble';
import EmojiCloud from '@/components/EmojiCloud';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import SenderFocus from '@/components/SenderFocus';
import ShareableImage from '@/components/ShareableImage';
import TimelineChart from '@/components/TimelineChart'; // Import the new chart component
import type { AnalysisResults, SenderStats } from '../lib/analyzeChat';
import type { ParsedMessage } from '../lib/parseChat';

// Removed Firebase Functions initialization as AI calls are now in PremiumPage
// const functions = getFunctions(firebaseApp);
// const callGeminiFunction = httpsCallable(functions, 'callGemini');

// --- Helper Functions ---
const findTopItem = (record: Record<string, number>): string | null => {
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

const ResultsPage = () => {
  const navigate = useNavigate();
  const [showPremium, setShowPremium] = useState(false); // For the premium upsell screen
  const [isPremiumMock, setIsPremiumMock] = useState(false); // To simulate premium status
  const [timeOfDay, setTimeOfDay] = useState<string>('');
  // Removed AI Feature State and Rate Limiting State

  const {
    analysisResults,
    parsedMessages,
    isLoading,
    error,
    selectedChartView,
    setSelectedChartView,
    focusedSender,
    setFocusedSender,
    resetAnalysis,
    setGeneratedSign, // Add setter for the generated sign
    // Removed AI state setters from context destructuring
    // setAiPrediction,
    // setAiStyleAnalysis
  } = useChatAnalysis();

  const [calculatedDates, setCalculatedDates] = useState<{ activeDays: number; timeSpan: string }>({ activeDays: 0, timeSpan: 'Período Indefinido' });

  useEffect(() => {
    if (parsedMessages && parsedMessages.length > 0) {
      const validTimestamps = parsedMessages
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
    } else {
       setCalculatedDates({ activeDays: 0, timeSpan: 'Nenhuma mensagem válida' });
    }

    if (!isLoading && !analysisResults && !error) {
      toast.error("Nenhum resultado de análise encontrado.");
      navigate('/instructions');
    }
    if (error) {
       toast.error(`Erro ao carregar resultados: ${error}`);
    }

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setTimeOfDay('Bom dia');
    else if (hour >= 12 && hour < 18) setTimeOfDay('Boa tarde');
    else setTimeOfDay('Boa noite');
  }, [analysisResults, parsedMessages, isLoading, error, navigate]);

  // --- Removed AI Feature Logic (callAIFeatures and related useEffect) ---


  // --- Original Mock Results (Now only used for title) ---
  const mockResults = {
    title: "Seu Horóscopo de Chat!",
  };

  const genericChatName = "Sua Conversa"; // Use generic name

  if (isLoading) { /* ... loading JSX ... */
    return (
      <GradientBackground>
        <div className="flex items-center justify-center h-screen text-white text-xl">
          Carregando resultados... ✨
        </div>
      </GradientBackground>
    );
  }

  if (error || !analysisResults) { /* ... error JSX ... */
     return (
      <GradientBackground>
        <div className="flex flex-col items-center justify-center h-screen text-white p-4">
          <h1 className="text-2xl font-bold mb-4">Oops! Algo deu errado.</h1>
          <p className="text-center mb-6">{error || "Não foi possível carregar os resultados da análise."}</p>
          <Button onClick={() => navigate('/instructions')} className="cosmic-btn">
            Tentar Novamente
          </Button>
        </div>
      </GradientBackground>
     );
  }

  const generateHeuristics = (results: NonNullable<AnalysisResults>) => {
    let sign = "Explorador do ZapVerso ✨";
    let signDescriptor = "";
    let signoDescription = "Um perfil de chat equilibrado e misterioso.";
    const funFacts: string[] = [];

    // Restore sign generation based on mostActiveHour
    if (results.mostActiveHour !== null) {
       if (results.mostActiveHour >= 22 || results.mostActiveHour < 6) { sign = `Coruja Noturna 🦉`; signoDescription = "As madrugadas são seu palco principal para conversas profundas ou divertidas."; }
       else if (results.mostActiveHour >= 6 && results.mostActiveHour < 12) { sign = `Madrugador Tagarela ☀️`; signoDescription = "Você começa o dia com energia total no chat, resolvendo tudo logo cedo."; }
       else if (results.mostActiveHour >= 12 && results.mostActiveHour < 18) { sign = `Vespertino Vibrante 🌇`; signoDescription = "A tarde é seu momento de ouro para interações e trocas de ideias."; }
       else { sign = `Sereno Notívago 🌙`; signoDescription = "Prefere a calma do início da noite para colocar a conversa em dia."; }
    } else {
       // Keep default if mostActiveHour is null
       sign = "Explorador do ZapVerso ✨";
       signoDescription = "Um perfil de chat equilibrado e misterioso.";
    }


    if (results.mostFrequentEmoji && ['😂', '🤣', 'lol'].includes(results.mostFrequentEmoji)) { signDescriptor = "Comediante"; signoDescription += " Seu humor contagiante ilumina o chat!"; } // Append to existing description
    else if (results.mostFrequentEmoji && ['❤️', '🥰', '😍'].includes(results.mostFrequentEmoji)) { signDescriptor = "Amoroso"; signoDescription += " O afeto transborda em suas mensagens."; }
    else if (results.mostFrequentKeywordCategory === 'positive' && results.keywordCounts.positive > results.keywordCounts.negative) { signDescriptor = "Otimista"; signoDescription += " Sempre vendo o lado bom e espalhando positividade."; }
    else if (results.mostFrequentKeywordCategory === 'negative' && results.keywordCounts.negative > results.keywordCounts.positive) { signDescriptor = "Intenso"; signoDescription += " Você se expressa com paixão e clareza, mesmo nos momentos difíceis."; }
    else if (results.mostFrequentKeywordCategory === 'questions') { signDescriptor = "Curioso"; signoDescription += " Sua mente está sempre buscando entender e explorar."; }
    else if (results.mostFrequentEmoji) { signDescriptor = `do ${results.mostFrequentEmoji}`; signoDescription += ` O emoji ${results.mostFrequentEmoji} é sua marca registrada!`; }

    // Apply descriptor to the default sign if found
    if (signDescriptor) { sign = `${signDescriptor} ${sign}`; }
    else if (results.mostFrequentEmoji) { // Fallback descriptor if only emoji is prominent
        signDescriptor = `do ${results.mostFrequentEmoji}`;
        sign = `${signDescriptor} ${sign}`;
        signoDescription += ` O emoji ${results.mostFrequentEmoji} é sua marca registrada!`;
    }


    // Restore fun facts based on mostActiveHour
    if (results.mostActiveHour !== null) {
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

  const { generatedSign, generatedSignoDescription, generatedFunFacts } = generateHeuristics(analysisResults);

  // Save the generated sign to context after calculating it
  useEffect(() => {
    if (generatedSign && setGeneratedSign) {
      setGeneratedSign(generatedSign);
    }
    // Dependency array ensures this runs only when generatedSign changes
  }, [generatedSign, setGeneratedSign]);

  const emojiCloudData = Object.entries(analysisResults.emojiCounts).map(([emoji, count]) => ({ emoji, count })).sort((a, b) => b.count - a.count);

  const shareableImageRef = useRef<HTMLDivElement>(null); // Ref for the shareable component

  const handleShare = async () => {
    if (!shareableImageRef.current) {
      toast.error("Erro ao encontrar o componente para compartilhar.");
      return;
    }
    toast.info("Gerando imagem para compartilhar...");

    try {
      const canvas = await html2canvas(shareableImageRef.current, {
        useCORS: true, // Important if using external images/fonts later
        backgroundColor: null, // Use component's background
        scale: 2, // Increase resolution for better quality
      });

      // Convert canvas to Blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Falha ao gerar imagem (Blob).");
          return;
        }

        const file = new File([blob], "horoscopo-chat.png", { type: "image/png" });
        const shareData = {
          files: [file],
          title: 'Meu Horóscopo de Chat!',
          text: `Veja meu resultado no Horóscopo das Mensagens: ${generatedSign}`,
        };

        // Try Web Share API first
        if (navigator.canShare && navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            toast.success("Compartilhado com sucesso!");
          } catch (err) {
            // Handle share cancellation or error
            if ((err as Error).name !== 'AbortError') {
              console.error("Erro ao compartilhar:", err);
              toast.error(`Erro ao compartilhar: ${(err as Error).message}`);
            } else {
              // User cancelled share - do nothing or show mild toast
              // toast.info("Compartilhamento cancelado.");
            }
          }
        } else {
          // Fallback: Download image
          toast.info("API de compartilhamento não suportada. Iniciando download...");
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'horoscopo-chat.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href); // Clean up
          toast.success("Imagem baixada! Agora você pode compartilhar manualmente.");
        }
      }, "image/png");

    } catch (error) {
      console.error("Erro ao gerar imagem com html2canvas:", error);
      toast.error("Ocorreu um erro ao gerar a imagem para compartilhar.");
    }
  };

  // Function to handle "Analyze Another Chat" button click
  const handleAnalyzeAnother = () => {
    if (resetAnalysis) {
      resetAnalysis(); // Clear the current analysis data
    }
    navigate('/instructions'); // Navigate back to the instructions page
    toast.info("Pronto para analisar um novo chat!");
  };

  const handlePremiumClick = () => setShowPremium(true);
  const handleBackToResults = () => setShowPremium(false);
  const handleSubscribe = () => { toast.success('Obrigado por se interessar! Em um app real, isto processaria sua assinatura.'); setTimeout(() => setShowPremium(false), 1500); };

  const handleSenderClick = (sender: string) => {
    setFocusedSender(sender);
    toast.info(`Analisando ${sender}...`);
  };

  const { activeDays, timeSpan } = calculatedDates;

  if (showPremium) { /* ... premium JSX ... */
    return (
      <GradientBackground variant="warm">
        <div className="flex flex-col h-full py-8 px-4">
          <h1 className="text-3xl font-bold text-center text-white mb-8">Desbloqueie o Universo Completo!</h1>
          <div className="cosmic-card bg-white/40 mb-8">
            <h2 className="text-xl font-bold mb-6 text-center">Torne-se um Mestre Astral das Mensagens 🔮</h2>
            <div className="space-y-5 mb-6">
              {/* Updated Premium Features - Removed AI specific ones */}
              <div className="flex items-start"><div className="bg-cosmic-neonBlue rounded-full p-2 mr-3"><Award className="h-5 w-5 text-white" /></div><div><h3 className="font-semibold">Análises Detalhadas</h3><p className="text-sm opacity-80">Nível de passivo-agressividade, flerte e mais insights.</p></div></div>
              <div className="flex items-start"><div className="bg-cosmic-orange rounded-full p-2 mr-3"><Gift className="h-5 w-5 text-white" /></div><div><h3 className="font-semibold">Experiência Premium</h3><p className="text-sm opacity-80">Sem anúncios e com temas exclusivos.</p></div></div>
              {/* Add other non-AI premium features here if any */}
            </div>
          </div>
          <div className="cosmic-card bg-white/40 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-center">Escolha seu Plano</h3>
            <div className="space-y-4">
              <div className="border border-cosmic-purple rounded-lg p-4 flex justify-between items-center"><div><h4 className="font-medium">Mensal</h4><p className="text-sm opacity-70">Acesso ilimitado</p></div><p className="font-bold">R$ 9,99</p></div>
              <div className="border-2 border-cosmic-purple rounded-lg p-4 flex justify-between items-center bg-cosmic-purple/10 relative overflow-hidden"><div className="absolute top-0 right-0 bg-cosmic-pink text-xs font-bold text-white py-1 px-2 rounded-bl">MELHOR OFERTA</div><div><h4 className="font-medium">Anual</h4><p className="text-sm opacity-70">Economize 50%</p></div><div className="text-right"><p className="text-sm line-through opacity-50">R$ 119,88</p><p className="font-bold">R$ 59,99</p></div></div>
            </div>
          </div>
          <div className="mt-auto space-y-4">
            <Button onClick={handleSubscribe} className="cosmic-btn w-full">Desbloquear Tudo!</Button>
            <Button onClick={handleBackToResults} variant="outline" className="w-full border-white bg-transparent text-white hover:bg-white/20">Voltar para Resultados</Button>
            <p className="text-xs text-center text-white/70">Você pode cancelar sua assinatura a qualquer momento</p>
          </div>
        </div>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <div className="flex flex-col min-h-screen pb-24 px-4 pt-6">
        <div className="flex justify-between items-center mb-4">
          <div><h2 className="text-lg font-medium opacity-80">{timeOfDay}, Astroanalista!</h2><h1 className="text-3xl font-bold">{mockResults.title}</h1></div>
          <Badge variant="outline" className="bg-white/20"><Calendar className="h-3.5 w-3.5 mr-1" /><span className="text-xs">{activeDays} dia{activeDays !== 1 ? 's' : ''}</span></Badge>
        </div>

        <div className="bg-white/10 rounded-xl p-3 mb-6 flex justify-between items-center">
          <div><h3 className="font-medium">{genericChatName}</h3><p className="text-xs opacity-70">{timeSpan}</p></div>
          <div className="text-right"><p className="font-bold">{analysisResults.totalMessages}</p><p className="text-xs opacity-70">mensagens</p></div>
        </div>

        <div className="cosmic-card bg-gradient-purple-pink text-white mb-8">
          <div className="text-center">
            <FloatingEmoji emoji="✨" size="md" /><h2 className="text-2xl font-bold my-2">{generatedSign}</h2>
            <p className="text-sm opacity-90 px-4">{generatedSignoDescription}</p>
            <FloatingEmoji emoji="✨" size="md" />
          </div>
        </div>

        <ResultCard title="Participantes" variant="primary">
          <div className="space-y-4">
            <p className="text-sm opacity-80 mb-2">Clique em um participante para ver detalhes:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {Object.entries(analysisResults.statsPerSender)
                .sort(([, statsA], [, statsB]) => statsB.messageCount - statsA.messageCount)
                .map(([sender, stats]) => (
                  <div
                    key={sender}
                    className="cursor-pointer transition-transform hover:scale-105"
                    onClick={() => handleSenderClick(sender)}
                  >
                    <ContactBubble
                      name={sender}
                      messageCount={stats.messageCount}
                      // Removed messageRatio and highlight props as they are not defined in ContactBubbleProps
                    />
                  </div>
                ))}
            </div>
          </div>
        </ResultCard>

        <ResultCard title="Atividade do Chat" variant="default">
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              {/* The value now directly uses the state which can only be 'daily' or 'weekly' */}
              <ToggleGroup type="single" value={selectedChartView} onValueChange={(value) => value && setSelectedChartView(value as any)}>
                {/* Removed Hourly Toggle */}
                <ToggleGroupItem value="daily" aria-label="Daily View" className="flex gap-1 items-center">
                  <LineChart className="h-3.5 w-3.5" /> Dias
                </ToggleGroupItem>
                <ToggleGroupItem value="weekly" aria-label="Weekly View" className="flex gap-1 items-center">
                  <BarChart className="h-3.5 w-3.5" /> Semanas
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Conditional Rendering based on selectedChartView */}
            {/* Removed Hourly View */}
            {selectedChartView === 'daily' && (
              <TimelineChart
                data={Object.entries(analysisResults.messagesPerDate).map(([date, count]) => ({ name: date, value: count }))}
                viewType="daily"
              />
            )}

            {selectedChartView === 'weekly' && (
               <TimelineChart
                 data={Object.entries(analysisResults.messagesPerDayOfWeek).map(([dayIndex, count]) => ({ name: dayIndex, value: count }))}
                 viewType="weekly"
               />
            )}
          </div>
        </ResultCard>

        <ResultCard title="Visão Geral do Chat" variant="default">
           <div className="space-y-3">
             <div className="flex justify-between items-center"><span className="font-medium flex items-center"><MessageSquareText className="w-4 h-4 mr-2 opacity-70"/>Total de Mensagens:</span><span className="font-bold text-lg">{analysisResults.totalMessages}</span></div>
             <div className="flex justify-between items-center"><span className="font-medium flex items-center"><Text className="w-4 h-4 mr-2 opacity-70"/>Tamanho Médio:</span><span className="font-bold text-lg">{analysisResults.averageMessageLength} <span className="text-xs opacity-70">caracteres</span></span></div>
             {analysisResults.mostFrequentKeywordCategory === 'laughter' && (<p className="text-sm opacity-80 pt-1 flex items-center"><Laugh className="w-4 h-4 mr-1 text-yellow-500"/> Clima geral: Descontraído</p>)}
             {analysisResults.mostFrequentKeywordCategory === 'questions' && (<p className="text-sm opacity-80 pt-1 flex items-center"><QuestionIcon className="w-4 h-4 mr-1 text-blue-500"/> Clima geral: Investigativo</p>)}
           </div>
        </ResultCard>

        {Object.keys(analysisResults.statsPerSender).length > 1 && (
          <ResultCard title="Análise por Participante" variant="secondary">
            <div className="space-y-4">
              {Object.entries(analysisResults.statsPerSender)
                .sort(([, statsA], [, statsB]) => statsB.messageCount - statsA.messageCount)
                .map(([sender, stats]) => {
                  const senderSentimentRatio = stats.keywordCounts.positive / (stats.keywordCounts.negative + 1);
                  const topSenderEmoji = findTopItem(stats.emojiCounts);
                  const topSenderKeywordCat = findTopItem(stats.keywordCounts);

                  return (
                    <div
                      key={sender}
                      className={`border-b border-gray-300/30 pb-3 last:border-b-0 hover:bg-white/5 rounded-md p-2 transition-colors cursor-pointer ${sender === focusedSender ? 'bg-white/10' : ''}`}
                      onClick={() => handleSenderClick(sender)}
                    >
                      <h4 className="font-semibold mb-1 flex items-center"><UserCircle className="w-4 h-4 mr-2 opacity-70"/>{sender}</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs opacity-80">
                        <span>{stats.messageCount} msg{stats.messageCount > 1 ? 's' : ''}</span>
                        <span>Média: {stats.averageLength} chars</span>
                        {topSenderEmoji && <span className="truncate flex items-center"><Smile className="w-3.5 h-3.5 mr-1"/> {topSenderEmoji}</span>}
                        {topSenderKeywordCat && <span className="truncate flex items-center"><Zap className="w-3.5 h-3.5 mr-1"/> {formatKeywordCategory(topSenderKeywordCat)}</span>}
                        {stats.averageResponseTimeMinutes !== null ? (
                          <span className="truncate flex items-center"><Clock1 className="w-3.5 h-3.5 mr-1"/> Resposta: {stats.averageResponseTimeMinutes} min</span>
                        ) : (
                          <span className="truncate flex items-center text-gray-400"><Clock1 className="w-3.5 h-3.5 mr-1"/> Sem respostas</span>
                        )}
                        <span className="col-span-2 sm:col-span-1">
                          Vibe: {senderSentimentRatio > 1.5 ? <TrendingUp className="w-4 h-4 inline text-green-400" /> : senderSentimentRatio < 0.7 ? <TrendingDown className="w-4 h-4 inline text-red-400" /> : <span className="text-gray-400">~</span>}
                        </span>
                        {/* Conditionally add premium stats for sender */}
                        {isPremiumMock && (
                          <>
                            <span className="truncate flex items-center text-yellow-400"><Users className="w-3.5 h-3.5 mr-1"/> P.A.: {stats.passiveAggressivePercentage?.toFixed(1) ?? '0.0'}%</span>
                            <span className="truncate flex items-center text-pink-200"><Smile className="w-3.5 h-3.5 mr-1"/> Flerte: {stats.flirtationPercentage?.toFixed(1) ?? '0.0'}%</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
              })}
            </div>
          </ResultCard>
        )}

        <ResultCard title="Mix de Vibrações" variant="default">
          {(analysisResults.keywordCounts.positive > 0 || analysisResults.keywordCounts.negative > 0) ? (
            <div className="space-y-2">
              <div className="flex items-center mb-2"><span className="mr-2 opacity-80">Balanço Energético:</span></div>
              <div className="w-full bg-gray-200 rounded-full h-6 flex overflow-hidden">
                {analysisResults.keywordCounts.positive > 0 && (<div className="h-6 bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-xs text-white font-medium" style={{ width: `${(analysisResults.keywordCounts.positive / (analysisResults.keywordCounts.positive + analysisResults.keywordCounts.negative)) * 100}%` }} title={`Positivas: ${analysisResults.keywordCounts.positive}`}>Positiva</div>)}
                {analysisResults.keywordCounts.negative > 0 && (<div className="h-6 bg-gradient-to-r from-red-400 to-rose-500 flex items-center justify-center text-xs text-white font-medium" style={{ width: `${(analysisResults.keywordCounts.negative / (analysisResults.keywordCounts.positive + analysisResults.keywordCounts.negative)) * 100}%` }} title={`Negativas: ${analysisResults.keywordCounts.negative}`}>Negativa</div>)}
              </div>
              <p className="text-xs text-center opacity-70 pt-1">Baseado na contagem de palavras-chave positivas e negativas.</p>
            </div>
          ) : (<p className="text-sm opacity-70 text-center py-4">Não foi possível determinar o balanço de vibrações.</p>)}
        </ResultCard>

        <ResultCard title="Suas Expressões Favoritas" variant="primary">
          <div className="space-y-4">
            {analysisResults.topExpressions.length > 0 ? (
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

        <ResultCard title="Destaques do Chat" variant="primary">
          <div className="space-y-4">
            {analysisResults.mostFrequentEmoji ? (<> <div className="flex justify-between items-center"><span className="font-medium">Emoji Principal:</span><span className="text-4xl">{analysisResults.mostFrequentEmoji}</span></div> <p className="text-sm">Seu espírito animal digital é o {analysisResults.mostFrequentEmoji}!</p> </>) : (<p className="text-sm opacity-70">Nenhum emoji frequente encontrado.</p>)}
            {/* Restore Most Active Hour display */}
            {analysisResults.mostActiveHour !== null ? (<> <div className="flex items-center"><Clock className="h-5 w-5 mr-2" /><span className="font-medium">Horário Nobre: </span><span className="ml-2 bg-white/30 px-2 py-0.5 rounded font-bold">{`${analysisResults.mostActiveHour.toString().padStart(2, '0')}:00 - ${(analysisResults.mostActiveHour + 1).toString().padStart(2, '0')}:00`}</span></div> <p className="text-sm">Sua energia de chat bomba entre <strong>{analysisResults.mostActiveHour}:00</strong> e <strong>{(analysisResults.mostActiveHour + 1)}:00</strong>.</p> </>) : (<p className="text-sm opacity-70">Não foi possível determinar o horário nobre.</p>)}
            {analysisResults.favoriteWord ? (<div className="flex justify-between items-center pt-2"><span className="font-medium">Palavra Favorita:</span><span className="bg-white/30 px-3 py-1 rounded-full font-bold">{analysisResults.favoriteWord}</span></div>) : (<div className="flex justify-between items-center pt-2"><span className="font-medium">Palavra Favorita:</span><span className="text-sm opacity-70">Nenhuma palavra marcante encontrada.</span></div>)}
          </div>
        </ResultCard>

        <ResultCard title="Seu Universo de Emoji" variant="secondary">
          <EmojiCloud emojis={emojiCloudData} />
        </ResultCard>

        <ResultCard title="Pequenas Verdades Cósmicas" variant="accent">
           {generatedFunFacts.length > 0 ? (<ul className="space-y-3">{generatedFunFacts.map((fact, index) => (<li key={index} className="flex items-start"><span className="mr-2 text-lg">•</span><span>{fact}</span></li>))}</ul>) : (<p className="text-sm opacity-70 text-center py-4">Nenhuma verdade cósmica encontrada por enquanto.</p>)}
        </ResultCard>

        {/* --- Premium Section (AI Removed) --- */}
        {isPremiumMock ? (
          <>
            {/* Removed AI Result Cards */}

            {/* Original Premium Stats */}
            <ResultCard title="Análises Premium Detalhadas" variant="accent">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                <span className="font-medium flex items-center"><Users className="w-4 h-4 mr-2 opacity-70"/>Passivo-Agressivo (% msgs):</span>
                {/* Display percentage */}
                <span className="font-bold text-lg">{analysisResults.passiveAggressivePercentage?.toFixed(1) ?? '0.0'}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium flex items-center"><Smile className="w-4 h-4 mr-2 opacity-70"/>Flerte (% msgs):</span>
                 <span className="font-bold text-lg">{analysisResults.flirtationPercentage?.toFixed(1) ?? '0.0'}%</span>
              </div>
              <p className="text-xs opacity-70 pt-1">Porcentagem de mensagens com indicadores passivo-agressivos ou de flerte.</p>
            </div>
            </ResultCard>
            {/* Button to navigate to the dedicated premium area */}
            <div className="mt-4 mb-2 flex justify-center">
              <Button
                onClick={() => navigate('/premium')} // Navigate to the premium page route
                className="bg-gradient-to-r from-cosmic-purple to-cosmic-pink hover:from-cosmic-purple/90 hover:to-cosmic-pink/90 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                Acessar Área Premium Completa ✨
              </Button>
            </div>
          </>
        ) : (
           <ResultCard title="Desbloqueie Análises Detalhadas ✨" variant="accent">
             <div className="text-center py-4">
               <p className="mb-3">Obtenha insights sobre flerte, passivo-agressividade e mais com o Premium!</p>
               <Button onClick={handlePremiumClick} size="sm" className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white">Ver Vantagens Premium</Button>
             </div>
           </ResultCard>
        )}

        {/* Temporary Button to Toggle Premium Mock Status */}
        <div className="my-4 flex justify-center">
           <Button onClick={() => setIsPremiumMock(!isPremiumMock)} variant="outline" size="sm">
             {isPremiumMock ? 'Desativar Premium (Teste)' : 'Ativar Premium (Teste)'}
           </Button>
        </div>

        <div className="mt-8 mb-4"><Button onClick={handlePremiumClick} className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-semibold py-4 rounded-xl shadow-lg">Desbloqueie Análises Premium ✨</Button></div>
        <div className="flex justify-center space-x-4 mb-16"><Button onClick={handleAnalyzeAnother} variant="outline" size="sm" className="border-white/30 bg-white/10 text-sm">Analisar Outro Chat</Button><Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-sm">Ver Tutorial</Button></div>
        <ShareButton onClick={handleShare} />
      </div>

      {focusedSender && analysisResults.statsPerSender[focusedSender] && (
        <SenderFocus
          sender={focusedSender}
          stats={analysisResults.statsPerSender[focusedSender]}
          onClose={() => setFocusedSender(null)}
        />
      )}

      {/* Hidden Shareable Image Component - Positioned off-screen */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <ShareableImage
          ref={shareableImageRef}
          totalMessages={analysisResults.totalMessages}
          generatedSign={generatedSign}
          generatedSignoDescription={generatedSignoDescription}
          mostFrequentEmoji={analysisResults.mostFrequentEmoji}
        />
      </div>
    </GradientBackground>
  );
};

export default ResultsPage;
