
import React, { useEffect, useState } from 'react'; // Add useState
import { useNavigate } from 'react-router-dom';
import { useChatAnalysis } from '@/context/ChatAnalysisContext'; // Import context hook
import { parseChat } from '@/lib/parseChat'; // Import parser
import { analyzeChat } from '@/lib/analyzeChat'; // Import analyzer
import GradientBackground from '@/components/GradientBackground';
import AnimatedText from '@/components/AnimatedText';
import CrystalBall from '@/components/CrystalBall';
import { FloatingEmojiGroup } from '@/components/FloatingEmoji';
import { toast } from 'sonner';
import { getFunctions, httpsCallable } from "firebase/functions"; // Import Firebase functions
import { firebaseApp } from '@/firebaseConfig'; // Import Firebase app instance

// Initialize Firebase Functions
const functions = getFunctions(firebaseApp);
const createInitialAnalysisRecordFunction = httpsCallable(functions, 'createInitialAnalysisRecord');

const AnalyzingPage = () => {
  const navigate = useNavigate();
  const {
    rawChatText,
    setParsedMessages,
    setAnalysisResults,
    setIsLoading,
    setError,
    isLoading,
    setAnalysisId, // Get setAnalysisId from context
  } = useChatAnalysis();
  const [currentLoadingText, setCurrentLoadingText] = useState('');

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
    if (!rawChatText) {
      // If there's no chat text, something went wrong (e.g., user navigated directly)
      toast.error("Nenhum arquivo de chat encontrado para analisar.");
      navigate('/instructions'); // Redirect back to instructions
       return;
     }

     const processChat = async () => {
       setIsLoading(true);
       setError(null);
       setAnalysisId(null); // Reset previous ID if any

       try {
         console.log("AnalyzingPage: Starting chat parsing...");
         setCurrentLoadingText("Lendo o arquivo...");
      const parsed = parseChat(rawChatText);
      console.log(`AnalyzingPage: Parsing complete. ${parsed.length} messages found.`);
      setParsedMessages(parsed); // Store parsed messages

      // Now perform analysis
      setCurrentLoadingText("Analisando as mensagens..."); // Update loading text
      console.log("AnalyzingPage: Starting analysis...");
      const results = analyzeChat(parsed); // Call the analysis function
       console.log("AnalyzingPage: Analysis complete.");
       setAnalysisResults(results);

       // --- Create initial Firestore record ---
       let createdAnalysisId: string | null = null;
       try {
         setCurrentLoadingText("Criando registro...");
         console.log("AnalyzingPage: Calling createInitialAnalysisRecordFunction...");
         const initialRecordResult = await createInitialAnalysisRecordFunction();
         const recordData = initialRecordResult.data as { success: boolean; analysisId?: string; message?: string };
         if (recordData.success && recordData.analysisId) {
           createdAnalysisId = recordData.analysisId;
           setAnalysisId(createdAnalysisId); // Save the ID to context
           console.log(`AnalyzingPage: Initial record created with ID: ${createdAnalysisId}`);
           toast.success("Registro inicial criado!");
         } else {
           throw new Error(recordData.message || "Falha ao criar registro inicial no servidor.");
         }
       } catch (recordError: any) {
         console.error("AnalyzingPage: Erro ao criar registro inicial:", recordError);
         toast.error(`Erro ao preparar para compartilhamento/premium: ${recordError.message}. Funcionalidades podem ser limitadas.`);
         setAnalysisId(null); // Ensure ID is null on error
       }
       // --- End Firestore record creation ---

       setCurrentLoadingText("Quase lá...");
       setIsLoading(false);
       toast.success('Análise concluída! ✨');
       navigate('/results'); // Navigate to results page (without ID in URL)

    } catch (err) {
      console.error("AnalyzingPage: Error during processing:", err);
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido durante o processamento.';
      setError(`Erro ao processar o chat: ${errorMessage}`);
      setIsLoading(false);
      toast.error(`Erro no processamento: ${errorMessage}`);
       navigate('/instructions');
     }
    };

    processChat(); // Execute the async function

    // No cleanup needed here as navigation happens within processChat
    // The setTimeout was removed

   }, [rawChatText, navigate, setParsedMessages, setAnalysisResults, setIsLoading, setError, setAnalysisId]); // Add setAnalysisId

   // Render loading state
  return (
    <GradientBackground variant="cool">
      <FloatingEmojiGroup />
      
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-full max-w-xs mx-auto text-center mt-20">
          <h1 className="text-3xl font-bold text-white mb-12">
            Analisando suas mensagens
          </h1>
          
          <div className="relative mt-12 mb-16">
            {/* Optional: Add a subtle animation change based on isLoading */}
            <div className={`absolute inset-0 rounded-full bg-cosmic-purple/30 blur-xl ${isLoading ? 'animate-pulse' : ''}`}></div>
            <CrystalBall size="lg" />
          </div>
          
          <div className="mt-10 h-6"> {/* Fixed height to prevent layout shift */}
            {/* Show specific loading text or AnimatedText */}
            {isLoading ? (
               currentLoadingText ? 
               <p className="text-white/90 text-lg animate-pulse">{currentLoadingText}</p> :
               <AnimatedText phrases={loadingTexts} interval={2000} /> 
            ) : (
              <p className="text-white/80">Concluído!</p> 
            )}
          </div>
        </div>
      </div>
    </GradientBackground>
  );
};

export default AnalyzingPage;
