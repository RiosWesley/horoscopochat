
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChatAnalysisProvider } from './context/ChatAnalysisContext'; // Import the provider
import Index from './pages/Index';
import WelcomePage from "./pages/WelcomePage";
import InstructionsPage from "./pages/InstructionsPage";
import AnalyzingPage from "./pages/AnalyzingPage";
import ResultsPage from "./pages/ResultsPage";
import PremiumPage from "./pages/PremiumPage"; // Import the new Premium page
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ChatAnalysisProvider> {/* Wrap the app with the provider */}
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/instructions" element={<InstructionsPage />} />
            <Route path="/analyzing" element={<AnalyzingPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/premium" element={<PremiumPage />} /> {/* Add premium route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ChatAnalysisProvider> {/* Close the provider */}
  </QueryClientProvider>
);

export default App;
