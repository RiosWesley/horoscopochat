import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  AlertCircle,
  CheckCircle2,
  LucideLoader2,
  Sparkles,
  Lock
} from "lucide-react";
import { useChatAnalysis } from "@/context/ChatAnalysisContext";

declare global {
  interface Window {
    MercadoPago?: any;
    _mpCardFormInstance?: any;
  }
}

const PaymentPage = () => {
  const { analysisId: routeId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();

  const analysisId = routeId;
  const { toast } = useToast();
  const {} = useChatAnalysis();

  const [isLoadingSdk, setIsLoadingSdk] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mpInstance, setMpInstance] = useState<any>(null);

  const premiumPrice = 14.90;

const [identificationType, setIdentificationType] = useState<"CPF" | "CNPJ">("CPF");
const [identificationNumber, setIdentificationNumber] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "pix">("credit_card");

  useEffect(() => {
    if (!analysisId) {
      const msg = "ID da análise não encontrado.";
      setError(msg);
      toast({ title: "Erro", description: msg, variant: "destructive" });
      setIsLoadingSdk(false);
      return;
    }

    const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
    if (!publicKey) {
      const msg = "Chave pública do Mercado Pago não configurada.";
      setError(msg);
      toast({ title: "Erro", description: msg, variant: "destructive" });
      setIsLoadingSdk(false);
      return;
    }

    const scriptId = "mercado-pago-sdk";
    const existingScript = document.getElementById(scriptId);
    let script: HTMLScriptElement | null = null;

    if (!existingScript) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;

      script.onload = () => {
        console.log("Mercado Pago SDK carregado.");
        try {
          if (window.MercadoPago) {
            const mp = new window.MercadoPago(publicKey);
            setMpInstance(mp);
            console.log("Instância Mercado Pago criada.");
          } else {
            throw new Error("Objeto window.MercadoPago não encontrado após carregar script.");
          }
        } catch (err) {
          console.error("Erro ao inicializar Mercado Pago SDK:", err);
          setError("Erro ao inicializar Mercado Pago.");
        } finally {
          setIsLoadingSdk(false);
        }
      };

      script.onerror = () => {
        console.error("Erro ao carregar o SDK Mercado Pago");
        setError("Erro ao carregar o SDK Mercado Pago.");
        setIsLoadingSdk(false);
      };

      document.body.appendChild(script);
    } else {
      try {
        if (window.MercadoPago) {
          const mp = new window.MercadoPago(publicKey);
          setMpInstance(mp);
          console.log("Instância Mercado Pago criada (script pré-existente).");
        } else {
          console.warn("Script do MP existe, mas window.MercadoPago não está definido.");
          setError("Falha ao usar script existente do Mercado Pago. Recarregue a página.");
        }
      } catch (err) {
        console.error("Erro ao inicializar Mercado Pago SDK (script pré-existente):", err);
        setError("Erro ao inicializar Mercado Pago.");
      } finally {
        setIsLoadingSdk(false);
      }
    }
  }, [analysisId, toast]);

  useEffect(() => {
    if (!mpInstance || isLoadingSdk) return;

    // Only initialize cardForm if payment method is credit_card
    if (paymentMethod !== "credit_card") {
      // If switching to Pix, unmount any existing cardForm
      if (window._mpCardFormInstance && typeof window._mpCardFormInstance.unmount === "function") {
        try {
          console.log("Desmontando cardForm porque método mudou para Pix");
          window._mpCardFormInstance.unmount();
        } catch (err) {
          console.error("Erro ao desmontar cardForm ao mudar para Pix:", err);
        }
      }
      return;
    }

    let cardFormInstance: any = null;

    try {
      if (window._mpCardFormInstance && typeof window._mpCardFormInstance.unmount === "function") {
        console.log("Desmontando cardForm anterior...");
        window._mpCardFormInstance.unmount();
      }

      // Adiciona verificação para garantir que o container do formulário existe
      if (!document.getElementById('form-checkout')) {
        throw new Error("Elemento #form-checkout não encontrado no DOM ao tentar criar cardForm.");
      }

      const result = mpInstance.cardForm({
        amount: premiumPrice.toFixed(2),
        autoMount: true, // Corrigido para true para montagem automática recomendada
        form: {
          id: "form-checkout",
          cardholderName: { id: "form-checkout__cardholderName", placeholder: "Nome como no cartão" },
          cardNumber: { id: "form-checkout__cardNumber", placeholder: "---- ---- ---- ----" },
          issuer: { id: "form-checkout__issuer", placeholder: "Bandeira" },
          expirationDate: { id: "form-checkout__expirationDate", placeholder: "MM/AA" },
          securityCode: { id: "form-checkout__securityCode", placeholder: "CVC" },
          installments: { id: "form-checkout__installments", placeholder: "Parcelas" },
        },
        callbacks: {
          onFormMounted: (err: any) => {
            if (err) {
              console.error("Erro ao montar formulário Mercado Pago:", err);
              if (Array.isArray(err)) {
                err.forEach((e, idx) => console.error(`Erro ${idx}:`, e));
              }
              setError("Erro ao preparar o formulário de pagamento.");
            } else {
              console.log("Formulário Mercado Pago montado com sucesso.");
            }
          },
          onSubmit: async (event: any) => {
            console.log("CardForm onSubmit acionado.");
            try {
              const cardData = window._mpCardFormInstance?.getCardFormData();
              if (!cardData) {
                throw new Error("Não foi possível obter os dados do formulário do cartão.");
              }
              console.log("Dados do CardForm:", cardData);
              console.log("Simulando processamento de pagamento com cartão...");
              await new Promise(resolve => setTimeout(resolve, 2000));
              console.log("Simulação de pagamento com cartão concluída.");
              toast({
                title: "Pagamento com Cartão Aprovado!",
                description: "Seu acesso premium foi ativado com sucesso.",
                variant: "default",
              });
              if (analysisId) {
                localStorage.setItem(`premium_paid_${analysisId}`, "true");
              }
              navigate(`/premium?analysisId=${analysisId}`);
            } catch (err: any) {
              console.error("Erro no onSubmit do CardForm:", err);
              setError(err.message || "Erro ao processar pagamento com cartão.");
              toast({
                title: "Falha no pagamento com cartão",
                description: err.message || "Não foi possível processar seu pagamento.",
                variant: "destructive",
              });
            }
          }
        }
      });

      // O resultado de cardForm pode ser a instância ou um array de erros
      if (Array.isArray(result)) {
        // Se for um array, são erros na inicialização
        console.error("Erro ao inicializar cardForm (retornou array):", result);
        setError("Erro ao preparar o formulário de pagamento com cartão.");
        result.forEach((e: any, idx: number) => console.error(`Erro ${idx}:`, e));
      } else if (result && typeof result.mount === 'function') {
        // Se for um objeto com 'mount', é a instância
        cardFormInstance = result;
        window._mpCardFormInstance = cardFormInstance; // Armazena globalmente
        console.log("Instância cardForm criada com autoMount:true (montagem automática).");

      } else {
        // Caso inesperado
        console.error("Resultado inesperado ao criar cardForm:", result);
        setError("Erro inesperado ao preparar formulário de cartão.");
      }

    } catch (err: any) { // Captura erros gerais da criação/verificação
      console.error("Erro geral ao tentar criar/verificar cardForm:", err);
      setError(err.message || "Erro ao preparar o formulário de pagamento.");
    }

    return () => {
      if (cardFormInstance && typeof cardFormInstance.unmount === "function") {
        try {
          cardFormInstance.unmount();
        } catch (unmountError) {
          console.error("Erro ao desmontar CardForm:", unmountError);
        }
      }
    };
  }, [mpInstance, isLoadingSdk, premiumPrice, toast, navigate, analysisId, paymentMethod]);

  // Handler central para submissão do formulário
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Previne submissão HTML padrão
    setIsProcessing(true);
    setError(null);

    try {
      if (paymentMethod === "pix") {
        console.log("Iniciando pagamento via Pix");
        // TODO: Implementar lógica real de geração de Pix (chamada backend?)
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulação
        toast({
          title: "Pagamento Pix gerado!",
          description: "Use o QR Code ou código Copia e Cola para pagar.",
          variant: "default",
        });
        // Aqui poderia navegar para uma página de exibição do Pix ou mostrar modal
        // Por enquanto, apenas exibe o toast e para o processamento aqui.
        // Não navega para premium ainda, pois o pagamento não foi confirmado.

      } else if (paymentMethod === "credit_card") {
        console.log("Submissão via Cartão de Crédito - SDK deve assumir.");
        // O SDK do Mercado Pago deve interceptar a submissão do formulário
        // e chamar o callback 'onSubmit' que definimos dentro de mpInstance.cardForm
        // Se o SDK não fizer isso automaticamente (o que seria estranho),
        // precisaríamos chamar algo como window._mpCardFormInstance.submit() aqui.
        // Por enquanto, confiamos que o SDK fará o trabalho.
        // O callback 'onSubmit' do cardForm cuidará do resto (getCardFormData, etc.)
        // e também do navigate/localStorage em caso de sucesso.
      }
    } catch (err: any) {
      // Erro GERAL no handleFormSubmit (ex: falha na lógica Pix)
      console.error("Erro no handleFormSubmit:", err);
      setError(err.message || "Ocorreu um erro inesperado.");
      toast({
        title: "Erro",
        description: err.message || "Não foi possível processar a solicitação.",
        variant: "destructive",
      });
      setIsProcessing(false); // Garante que sai do estado de processamento em caso de erro aqui
    } finally {
      // IMPORTANTE: Não colocar setIsProcessing(false) aqui se for cartão,
      // pois o callback onSubmit do cardForm precisa rodar e ele tem seu próprio finally.
      // Só definimos como false aqui se for Pix ou erro GERAL antes de chamar o cartão.
      if (paymentMethod === "pix") {
         setIsProcessing(false);
      }
      // Se for cartão, o finally DENTRO do callback onSubmit do cardForm definirá como false.
      // Se ocorrer um erro GERAL aqui ANTES de chegar no cartão, já foi definido como false no catch.
    }
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 bg-gradient-to-b from-background to-secondary/20">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center justify-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" />
            <span>Pagamento Premium</span>
          </h1>
          <p className="text-muted-foreground">
            Desbloqueie análises avançadas, textos criativos por IA e muito mais
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          <Card className="md:col-span-3 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Ativar Recursos Premium
              </CardTitle>
              <CardDescription>
                Insira os dados para completar sua compra
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && !isProcessing && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLoadingSdk ? (
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground flex items-center justify-center">
                    <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando ambiente seguro de pagamento...
                  </p>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !mpInstance && !error ? (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Não foi possível carregar o módulo de pagamento. Tente recarregar a página.</AlertDescription>
                </Alert>
              ) : mpInstance ? (
                // Anexa o handler ao onSubmit do form
                <form id="form-checkout" className="space-y-6" onSubmit={handleFormSubmit}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Método de pagamento</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="credit_card"
                            checked={paymentMethod === "credit_card"}
                            onChange={() => setPaymentMethod("credit_card")}
                            disabled={isProcessing}
                          />
                          Cartão de Crédito
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="pix"
                            checked={paymentMethod === "pix"}
                            onChange={() => setPaymentMethod("pix")}
                            disabled={isProcessing}
                          />
                          Pix
                        </label>
                      </div>
                    </div>

                    <h3 className="text-sm font-medium text-muted-foreground">Dados do comprador</h3>

                    <div className="space-y-2">
                      <Label htmlFor="form-checkout__email">Email</Label>
                      <Input
                        id="form-checkout__email"
                        name="email"
                        type="email"
                        required
                        placeholder="seu@email.com"
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="identificationType">Tipo Doc.</Label>
                        <select
                          id="identificationType"
                          value={identificationType}
                          onChange={(e) => setIdentificationType(e.target.value as "CPF" | "CNPJ")}
                          disabled={isProcessing}
                          className="h-10 border rounded-md w-full px-2"
                        >
                          <option value="CPF">CPF</option>
                          <option value="CNPJ">CNPJ</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="identificationNumber">Número Doc.</Label>
                        <Input
                          id="identificationNumber"
                          value={identificationNumber}
                          onChange={(e) => setIdentificationNumber(e.target.value)}
                          disabled={isProcessing}
                          placeholder={identificationType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                        />
                      </div>
                    </div>

                    {paymentMethod === "credit_card" && (
                      <>
                        <Separator />

                        <h3 className="text-sm font-medium text-muted-foreground">Dados do cartão</h3>

                        <div className="space-y-2">
                          <Label htmlFor="form-checkout__cardholderName">Nome no cartão</Label>
                          {/* Alterado de div para input */}
                          <input id="form-checkout__cardholderName" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="form-checkout__cardNumber">Número do cartão</Label>
                          <input id="form-checkout__cardNumber" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"></input>
                        </div>

                        {/* Adiciona o container para a bandeira (issuer) - Alterado para select */}
                        <div className="space-y-2">
                           <Label htmlFor="form-checkout__issuer">Bandeira</Label>
                           <select id="form-checkout__issuer" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"></select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="form-checkout__expirationDate">Validade (MM/AA)</Label>
                            <input id="form-checkout__expirationDate" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" ></input>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="form-checkout__securityCode">Cód. Segurança</Label>
                            <input id="form-checkout__securityCode" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"></input>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="form-checkout__installments">Parcelas</Label>
                          {/* Alterado de div para select */}
                          <select id="form-checkout__installments" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"></select>
                        </div>
                      </>
                    )}

                    <Button
                      type="submit"
                      className="w-full py-3 mt-4"
                      disabled={isProcessing || isLoadingSdk || !mpInstance}
                    >
                      {isProcessing ? (
                        <>
                          <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          {paymentMethod === "pix" ? "Gerar QR Code Pix" : `Pagar R$ ${premiumPrice.toFixed(2)}`}
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                      <img src="https://img.mlstatic.com/org-img/MP3/API/logos/mercadopago.png" alt="Mercado Pago" className="h-4 opacity-80"/>
                      Pagamento seguro processado por Mercado Pago.
                    </p>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-4">
            <Card className="bg-secondary/20">
              <CardHeader>
                <CardTitle className="text-lg">Resumo da Compra</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Recursos Premium</span>
                    <span className="font-medium">R$ {premiumPrice.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total</span>
                    <span>R$ {premiumPrice.toFixed(2)}</span>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 w-full justify-center py-1">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Pagamento Único - Apenas dessa analise
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Benefícios Incluídos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Análises detalhadas de sentimento e comportamento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Previsões e poemas criativos gerados por IA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Métricas de passivo-agressividade e flerte</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-4 border-t">
                <Button variant="outline" size="sm" asChild className="w-full">
                  {analysisId ? (
                    <Link to={`/results/${analysisId}`}>Voltar para resultados</Link>
                  ) : (
                    <Link to="/">Voltar para início</Link>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq-1">
              <AccordionTrigger>Como funciona o pagamento?</AccordionTrigger>
              <AccordionContent>
                Seu pagamento é processado de forma segura via Mercado Pago. Os dados do seu cartão são enviados diretamente para eles de forma criptografada e não ficam armazenados em nossos servidores.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-2">
              <AccordionTrigger>O acesso premium vale para sempre?</AccordionTrigger>
              <AccordionContent>
                O acesso premium é vitalício, mas vinculado a esta análise específica. Se você iniciar uma nova análise, será necessário adquirir o premium novamente.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
