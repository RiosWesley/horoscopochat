
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MessageSquare, MoreVertical, Download, Upload, HelpCircle } from 'lucide-react';
import { useChatAnalysis } from '@/context/ChatAnalysisContext'; // Import the context hook
import GradientBackground from '@/components/GradientBackground';
import StepIndicator from '@/components/StepIndicator';
import { toast } from 'sonner';

const InstructionsPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  // Get setters from the context
  const { setRawChatText, setIsLoading, setError } = useChatAnalysis(); 
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      if (selectedFile.name.endsWith('.txt')) {
        setFile(selectedFile);
        toast.success('Arquivo selecionado com sucesso!');
      } else {
        toast.error('Por favor, selecione um arquivo .txt');
      }
    }
  };
  
  const handleSubmit = () => {
    if (file) {
      setIsLoading(true); // Set loading state
      setError(null); // Clear previous errors
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          setRawChatText(text); // Store raw text in context
          setIsLoading(false);
          navigate('/analyzing'); // Navigate after successful read
        } else {
          setError('Falha ao ler o conteúdo do arquivo.');
          setIsLoading(false);
          toast.error('Não foi possível ler o conteúdo do arquivo.');
        }
      };
      
      reader.onerror = () => {
        setError('Erro ao ler o arquivo.');
        setIsLoading(false);
        toast.error('Ocorreu um erro ao tentar ler o arquivo.');
      };
      
      reader.readAsText(file); // Read the file as text
      
    } else {
      toast.error('Por favor, selecione um arquivo de chat para continuar');
    }
  };
  
  const handleHelp = () => {
    toast('Dica: O WhatsApp permite exportar suas conversas facilmente. Se precisar de mais ajuda, visite nosso site.', {
      duration: 5000,
    });
  };
  
  const steps = [
    {
      icon: <MessageSquare className="h-10 w-10 text-cosmic-purple" />,
      title: "Abra a conversa no WhatsApp",
      description: "Selecione um chat individual ou grupo",
    },
    {
      icon: <MoreVertical className="h-10 w-10 text-cosmic-purple" />,
      title: "Vá em Opções > Mais > Exportar conversa",
      description: "Toque nos três pontos no canto superior direito",
    },
    {
      icon: <Download className="h-10 w-10 text-cosmic-purple" />,
      title: "Escolha 'Sem Mídia'",
      description: "Só precisamos do texto, não das imagens",
    },
    {
      icon: <Upload className="h-10 w-10 text-cosmic-purple" />,
      title: "Envie o arquivo .txt para nosso app",
      description: "Use o botão abaixo para selecionar o arquivo",
    }
  ];

  return (
    <GradientBackground>
      <div className="flex flex-col h-full">
        <header className="flex items-center py-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2"
          >
            <ChevronLeft className="h-6 w-6 text-cosmic-purple" />
          </button>
          <h1 className="text-2xl font-bold flex-1 text-center mr-8">Instruções</h1>
        </header>
        
        <StepIndicator currentStep={1} totalSteps={4} />
        
        <div className="mt-4 mb-6">
          <h2 className="text-xl font-bold text-center mb-4">
            Ok, hora da mágica! Vamos pegar seu chat.
          </h2>
        </div>
        
        <div className="space-y-6 mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start cosmic-card">
              <div className="bg-white rounded-full p-3 mr-4">
                {step.icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="text-sm opacity-80">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* File Upload Area */}
        <div className="relative mb-8">
          <div className="cosmic-card border-2 border-dashed border-cosmic-purple p-8 text-center">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".txt"
            />
            <Upload className="h-12 w-12 mx-auto mb-4 text-cosmic-purple" />
            <p className="font-medium">
              {file ? file.name : 'Clique para selecionar o arquivo .txt'}
            </p>
            <p className="text-sm opacity-70 mt-2">
              {file ? 'Arquivo selecionado' : 'Ou arraste e solte aqui'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center mb-6">
          <button 
            onClick={handleHelp}
            className="flex items-center text-sm text-cosmic-darkPurple"
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Problemas? Veja como fazer
          </button>
        </div>
        
        <div className="mt-auto mb-8">
          <Button 
            onClick={handleSubmit}
            disabled={!file}
            className={`cosmic-btn w-full ${!file ? 'opacity-60' : ''}`}
          >
            Analisar Mensagens
          </Button>
        </div>
      </div>
    </GradientBackground>
  );
};

export default InstructionsPage;
