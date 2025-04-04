
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Share2, Clock, Award, Star, Gift } from 'lucide-react';
import GradientBackground from '@/components/GradientBackground';
import ResultCard, { ShareButton } from '@/components/ResultCard';
import { toast } from 'sonner';
import FloatingEmoji from '@/components/FloatingEmoji';

const ResultsPage = () => {
  const navigate = useNavigate();
  const [showPremium, setShowPremium] = useState(false);
  
  // Mock results data
  const results = {
    sign: "Comediante Cósmico do 😂",
    personality: {
      sarcastic: 70,
      cute: 30
    },
    mainEmoji: "😂",
    favoriteWord: "top",
    primeTime: "22:47",
    funFacts: [
      "Você usa 'kkk' mais do que vírgula",
      "Seu nível de resposta 'ok.' merece um troféu de minimalismo",
      "Mestre em deixar no vácuo... cósmico?"
    ],
    prediction: "Altas chances de mandar um áudio de 3 minutos sem querer. Prepare-se!"
  };
  
  const handleShare = () => {
    // In a real app, this would generate an image and share it
    toast.success('Em um app real, isto compartilharia uma imagem dos seus resultados!');
  };
  
  const handlePremiumClick = () => {
    setShowPremium(true);
  };
  
  const handleBackToResults = () => {
    setShowPremium(false);
  };
  
  const handleSubscribe = () => {
    toast.success('Obrigado por se interessar! Em um app real, isto processaria sua assinatura.');
    setTimeout(() => {
      setShowPremium(false);
    }, 1500);
  };
  
  if (showPremium) {
    return (
      <GradientBackground variant="warm">
        <div className="flex flex-col h-full py-8">
          <h1 className="text-3xl font-bold text-center text-white mb-8">
            Desbloqueie o Universo Completo!
          </h1>
          
          <div className="cosmic-card bg-white/40 mb-8">
            <h2 className="text-xl font-bold mb-6 text-center">
              Torne-se um Mestre Astral das Mensagens 🔮
            </h2>
            
            <div className="space-y-5 mb-6">
              <div className="flex items-start">
                <div className="bg-cosmic-pink rounded-full p-2 mr-3">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Análises Mais Profundas</h3>
                  <p className="text-sm opacity-80">Descubra seu nível de passivo-agressividade, flerte e mais!</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-cosmic-purple rounded-full p-2 mr-3">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Compatibilidade Astral de Chat</h3>
                  <p className="text-sm opacity-80">Veja o quão compatível é seu jeito de teclar com seus amigos.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-cosmic-neonBlue rounded-full p-2 mr-3">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Sem Anúncios + Temas Exclusivos</h3>
                  <p className="text-sm opacity-80">Uma experiência cósmica sem interrupções e personalizada.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="cosmic-card bg-white/40 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-center">Escolha seu Plano</h3>
            
            <div className="space-y-4">
              <div className="border border-cosmic-purple rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Mensal</h4>
                  <p className="text-sm opacity-70">Acesso ilimitado</p>
                </div>
                <p className="font-bold">R$ 9,99</p>
              </div>
              
              <div className="border-2 border-cosmic-purple rounded-lg p-4 flex justify-between items-center bg-cosmic-purple/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-cosmic-pink text-xs font-bold text-white py-1 px-2 rounded-bl">
                  MELHOR OFERTA
                </div>
                <div>
                  <h4 className="font-medium">Anual</h4>
                  <p className="text-sm opacity-70">Economize 50%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm line-through opacity-50">R$ 119,88</p>
                  <p className="font-bold">R$ 59,99</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-auto space-y-4">
            <Button 
              onClick={handleSubscribe}
              className="cosmic-btn w-full"
            >
              Desbloquear Tudo!
            </Button>
            
            <Button 
              onClick={handleBackToResults}
              variant="outline"
              className="w-full border-white bg-transparent text-white hover:bg-white/20"
            >
              Voltar para Resultados
            </Button>
            
            <p className="text-xs text-center text-white/70">
              Você pode cancelar sua assinatura a qualquer momento
            </p>
          </div>
        </div>
      </GradientBackground>
    );
  }
  
  return (
    <GradientBackground>
      <div className="flex flex-col min-h-screen pb-20">
        <h1 className="text-3xl font-bold text-center mt-8 mb-6">
          Seu Horóscopo de Chat!
        </h1>
        
        <div className="cosmic-card bg-gradient-purple-pink text-white mb-8">
          <div className="text-center">
            <FloatingEmoji emoji="✨" size="md" />
            <h2 className="text-2xl font-bold my-2">{results.sign}</h2>
            <FloatingEmoji emoji="✨" size="md" />
          </div>
        </div>
        
        <ResultCard title="Mix de Personalidade" variant="default">
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="mr-2 opacity-80">Sua Vibe:</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div 
                className="h-6 rounded-full bg-gradient-to-r from-cosmic-purple to-cosmic-pink flex items-center pl-2 text-xs text-white font-medium"
                style={{ width: `${results.personality.sarcastic}%` }}
              >
                {results.personality.sarcastic}% Sarcástico 😎
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div 
                className="h-6 rounded-full bg-gradient-to-r from-cosmic-pink to-cosmic-neonBlue flex items-center pl-2 text-xs text-white font-medium"
                style={{ width: `${results.personality.cute}%` }}
              >
                {results.personality.cute}% Fofo 🥰
              </div>
            </div>
          </div>
        </ResultCard>
        
        <ResultCard title="Destaques do Chat" variant="primary">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Emoji Principal:</span>
              <span className="text-4xl">{results.mainEmoji}</span>
            </div>
            <p className="text-sm">
              Seu espírito animal digital é o {results.mainEmoji}! Revela seu otimismo contagiante.
            </p>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Palavra Favorita:</span>
              <span className="bg-white/30 px-3 py-1 rounded-full font-bold">
                {results.favoriteWord}
              </span>
            </div>
            <p className="text-sm">
              Sua palavra de poder é "<strong>{results.favoriteWord}</strong>". Use com sabedoria.
            </p>
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              <span className="font-medium">Horário Nobre: </span>
              <span className="ml-2 bg-white/30 px-2 py-0.5 rounded font-bold">
                {results.primeTime}
              </span>
            </div>
            <p className="text-sm">
              Sua energia de chat bomba às <strong>{results.primeTime}</strong>.
            </p>
          </div>
        </ResultCard>
        
        <ResultCard title="Pequenas Verdades" variant="secondary">
          <ul className="space-y-3">
            {results.funFacts.map((fact, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 text-lg">•</span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </ResultCard>
        
        <ResultCard title="Previsão da Semana" variant="accent">
          <div className="flex items-center">
            <FloatingEmoji emoji="🔮" size="lg" />
            <p className="ml-4">{results.prediction}</p>
          </div>
        </ResultCard>
        
        <div className="mt-8 mb-4">
          <Button
            onClick={handlePremiumClick}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-semibold py-4 rounded-xl shadow-lg"
          >
            Desbloqueie Análises Premium ✨
          </Button>
        </div>
        
        <p className="text-center text-sm opacity-70 mb-16">
          Analise outro chat para descobrir mais personalidades!
        </p>
        
        <ShareButton onClick={handleShare} />
      </div>
    </GradientBackground>
  );
};

export default ResultsPage;
