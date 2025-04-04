
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
// Add new icons
import { Share2, Clock, Award, Star, Gift, MessageSquareText, Users, Laugh, HelpCircle as QuestionIcon, Text, TrendingUp, TrendingDown, UserCircle, Palette, Calendar, Clock1 } from 'lucide-react'; 
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
import type { AnalysisResults } from '../lib/analyzeChat'; // Import type for clarity

const ResultsPage = () => {
  const navigate = useNavigate();
  const [showPremium, setShowPremium] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<string>('');
  const { analysisResults, isLoading, error } = useChatAnalysis(); // Removed parsedMessages as it's within analysisResults

  useEffect(() => {
    if (!isLoading && !analysisResults && !error) {
      toast.error("Nenhum resultado de análise encontrado.");
      navigate('/instructions');
    }
    if (error) {
       toast.error(`Erro ao carregar resultados: ${error}`);
    }
    
    // Set time of day for greeting
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setTimeOfDay('Bom dia');
    else if (hour >= 12 && hour < 18) setTimeOfDay('Boa tarde');
    else setTimeOfDay('Boa noite');
  }, [analysisResults, isLoading, error, navigate]);

  // Enhanced mock data for better visualization
  const mockHourlyActivity = Array(24).fill(0).map((_, i) => {
    // Create a more realistic pattern - more activity during day, peak in morning and evening
    if (i >= 8 && i <= 22) {
      const baseFactor = i <= 12 ? i - 7 : 23 - i; // Higher in middle of day
      return Math.floor(Math.random() * baseFactor * 15) + 5;
    }
    return Math.floor(Math.random() * 10); // Less activity at night
  });

  // Mock emojis with counts for visualization
  const mockEmojis = [
    { emoji: "😂", count: 47 },
    { emoji: "👍", count: 35 },
    { emoji: "❤️", count: 28 },
    { emoji: "😭", count: 22 },
    { emoji: "🤣", count: 18 },
    { emoji: "🙏", count: 15 },
    { emoji: "😊", count: 12 },
    { emoji: "🥰", count: 10 },
    { emoji: "😍", count: 8 },
    { emoji: "👀", count: 7 },
    { emoji: "🔥", count: 6 },
    { emoji: "😅", count: 5 }
  ];
  
  // Mock personality traits for visualization
  const mockPersonalityTraits = {
    "Extrovertido": 75,
    "Emotivo": 60,
    "Criativo": 85,
    "Analítico": 45,
    "Assertivo": 65
  };
  
  // Mock common expressions
  const mockExpressions = [
    { text: "kkkk", count: 83 },
    { text: "nossa", count: 42 },
    { text: "enfim", count: 37 },
    { text: "tipo", count: 31 },
    { text: "vdd", count: 29 }
  ];

  // Mock results data (for sections not yet implemented fully)
  const mockResults = {
    prediction: "Altas chances de mandar um áudio de 3 minutos sem querer. Prepare-se!",
    title: "Seu Horóscopo de Chat!",
    chatName: "Grupo da Faculdade",
    messageCount: 3784,
    firstMessageDate: "2023-06-15",
    lastMessageDate: "2024-04-03",
    activeDays: 178,
    sentimentScores: {
      positive: 65,
      neutral: 25,
      negative: 10
    }
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
  const handleShare = () => { toast.success('Em um app real, isto compartilharia uma imagem dos seus resultados!'); };
  const handlePremiumClick = () => setShowPremium(true);
  const handleBackToResults = () => setShowPremium(false);
  const handleSubscribe = () => { toast.success('Obrigado por se interessar! Em um app real, isto processaria sua assinatura.'); setTimeout(() => setShowPremium(false), 1500); };
  
  // Calculate timespan of chat
  const timeSpan = `${new Date(mockResults.firstMessageDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })} até ${new Date(mockResults.lastMessageDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`;
  
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
      <div className="flex flex-col min-h-screen pb-24 px-4 pt-6">
        {/* Welcome Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-medium opacity-80">{timeOfDay}, Astroanalista!</h2>
            <h1 className="text-3xl font-bold">{mockResults.title}</h1>
          </div>
          <Badge variant="outline" className="bg-white/20">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">{mockResults.activeDays} dias</span>
          </Badge>
        </div>
        
        {/* Chat Info Strip */}
        <div className="bg-white/10 rounded-xl p-3 mb-6 flex justify-between items-center">
          <div>
            <h3 className="font-medium">{mockResults.chatName}</h3>
            <p className="text-xs opacity-70">{timeSpan}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">{mockResults.messageCount}</p>
            <p className="text-xs opacity-70">mensagens</p>
          </div>
        </div>

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

        {/* People Card */}
        <ResultCard title="Quem Participa" variant="primary">
          {Object.entries(analysisResults.messagesPerSender).length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 px-2">
              {Object.entries(analysisResults.messagesPerSender)
                .sort(([, countA], [, countB]) => countB - countA)
                .map(([name, count], index) => (
                  <ContactBubble key={index} name={name} messageCount={count} />
                ))}
            </div>
          ) : (
            <p className="text-sm opacity-70 text-center py-3">Não foi possível identificar os participantes.</p>
          )}
        </ResultCard>
        
        {/* Activity Heatmap Card */}
        <ResultCard title="Quando Você Mais Conversa" variant="accent">
          <ActivityHeatmap hourlyActivity={mockHourlyActivity} />
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 w-3 h-3 rounded"></div>
            <span className="text-xs">Madrugada</span>
            <div className="bg-gradient-to-r from-blue-400 to-cyan-300 w-3 h-3 rounded"></div>
            <span className="text-xs">Manhã</span>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 w-3 h-3 rounded"></div>
            <span className="text-xs">Tarde</span>
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 w-3 h-3 rounded"></div>
            <span className="text-xs">Noite</span>
          </div>
        </ResultCard>
        
        {/* Emoji Cloud */}
        <ResultCard title="Seu Universo de Emoji" variant="secondary">
          <EmojiCloud emojis={mockEmojis} />
        </ResultCard>
        
        {/* Sentiment Analysis */}
        <ResultCard title="Equilíbrio Emocional" variant="default">
          <SentimentChart 
            positive={mockResults.sentimentScores.positive} 
            neutral={mockResults.sentimentScores.neutral}
            negative={mockResults.sentimentScores.negative}
          />
          
          <div className="mt-4 text-center">
            <p className="text-sm">Sua conversa tem um tom majoritariamente <span className="font-bold text-emerald-500">positivo</span>!</p>
          </div>
        </ResultCard>

        {/* Word Usage and Expressions */}
        <ResultCard title="Suas Expressões Favoritas" variant="primary">
          <div className="space-y-4">
            {mockExpressions.length > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {mockExpressions.map((exp, index) => (
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

        {/* Personality Traits */}
        <ResultCard title="Seus Traços de Personalidade" variant="secondary">
          <div className="space-y-4">
            {Object.entries(mockPersonalityTraits).map(([trait, score]) => (
              <div key={trait} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{trait}</span>
                  <span className="font-medium">{score}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full bg-gradient-to-r from-cosmic-neonBlue to-cosmic-purple"
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </ResultCard>
        
        {/* --- Fun Facts Card --- */}
        <ResultCard title="Pequenas Verdades Cósmicas" variant="accent">
           {generatedFunFacts.length > 0 ? (
            <ul className="space-y-3">
              {generatedFunFacts.map((fact, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 text-lg">•</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
           ) : (
            <p className="text-sm opacity-70 text-center py-4">
              Nenhuma verdade cósmica encontrada por enquanto.
            </p>
           )}
        </ResultCard>
        
        {/* --- Prediction Card --- */}
        <ResultCard title="Previsão da Semana" variant="default">
          <div className="flex items-center">
            <FloatingEmoji emoji="🔮" size="lg" />
            <p className="ml-4">{mockResults.prediction}</p>
          </div>
        </ResultCard>
        
        {/* --- Premium Button & Footer --- */}
        <div className="mt-8 mb-4">
          <Button 
            onClick={handlePremiumClick} 
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-semibold py-4 rounded-xl shadow-lg"
          >
            Desbloqueie Análises Premium ✨
          </Button>
        </div>
        
        <div className="flex justify-center space-x-4 mb-16">
          <Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-sm">
            Analisar Outro Chat
          </Button>
          <Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-sm">
            Ver Tutorial
          </Button>
        </div>
        
        <ShareButton onClick={handleShare} />
      </div>
    </GradientBackground>
  );
};

export default ResultsPage;
