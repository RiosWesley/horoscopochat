
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Bot, Sparkles, Zap, AlertCircle, Check, MessageSquare } from 'lucide-react';
import { useChatAnalysis } from '@/context/ChatAnalysisContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

// Rate limiting for AI calls
const RATE_LIMIT_INTERVAL = 60000; // 1 minute
const RATE_LIMIT_COUNT = 2; // Calls per interval

const PremiumPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    analysisResults, 
    isPremium, 
    aiPrediction, 
    setAiPrediction, 
    aiStyleAnalysis, 
    setAiStyleAnalysis 
  } = useChatAnalysis();
  
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [loadingStyleAnalysis, setLoadingStyleAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState({
    lastCallTime: 0,
    callCount: 0,
  });
  const [expandedCollapsibles, setExpandedCollapsibles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isPremium) {
      toast({
        title: "Acesso restrito",
        description: "Esta página é exclusiva para assinantes premium.",
        variant: "destructive",
      });
      navigate('/results');
    }
  }, [isPremium, navigate, toast]);

  // Check if we can make an API call based on rate limiting
  const canMakeApiCall = () => {
    const now = Date.now();
    if (now - rateLimit.lastCallTime > RATE_LIMIT_INTERVAL) {
      // Reset counter if interval has passed
      setRateLimit({ lastCallTime: now, callCount: 1 });
      return true;
    } else if (rateLimit.callCount < RATE_LIMIT_COUNT) {
      // Update counter if within limits
      setRateLimit({
        ...rateLimit,
        lastCallTime: now,
        callCount: rateLimit.callCount + 1,
      });
      return true;
    }
    return false;
  };

  // Handler for generating creative text
  const handleGenerateCreativeText = async () => {
    if (!analysisResults) {
      toast({
        title: "Dados insuficientes",
        description: "Não há resultados de análise disponíveis.",
        variant: "destructive",
      });
      return;
    }

    if (!canMakeApiCall()) {
      const remainingTime = Math.ceil((RATE_LIMIT_INTERVAL - (Date.now() - rateLimit.lastCallTime)) / 1000);
      toast({
        title: "Limite de requisições",
        description: `Você atingiu o limite de solicitações. Tente novamente em ${remainingTime} segundos.`,
        variant: "destructive",
      });
      return;
    }

    setLoadingPrediction(true);
    setError(null);

    try {
      const functions = getFunctions();
      const callGemini = httpsCallable(functions, 'callGemini');

      // Extract relevant data for creative generation
      const payload = {
        mostFrequentEmoji: analysisResults.mostFrequentEmoji || "🤔",
        favoriteWord: analysisResults.favoriteWord || "conversa",
        sentimentMix: determineSentimentMix(analysisResults),
        chatSign: determineChatSign(analysisResults.mostActiveHour)
      };

      const result = await callGemini({
        taskType: 'generateCreativeText',
        payload
      });

      // Cast result to expected type (Firebase functions returns data in a specific format)
      const response = result.data as { success: boolean; result: string };
      
      if (response.success) {
        setAiPrediction(response.result);
        toast({
          title: "Texto criativo gerado!",
          description: "Seu texto exclusivo foi gerado com sucesso.",
          variant: "default",
        });
      } else {
        throw new Error("A resposta da API está incompleta.");
      }
    } catch (err) {
      console.error("Error calling Gemini:", err);
      setError("Ocorreu um erro ao gerar o texto criativo. Por favor, tente novamente.");
      toast({
        title: "Erro",
        description: "Não foi possível gerar o texto criativo.",
        variant: "destructive",
      });
    } finally {
      setLoadingPrediction(false);
    }
  };

  // Handler for analyzing communication style
  const handleAnalyzeStyle = async () => {
    if (!analysisResults) {
      toast({
        title: "Dados insuficientes",
        description: "Não há resultados de análise disponíveis.",
        variant: "destructive",
      });
      return;
    }

    if (!canMakeApiCall()) {
      const remainingTime = Math.ceil((RATE_LIMIT_INTERVAL - (Date.now() - rateLimit.lastCallTime)) / 1000);
      toast({
        title: "Limite de requisições",
        description: `Você atingiu o limite de solicitações. Tente novamente em ${remainingTime} segundos.`,
        variant: "destructive",
      });
      return;
    }

    setLoadingStyleAnalysis(true);
    setError(null);

    try {
      // Here we would normally prepare an anonymized sample of messages
      // For now, we'll use a mock sample to demonstrate the functionality
      const anonymizedMessages = prepareAnonymizedMessages();
      const charLimit = 3000; // Reasonable limit for the API

      const functions = getFunctions();
      const callGemini = httpsCallable(functions, 'callGemini');

      const result = await callGemini({
        taskType: 'analyzeCommunicationStyle',
        payload: { 
          anonymizedMessages,
          charLimit
        }
      });

      // Cast result to expected type
      const response = result.data as { success: boolean; result: string };
      
      if (response.success) {
        setAiStyleAnalysis(response.result);
        toast({
          title: "Análise de estilo concluída!",
          description: "A análise do estilo de comunicação foi realizada com sucesso.",
          variant: "default",
        });
      } else {
        throw new Error("A resposta da API está incompleta.");
      }
    } catch (err) {
      console.error("Error analyzing style:", err);
      setError("Ocorreu um erro ao analisar o estilo de comunicação. Por favor, tente novamente.");
      toast({
        title: "Erro",
        description: "Não foi possível analisar o estilo de comunicação.",
        variant: "destructive",
      });
    } finally {
      setLoadingStyleAnalysis(false);
    }
  };

  // Helper function to determine sentiment mix based on analysis results
  const determineSentimentMix = (results: any) => {
    if (!results.keywordCounts) return "Equilibrado";
    
    const positive = results.keywordCounts.positive || 0;
    const negative = results.keywordCounts.negative || 0;
    const total = positive + negative;
    
    if (total === 0) return "Equilibrado";
    
    const positivePercent = (positive / total) * 100;
    
    if (positivePercent > 70) return "Muito positivo";
    if (positivePercent > 55) return "Levemente positivo";
    if (positivePercent < 30) return "Muito negativo";
    if (positivePercent < 45) return "Levemente negativo";
    
    return "Equilibrado";
  };

  // Helper function to convert hour to "chat sign"
  const determineChatSign = (hour: number | null) => {
    if (hour === null) return "Explorador do ZapVerso";
    
    const signs = [
      "Coruja da Madrugada", // 0-1
      "Sonhador Noturno",    // 2-3
      "Madrugador Místico",  // 4-5
      "Energético Matinal",  // 6-7
      "Produtivo Diurno",    // 8-9
      "Estrategista Solar",  // 10-11
      "Comunicador do Meio-dia", // 12-13
      "Equilibrista Vespertino", // 14-15
      "Conectado da Tarde",  // 16-17
      "Descontraído do Crepúsculo", // 18-19
      "Filosófico Noturno",  // 20-21
      "Contemplativo da Noite", // 22-23
    ];
    
    const signIndex = Math.floor(hour / 2);
    return signs[signIndex];
  };

  // Helper to prepare anonymized messages (mock version)
  const prepareAnonymizedMessages = () => {
    // In reality, this would use actual messages from the analysis
    // For now, we'll return a placeholder
    return "Pessoa 1: Oi! Tudo bem?\nPessoa 2: Estou bem, e você?\nPessoa 1: Também estou, obrigado por perguntar. Vamos nos encontrar mais tarde?\nPessoa 2: Sim! Que horas funciona para você?\nPessoa 1: Talvez 18h? No lugar de sempre?\nPessoa 2: Perfeito! Te vejo lá 👍\nPessoa 1: Legal, até mais tarde então.";
  };

  // Toggle collapsible sections
  const toggleCollapsible = (id: string) => {
    setExpandedCollapsibles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Render premium feature card if not loaded yet
  const renderPremiumBlockIfNeeded = () => {
    if (!analysisResults) {
      return (
        <div className="space-y-4 mt-6">
          <Alert variant="default" className="border-amber-500 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Dados não carregados</AlertTitle>
            <AlertDescription>
              Volte para a tela de resultados para carregar os dados da análise.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/results')} variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para resultados
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container max-w-4xl py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/results')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Análises Premium</h1>
        </div>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
          <span className="text-sm font-medium text-muted-foreground">Premium Ativo</span>
        </div>
      </div>

      {renderPremiumBlockIfNeeded()}

      {analysisResults && (
        <>
          {/* Detailed Analysis Section */}
          <Card className="border-purple-200 shadow-sm">
            <CardHeader className="bg-purple-50 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <CardTitle>Análises Detalhadas</CardTitle>
              </div>
              <CardDescription>
                Métricas avançadas sobre o estilo comunicacional do chat
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="overall">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overall">Análise Geral</TabsTrigger>
                  <TabsTrigger value="participants">Por Participante</TabsTrigger>
                </TabsList>
                <TabsContent value="overall" className="mt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Passive-Aggressive Analysis */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm text-muted-foreground">Nível Passivo-Agressivo</h3>
                        <span className="text-lg font-semibold">
                          {analysisResults.passiveAggressivePercentage !== null 
                            ? `${analysisResults.passiveAggressivePercentage}%` 
                            : 'N/A'}
                        </span>
                      </div>
                      <Progress 
                        value={analysisResults.passiveAggressivePercentage || 0} 
                        className="h-2 bg-slate-200"
                        indicatorClassName={`${
                          (analysisResults.passiveAggressivePercentage || 0) > 30 
                            ? 'bg-orange-500' 
                            : 'bg-emerald-500'
                        }`}
                      />
                      <p className="text-xs text-muted-foreground">
                        {(analysisResults.passiveAggressivePercentage || 0) > 30 
                          ? 'Presença significativa de elementos passivo-agressivos na conversa.' 
                          : 'Nível saudável de comunicação direta.'}
                      </p>
                    </div>

                    {/* Flirtation Analysis */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm text-muted-foreground">Nível de Flerte</h3>
                        <span className="text-lg font-semibold">
                          {analysisResults.flirtationPercentage !== null 
                            ? `${analysisResults.flirtationPercentage}%` 
                            : 'N/A'}
                        </span>
                      </div>
                      <Progress 
                        value={analysisResults.flirtationPercentage || 0} 
                        className="h-2 bg-slate-200"
                        indicatorClassName="bg-pink-500"
                      />
                      <p className="text-xs text-muted-foreground">
                        {(analysisResults.flirtationPercentage || 0) > 20 
                          ? 'Comunicação com presença notável de elementos românticos ou flertes.' 
                          : 'Comunicação predominantemente platônica.'}
                      </p>
                    </div>
                  </div>

                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="font-medium">Elementos Detectados</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Uso de reticências (...)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Emojis românticos</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Respostas curtas e secas</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Elogios pessoais</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="participants" className="mt-4 space-y-4">
                  {Object.entries(analysisResults.statsPerSender).map(([sender, stats]) => (
                    <Collapsible
                      key={sender}
                      open={expandedCollapsibles[sender]}
                      onOpenChange={() => toggleCollapsible(sender)}
                      className="border rounded-md"
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50">
                          <div className="font-medium">{sender}</div>
                          <div className="text-sm text-muted-foreground">
                            {expandedCollapsibles[sender] ? "Ocultar" : "Mostrar"} métricas
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 pt-0 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Passivo-Agressividade:</span>
                              <span className="font-medium">
                                {stats.passiveAggressivePercentage !== null 
                                  ? `${stats.passiveAggressivePercentage}%` 
                                  : 'N/A'}
                              </span>
                            </div>
                            <Progress 
                              value={stats.passiveAggressivePercentage || 0} 
                              className="h-2 bg-slate-200"
                              indicatorClassName={`${
                                (stats.passiveAggressivePercentage || 0) > 30 
                                  ? 'bg-orange-500' 
                                  : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Nível de Flerte:</span>
                              <span className="font-medium">
                                {stats.flirtationPercentage !== null 
                                  ? `${stats.flirtationPercentage}%` 
                                  : 'N/A'}
                              </span>
                            </div>
                            <Progress 
                              value={stats.flirtationPercentage || 0} 
                              className="h-2 bg-slate-200"
                              indicatorClassName="bg-pink-500"
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Creative AI Text Card */}
          <Card className="border-amber-200 shadow-sm">
            <CardHeader className="bg-amber-50 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-amber-600" />
                <CardTitle>Previsão & Poema IA</CardTitle>
              </div>
              <CardDescription>
                Criação única baseada nos padrões do seu chat
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {aiPrediction ? (
                <div className="bg-amber-50 p-4 rounded-md border border-amber-100">
                  <p className="italic text-lg text-center">{aiPrediction}</p>
                </div>
              ) : loadingPrediction ? (
                <div className="space-y-3">
                  <Skeleton className="w-full h-6" />
                  <Skeleton className="w-4/5 h-6 mx-auto" />
                  <Skeleton className="w-3/4 h-6 mx-auto" />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Clique no botão abaixo para gerar um texto criativo exclusivo sobre seu chat.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <Button 
                onClick={handleGenerateCreativeText} 
                disabled={loadingPrediction}
                variant="outline"
                className="border-amber-300 hover:bg-amber-50"
              >
                {loadingPrediction ? (
                  <>Gerando texto criativo...</>
                ) : aiPrediction ? (
                  <>Gerar outro texto</>
                ) : (
                  <>Gerar texto criativo</>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Communication Style Analysis Card */}
          <Card className="border-cyan-200 shadow-sm">
            <CardHeader className="bg-cyan-50 border-b border-cyan-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-cyan-600" />
                <CardTitle>Análise de Estilo IA</CardTitle>
              </div>
              <CardDescription>
                Análise detalhada do estilo de comunicação predominante
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {aiStyleAnalysis ? (
                <div className="bg-cyan-50 p-4 rounded-md border border-cyan-100">
                  <p>{aiStyleAnalysis}</p>
                </div>
              ) : loadingStyleAnalysis ? (
                <div className="space-y-3">
                  <Skeleton className="w-full h-5" />
                  <Skeleton className="w-full h-5" />
                  <Skeleton className="w-4/5 h-5" />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Clique no botão abaixo para analisar o estilo de comunicação deste chat.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <Button 
                onClick={handleAnalyzeStyle} 
                disabled={loadingStyleAnalysis}
                variant="outline"
                className="border-cyan-300 hover:bg-cyan-50"
              >
                {loadingStyleAnalysis ? (
                  <>Analisando estilo...</>
                ) : aiStyleAnalysis ? (
                  <>Atualizar análise</>
                ) : (
                  <>Analisar estilo de comunicação</>
                )}
              </Button>
            </CardFooter>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center pt-4">
            <Button 
              variant="default" 
              onClick={() => navigate('/results')}
              className="px-8"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para resultados
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PremiumPage;
