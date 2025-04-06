
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  Lock, 
  CalendarDays,
  CreditCardIcon
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useChatAnalysis } from "@/context/ChatAnalysisContext";

// For mock integration
declare global {
  interface Window {
    MercadoPago?: any;
  }
}

type FormData = {
  email: string;
  docType: string;
  docNumber: string;
  cardholderName: string;
  cardNumber: string;
  expirationMonth: string;
  expirationYear: string;
  securityCode: string;
  installments: string;
};

const PaymentPage = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { chatResults } = useChatAnalysis();
  
  // Form state
  const [isLoadingSdk, setIsLoadingSdk] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mpInstance, setMpInstance] = useState<any>(null);

  // Mock payment amount
  const premiumPrice = 14.90;

  // Prepare form with react-hook-form
  const form = useForm<FormData>({
    defaultValues: {
      email: "",
      docType: "CPF",
      docNumber: "",
      cardholderName: "",
      cardNumber: "",
      expirationMonth: "",
      expirationYear: "",
      securityCode: "",
      installments: "1"
    }
  });

  // Initialize payment SDK (mocked for now)
  useEffect(() => {
    if (!analysisId) {
      setError("ID da análise não encontrado.");
      toast({
        title: "Erro",
        description: "ID da análise não encontrado.",
        variant: "destructive"
      });
      return;
    }

    // Mock SDK loading with setTimeout
    const timer = setTimeout(() => {
      setIsLoadingSdk(false);
      console.log("Mock: SDK de pagamento carregado com sucesso");
      
      // Mock MP instance
      setMpInstance({ ready: true });
    }, 1500);

    return () => clearTimeout(timer);
  }, [analysisId, toast]);

  // Mock function to handle form submission
  const onSubmit = async (formData: FormData) => {
    try {
      setError(null);
      setIsProcessing(true);

      console.log("Dados do formulário:", formData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful payment processing
      const mockSuccess = Math.random() > 0.2; // 80% success rate for demo
      
      if (mockSuccess) {
        // Show success toast
        toast({
          title: "Pagamento aprovado!",
          description: "Seu acesso premium foi ativado com sucesso.",
          variant: "default",
        });
        
        // Navigate to premium page
        navigate(`/premium?analysisId=${analysisId}`);
      } else {
        // Show error for demo purposes
        throw new Error("Pagamento recusado pelo banco emissor.");
      }
    } catch (err: any) {
      console.error("Erro ao processar pagamento:", err);
      setError(err.message || "Erro ao processar pagamento.");
      toast({
        title: "Falha no pagamento",
        description: err.message || "Não foi possível processar seu pagamento.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate available years for card expiration
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear + i).toString().slice(-2));
  
  // Generate available months
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0');
    return month;
  });

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
          {/* Left column - Payment form */}
          <Card className="md:col-span-3 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Ativar Recursos Premium
              </CardTitle>
              <CardDescription>
                Insira os dados do cartão para completar sua compra
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {isLoadingSdk ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Dados do comprador</h3>
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="seu@email.com" 
                                type="email" 
                                required
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="docType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de documento</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="CPF">CPF</SelectItem>
                                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="docNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número do documento</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={field.value === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"} 
                                  required
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground">Dados do cartão</h3>
                        <div className="flex items-center gap-2">
                          <img src="/visa.svg" alt="Visa" className="h-6 w-auto" />
                          <img src="/mastercard.svg" alt="Mastercard" className="h-6 w-auto" />
                          <img src="/elo.svg" alt="Elo" className="h-6 w-auto" />
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="cardholderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome no cartão</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nome impresso no cartão" 
                                required
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número do cartão</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="0000 0000 0000 0000" 
                                  required
                                  {...field} 
                                />
                                <CreditCardIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="expirationMonth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mês</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="MM" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {months.map(month => (
                                      <SelectItem key={month} value={month}>{month}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="expirationYear"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ano</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="AA" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {years.map(year => (
                                      <SelectItem key={year} value={year}>{year}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="securityCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código de segurança</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  maxLength={4}
                                  placeholder="000" 
                                  required
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="installments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parcelas</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1x de R$ {premiumPrice.toFixed(2)} sem juros</SelectItem>
                                <SelectItem value="2">2x de R$ {(premiumPrice / 2).toFixed(2)} sem juros</SelectItem>
                                <SelectItem value="3">3x de R$ {(premiumPrice / 3).toFixed(2)} sem juros</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Button 
                        type="submit" 
                        className="w-full py-6" 
                        disabled={isProcessing || isLoadingSdk}
                      >
                        {isProcessing ? (
                          <>
                            <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            Processando...
                          </>
                        ) : (
                          <>
                            Pagar R$ {premiumPrice.toFixed(2)}
                          </>
                        )}
                      </Button>
                      
                      <p className="text-xs text-center text-muted-foreground flex items-center justify-center">
                        <Lock className="h-3 w-3 mr-1" /> 
                        Seus dados estão protegidos com criptografia segura
                      </p>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          {/* Right column - Order summary */}
          <div className="md:col-span-2">
            <Card className="bg-primary-foreground mb-4">
              <CardHeader>
                <CardTitle className="text-xl">Resumo da compra</CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Análise Premium</span>
                    <span>R$ {premiumPrice.toFixed(2)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>R$ {premiumPrice.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">O que você recebe</CardTitle>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Análises detalhadas de sentimento e comportamento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Previsões e poemas criativos gerados por IA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Análise de estilo comunicacional</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Métricas de passivo-agressividade e flerte</span>
                  </li>
                </ul>
              </CardContent>
              
              <CardFooter className="flex-col items-start gap-2">
                <Badge variant="outline" className="bg-secondary/30">Acesso vitalício</Badge>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/results/${analysisId}`}>Voltar para resultados</Link>
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
                Seu pagamento é processado de forma segura via Mercado Pago. Os dados do seu cartão são criptografados e não são armazenados em nossos servidores.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="faq-2">
              <AccordionTrigger>Posso solicitar reembolso?</AccordionTrigger>
              <AccordionContent>
                Caso não esteja satisfeito com as análises premium, você pode solicitar reembolso em até 7 dias após a compra.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="faq-3">
              <AccordionTrigger>Por quanto tempo terei acesso ao premium?</AccordionTrigger>
              <AccordionContent>
                Seu acesso é vitalício para a análise atual. Cada nova análise de conversa requer uma nova compra premium.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
