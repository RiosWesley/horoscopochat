
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
  selectedChartView: 'hourly' | 'daily' | 'weekly';
  setSelectedChartView: (view: 'hourly' | 'daily' | 'weekly') => void;
  focusedSender: string | null;
  setFocusedSender: (sender: string | null) => void;
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
  const [selectedChartView, setSelectedChartView] = useState<'hourly' | 'daily' | 'weekly'>('hourly');
  const [focusedSender, setFocusedSender] = useState<string | null>(null);

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
