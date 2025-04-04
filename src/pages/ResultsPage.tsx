import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
// Add new icons
import { Share2, Clock, Award, Star, Gift, MessageSquareText, Users, Laugh, HelpCircle as QuestionIcon, Text, TrendingUp, TrendingDown, UserCircle } from 'lucide-react'; 
import { useChatAnalysis } from '@/context/ChatAnalysisContext';
import GradientBackground from '@/components/GradientBackground';
import ResultCard, { ShareButton } from '@/components/ResultCard';
import { toast } from 'sonner';
import FloatingEmoji from '@/components/FloatingEmoji';
import type { AnalysisResults } from '../lib/analyzeChat'; // Import type for clarity

const ResultsPage = () => {
  const navigate = useNavigate();
  const [showPremium, setShowPremium] = useState(false);
  const { analysisResults, isLoading, error } = useChatAnalysis(); // Removed parsedMessages as it's within analysisResults

  useEffect(() => {
    if (!isLoading && !analysisResults && !error) {
      toast.error("Nenhum resultado de análise encontrado.");
      navigate('/instructions');
    }
    if (error) {
       toast.error(`Erro ao carregar resultados: ${error}`);
    }
  }, [analysisResults, isLoading, error, navigate]);

  // Mock results data (for sections not yet implemented fully)
  const mockResults = {
    prediction: "Altas chances de mandar um áudio de 3 minutos sem querer. Prepare-se!"
  };

  // Loading State
  if (isLoading) {
    return (
      <GradientBackground>
        <div className="flex items-center justify-center h-screen text-white text-xl">
          Carregando resultados... ✨
        </div>
      </GradientBackground>
    );
  }

  // Error State or Missing Results
  if (error || !analysisResults) {
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

  // --- Heuristic Generation ---
  const generateHeuristics = (results: NonNullable<AnalysisResults>) => {
    let sign = "Explorador do ZapVerso ✨";
    let signDescriptor = "";
    let signoDescription = "Um perfil de chat equilibrado e misterioso."; // Default description
    const funFacts: string[] = [];

    // Determine primary sign based on peak hour first
    if (results.mostActiveHour !== null) {
       if (results.mostActiveHour >= 22 || results.mostActiveHour < 6) {
         sign = `Coruja Noturna 🦉`;
         signoDescription = "As madrugadas são seu palco principal para conversas profundas ou divertidas.";
       } else if (results.mostActiveHour >= 6 && results.mostActiveHour < 12) {
         sign = `Madrugador Tagarela ☀️`;
         signoDescription = "Você começa o dia com energia total no chat, resolvendo tudo logo cedo.";
       } else if (results.mostActiveHour >= 12 && results.mostActiveHour < 18) {
          sign = `Vespertino Vibrante 🌇`;
          signoDescription = "A tarde é seu momento de ouro para interações e trocas de ideias.";
       } else {
          sign = `Sereno Notívago 🌙`;
          signoDescription = "Prefere a calma do início da noite para colocar a conversa em dia.";
       }
    }

    // Add descriptor based on emoji or keywords
    if (results.mostFrequentEmoji && ['😂', '🤣', 'lol'].includes(results.mostFrequentEmoji)) {
       signDescriptor = "Comediante";
       signoDescription += " Seu humor contagiante ilumina o chat!";
    } else if (results.mostFrequentEmoji && ['❤️', '🥰', '😍'].includes(results.mostFrequentEmoji)) {
       signDescriptor = "Amoroso";
       signoDescription += " O afeto transborda em suas mensagens.";
    } else if (results.mostFrequentKeywordCategory === 'positive' && results.keywordCounts.positive > results.keywordCounts.negative) {
       signDescriptor = "Otimista";
       signoDescription += " Sempre vendo o lado bom e espalhando positividade.";
    } else if (results.mostFrequentKeywordCategory === 'negative' && results.keywordCounts.negative > results.keywordCounts.positive) {
       signDescriptor = "Intenso";
       signoDescription += " Você se expressa com paixão e clareza, mesmo nos momentos difíceis.";
    } else if (results.mostFrequentKeywordCategory === 'questions') {
       signDescriptor = "Curioso";
       signoDescription += " Sua mente está sempre buscando entender e explorar.";
    } else if (results.mostFrequentEmoji) {
       signDescriptor = `do ${results.mostFrequentEmoji}`;
       signoDescription += ` O emoji ${results.mostFrequentEmoji} é sua marca registrada!`;
    }

    // Combine sign and descriptor if descriptor exists
    if (signDescriptor) {
       if (!sign.includes(signDescriptor.replace(/do |da /,''))) { 
          sign = `${signDescriptor} ${sign}`;
       }
    }

    // --- Fun facts generation ---
    // (Previous fun fact logic remains here...)
     if (results.mostActiveHour !== null) {
      if (results.mostActiveHour >= 22 || results.mostActiveHour < 6) {
        funFacts.push("Você brilha mais quando a lua aparece no chat.");
      } else if (results.mostActiveHour >= 12 && results.mostActiveHour < 18) {
         funFacts.push("A tarde é seu momento de pico nas conversas!");
      } else {
         funFacts.push("Manhãs ou noites tranquilas? Seu pico de chat é fora do comum!");
      }
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

    // Add default facts if too few generated
    const defaultFacts = ["Seu estilo de chat é único como uma impressão digital cósmica.", "Há mais segredos escondidos nas entrelinhas...", "Cada mensagem sua carrega uma energia particular."];
    let factIndex = 0;
    while (funFacts.length < 3 && factIndex < defaultFacts.length) {
        if (!funFacts.includes(defaultFacts[factIndex])) { funFacts.push(defaultFacts[factIndex]); }
        factIndex++;
    }

    // Return generated sign, its description, and fun facts
    return { generatedSign: sign, generatedSignoDescription: signoDescription, generatedFunFacts: funFacts.slice(0, 3) };
  };

  // Generate heuristics based on actual results
  const { generatedSign, generatedSignoDescription, generatedFunFacts } = generateHeuristics(analysisResults);


  // --- Premium Upsell Logic ---
  // (Remains the same)
  const handleShare = () => { toast.success('Em um app real, isto compartilharia uma imagem dos seus resultados!'); };
  const handlePremiumClick = () => setShowPremium(true);
  const handleBackToResults = () => setShowPremium(false);
  const handleSubscribe = () => { toast.success('Obrigado por se interessar! Em um app real, isto processaria sua assinatura.'); setTimeout(() => setShowPremium(false), 1500); };
  
  // Premium Screen JSX
  if (showPremium) {
    return (
      <GradientBackground variant="warm">
        <div className="flex flex-col h-full py-8 px-4">
          <h1 className="text-3xl font-bold text-center text-white mb-8">Desbloqueie o Universo Completo!</h1>
          <div className="cosmic-card bg-white/40 mb-8">
            <h2 className="text-xl font-bold mb-6 text-center">Torne-se um Mestre Astral das Mensagens 🔮</h2>
            <div className="space-y-5 mb-6">
              <div className="flex items-start"><div className="bg-cosmic-pink rounded-full p-2 mr-3"><Award className="h-5 w-5 text-white" /></div><div><h3 className="font-semibold">Análises Mais Profundas</h3><p className="text-sm opacity-80">Descubra seu nível de passivo-agressividade, flerte e mais!</p></div></div>
              <div className="flex items-start"><div className="bg-cosmic-purple rounded-full p-2 mr-3"><Star className="h-5 w-5 text-white" /></div><div><h3 className="font-semibold">Compatibilidade Astral de Chat</h3><p className="text-sm opacity-80">Veja o quão compatível é seu jeito de teclar com seus amigos.</p></div></div>
              <div className="flex items-start"><div className="bg-cosmic-neonBlue rounded-full p-2 mr-3"><Gift className="h-5 w-5 text-white" /></div><div><h3 className="font-semibold">Sem Anúncios + Temas Exclusivos</h3><p className="text-sm opacity-80">Uma experiência cósmica sem interrupções e personalizada.</p></div></div>
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
  
  // Main Results Screen JSX
  return (
    <GradientBackground>
      <div className="flex flex-col min-h-screen pb-20 px-4">
        <h1 className="text-3xl font-bold text-center mt-8 mb-6">Seu Horóscopo de Chat!</h1>

        {/* --- Use Generated Sign --- */}
        <div className="cosmic-card bg-gradient-purple-pink text-white mb-8">
          <div className="text-center">
            <FloatingEmoji emoji="✨" size="md" />
            <h2 className="text-2xl font-bold my-2">{generatedSign}</h2> 
            {/* Display Signo Description */}
            <p className="text-sm opacity-90 px-4">{generatedSignoDescription}</p> 
            <FloatingEmoji emoji="✨" size="md" />
          </div>
        </div>

        {/* --- Display Real Analysis Results --- */}
        <ResultCard title="Visão Geral do Chat" variant="default">
           <div className="space-y-3">
             <div className="flex justify-between items-center"><span className="font-medium flex items-center"><MessageSquareText className="w-4 h-4 mr-2 opacity-70"/>Total de Mensagens:</span><span className="font-bold text-lg">{analysisResults.totalMessages}</span></div>
             <div className="flex justify-between items-center"><span className="font-medium flex items-center"><Text className="w-4 h-4 mr-2 opacity-70"/>Tamanho Médio:</span><span className="font-bold text-lg">{analysisResults.averageMessageLength} <span className="text-xs opacity-70">caracteres</span></span></div>
             {analysisResults.mostFrequentKeywordCategory === 'laughter' && (<p className="text-sm opacity-80 pt-1 flex items-center"><Laugh className="w-4 h-4 mr-1 text-yellow-500"/> Clima geral: Descontraído</p>)}
             {analysisResults.mostFrequentKeywordCategory === 'questions' && (<p className="text-sm opacity-80 pt-1 flex items-center"><QuestionIcon className="w-4 h-4 mr-1 text-blue-500"/> Clima geral: Investigativo</p>)}
           </div>
        </ResultCard>

        {/* --- Per-Sender Analysis --- */}
        {Object.keys(analysisResults.statsPerSender).length > 1 && ( // Show only for group chats
          <ResultCard title="Análise por Participante" variant="secondary">
            <div className="space-y-4">
              {Object.entries(analysisResults.statsPerSender)
                .sort(([, statsA], [, statsB]) => statsB.messageCount - statsA.messageCount) // Sort by message count
                .map(([sender, stats]) => {
                  const senderSentimentRatio = stats.keywordCounts.positive / (stats.keywordCounts.negative + 1);
                  return (
                    <div key={sender} className="border-b border-gray-300/30 pb-3 last:border-b-0">
                      <h4 className="font-semibold mb-1 flex items-center"><UserCircle className="w-4 h-4 mr-2 opacity-70"/>{sender}</h4>
                      <div className="flex justify-between text-xs opacity-80">
                        <span>{stats.messageCount} msg{stats.messageCount > 1 ? 's' : ''}</span>
                        <span>Média: {stats.averageLength} chars</span>
                        <span>
                          {/* Remove invalid title prop */}
                          {senderSentimentRatio > 1.5 ? <TrendingUp className="w-4 h-4 inline text-green-400" /> : 
                           senderSentimentRatio < 0.7 ? <TrendingDown className="w-4 h-4 inline text-red-400" /> : null}
                        </span>
                      </div>
                    </div>
                  );
              })}
            </div>
          </ResultCard>
        )}

        {/* --- Personality Mix based on Keywords --- */}
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
        
        {/* --- Destaques Card --- */}
        <ResultCard title="Destaques do Chat" variant="primary">
          <div className="space-y-4">
            {analysisResults.mostFrequentEmoji ? (<> <div className="flex justify-between items-center"><span className="font-medium">Emoji Principal:</span><span className="text-4xl">{analysisResults.mostFrequentEmoji}</span></div> <p className="text-sm">Seu espírito animal digital é o {analysisResults.mostFrequentEmoji}!</p> </>) : (<p className="text-sm opacity-70">Nenhum emoji frequente encontrado.</p>)}
            {analysisResults.mostActiveHour !== null ? (<> <div className="flex items-center"><Clock className="h-5 w-5 mr-2" /><span className="font-medium">Horário Nobre: </span><span className="ml-2 bg-white/30 px-2 py-0.5 rounded font-bold">{`${analysisResults.mostActiveHour.toString().padStart(2, '0')}:00 - ${(analysisResults.mostActiveHour + 1).toString().padStart(2, '0')}:00`}</span></div> <p className="text-sm">Sua energia de chat bomba entre <strong>{analysisResults.mostActiveHour}:00</strong> e <strong>{(analysisResults.mostActiveHour + 1)}:00</strong>.</p> </>) : (<p className="text-sm opacity-70">Não foi possível determinar o horário nobre.</p>)}
            {analysisResults.favoriteWord ? (<div className="flex justify-between items-center pt-2"><span className="font-medium">Palavra Favorita:</span><span className="bg-white/30 px-3 py-1 rounded-full font-bold">{analysisResults.favoriteWord}</span></div>) : (<div className="flex justify-between items-center pt-2"><span className="font-medium">Palavra Favorita:</span><span className="text-sm opacity-70">Nenhuma palavra marcante encontrada.</span></div>)}
          </div>
        </ResultCard>
        
        {/* --- Fun Facts Card --- */}
        <ResultCard title="Pequenas Verdades Cósmicas" variant="secondary">
           {generatedFunFacts.length > 0 ? (<ul className="space-y-3">{generatedFunFacts.map((fact, index) => (<li key={index} className="flex items-start"><span className="mr-2 text-lg">•</span><span>{fact}</span></li>))}</ul>) : (<p className="text-sm opacity-70 text-center py-4">Nenhuma verdade cósmica encontrada por enquanto.</p>)}
        </ResultCard>
        
        {/* --- Prediction Card --- */}
        <ResultCard title="Previsão da Semana" variant="accent">
          <div className="flex items-center"><FloatingEmoji emoji="🔮" size="lg" /><p className="ml-4">{mockResults.prediction}</p></div>
        </ResultCard>
        
        {/* --- Premium Button & Footer --- */}
        <div className="mt-8 mb-4"><Button onClick={handlePremiumClick} className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-semibold py-4 rounded-xl shadow-lg">Desbloqueie Análises Premium ✨</Button></div>
        <p className="text-center text-sm opacity-70 mb-16">Analise outro chat para descobrir mais personalidades!</p>
        <ShareButton onClick={handleShare} />
      </div>
    </GradientBackground>
  );
};

export default ResultsPage;
