
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import GradientBackground from '@/components/GradientBackground';
import Logo from '@/components/Logo';
import { FloatingEmojiGroup } from '@/components/FloatingEmoji';

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/instructions');
  };

  return (
    <GradientBackground variant="purple">
      <FloatingEmojiGroup />
      
      <div className="flex flex-col justify-center items-center h-full py-10 relative z-10">
        {/* Logo Animation */}
        <div className="mb-8 mt-20">
          <Logo />
        </div>
        
        {/* Main Title */}
        <h1 className="text-4xl font-bold text-white text-center mb-4">
          Horóscopo das Mensagens
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl text-white/90 text-center mb-6">
          Descubra a magia escondida nas suas conversas!
        </p>
        
        {/* Illustration */}
        <div className="w-full max-w-sm mb-8 p-4">
          <div className="cosmic-card bg-white bg-opacity-20 py-8">
            <div className="flex justify-center space-x-4">
              <div className="w-20 h-36 bg-white/30 rounded-xl flex items-center justify-center">
                <span className="text-4xl">💬</span>
              </div>
              <div className="flex flex-col justify-center items-center">
                <div className="w-16 h-0.5 bg-white/50 mb-2"></div>
                <div className="w-16 h-0.5 bg-white/50 mb-2"></div>
                <div className="w-16 h-0.5 bg-white/50"></div>
              </div>
              <div className="w-20 h-36 bg-white/30 rounded-xl flex items-center justify-center">
                <span className="text-4xl">✨</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-center text-white/80 mb-6 px-6">
          Analise seus chats do WhatsApp e revele sua personalidade digital secreta (e engraçada!)
        </p>
        
        {/* Privacy Notice */}
        <div className="flex items-center justify-center mb-10 bg-white/20 rounded-lg p-3">
          <Lock className="h-5 w-5 text-white mr-2" />
          <p className="text-sm text-white/90">
            <strong>Sua privacidade é prioridade!</strong> As mensagens são analisadas direto no seu celular e nunca saem dele.
          </p>
        </div>
        
        {/* CTA Button */}
        <Button 
          onClick={handleStart} 
          className="cosmic-btn text-lg w-4/5 mb-8"
        >
          Revelar meu Horóscopo!
        </Button>
      </div>
    </GradientBackground>
  );
};

export default WelcomePage;
