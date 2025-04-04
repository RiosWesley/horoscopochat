
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ParsedMessage } from '../lib/parseChat'; // Correct: ParsedMessage comes from parseChat
// Import the full type definition from the source file
import type { AnalysisResults } from '../lib/analyzeChat'; // Correct: AnalysisResults comes from analyzeChat. REMOVED ParsedMessage import from here.

interface ChatAnalysisContextType {
  rawChatText: string | null;
  setRawChatText: (text: string | null) => void;
  parsedMessages: ParsedMessage[] | null; // Use ParsedMessage from parseChat
  setParsedMessages: (messages: ParsedMessage[] | null) => void;
  analysisResults: AnalysisResults | null; // Use AnalysisResults from analyzeChat
  setAnalysisResults: (results: AnalysisResults | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  selectedChartView: 'daily' | 'weekly'; // Removed 'hourly'
  setSelectedChartView: (view: 'daily' | 'weekly') => void; // Removed 'hourly'
  focusedSender: string | null;
  setFocusedSender: (sender: string | null) => void;
  isPremium: boolean; // Added isPremium flag
  setIsPremium: (isPremium: boolean) => void; // Added setter for premium status
  aiPrediction: string | null;
  setAiPrediction: (prediction: string | null) => void;
  aiStyleAnalysis: string | null;
  setAiStyleAnalysis: (analysis: string | null) => void;
  resetAnalysis: () => void; // Add the reset function type
}

const ChatAnalysisContext = createContext<ChatAnalysisContextType | undefined>(undefined);

interface ChatAnalysisProviderProps {
  children: ReactNode;
}

export const ChatAnalysisProvider: React.FC<ChatAnalysisProviderProps> = ({ children }) => {
  const [rawChatText, setRawChatText] = useState<string | null>(null);
  const [parsedMessages, setParsedMessages] = useState<ParsedMessage[] | null>(null); // Use ParsedMessage from parseChat
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null); // Use AnalysisResults from analyzeChat
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChartView, setSelectedChartView] = useState<'daily' | 'weekly'>('daily'); // Changed default to 'daily'
  const [focusedSender, setFocusedSender] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false); // Initialize premium as false
  const [aiPrediction, setAiPrediction] = useState<string | null>(null);
  const [aiStyleAnalysis, setAiStyleAnalysis] = useState<string | null>(null);

  // Function to reset the analysis state
  const resetAnalysis = () => {
    setRawChatText(null);
    setParsedMessages(null);
    setAnalysisResults(null);
    setIsLoading(false); // Ensure loading is reset
    setError(null);
    setSelectedChartView('daily'); // Reset view to default
    setFocusedSender(null);
    // Keep premium status as is, or reset if desired: setIsPremium(false);
    setAiPrediction(null); // Reset AI results
    setAiStyleAnalysis(null);
  };

  const value = {
    rawChatText,
    setRawChatText,
    parsedMessages,
    setParsedMessages,
    analysisResults,
    setAnalysisResults,
    isLoading,
    setIsLoading,
    error,
    setError,
    selectedChartView,
    setSelectedChartView,
    focusedSender,
    setFocusedSender,
    isPremium,
    setIsPremium,
    aiPrediction,
    setAiPrediction,
    aiStyleAnalysis,
    setAiStyleAnalysis,
    resetAnalysis, // Provide the reset function in the context value
  };

  return (
    <ChatAnalysisContext.Provider value={value}>
      {children}
    </ChatAnalysisContext.Provider>
  );
};

export const useChatAnalysis = (): ChatAnalysisContextType => {
  const context = useContext(ChatAnalysisContext);
  if (context === undefined) {
    throw new Error('useChatAnalysis must be used within a ChatAnalysisProvider');
  }
  return context;
};
