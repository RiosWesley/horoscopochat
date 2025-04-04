
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GradientBackground from '@/components/GradientBackground';
import AnimatedText from '@/components/AnimatedText';
import CrystalBall from '@/components/CrystalBall';
import { FloatingEmojiGroup } from '@/components/FloatingEmoji';

const AnalyzingPage = () => {
  const navigate = useNavigate();
  
  // Sample funny loading texts
  const loadingTexts = [
    "Consultando os astros do seu teclado...",
    "Calculando seu nível de ironia...",
    "Decifrando seus 'kkkkk'...",
    "Alinhando os planetas do seu chat...",
    "Polindo sua aura digital...",
    "Contando quantos 'rs' você mandou...",
    "Analisando seu uso de emojis...",
    "Medindo seu poder de deixar no vácuo...",
    "Calculando a energia dos seus áudios...",
    "Traduzindo seus memes para linguagem cósmica..."
  ];

  useEffect(() => {
    // After a delay, navigate to the results page
    // In a real app, this would happen after the analysis is complete
    const timer = setTimeout(() => {
      navigate('/results');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <GradientBackground variant="cool">
      <FloatingEmojiGroup />
      
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-full max-w-xs mx-auto text-center mt-20">
          <h1 className="text-3xl font-bold text-white mb-12">
            Analisando suas mensagens
          </h1>
          
          <div className="relative mt-12 mb-16">
            <div className="absolute inset-0 rounded-full bg-cosmic-purple/30 blur-xl"></div>
            <CrystalBall size="lg" />
          </div>
          
          <div className="mt-10">
            <AnimatedText phrases={loadingTexts} interval={2000} />
          </div>
        </div>
      </div>
    </GradientBackground>
  );
};

export default AnalyzingPage;
