import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import GradientBackground from '@/components/GradientBackground';
import { XCircle } from 'lucide-react';
import { toast } from 'sonner';

const PaymentFailurePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const analysisId = searchParams.get('analysisId');

  useEffect(() => {
    toast.error("Ocorreu um problema com o pagamento.");
  }, []);

  return (
    <GradientBackground>
      <div className="flex flex-col items-center justify-center min-h-screen text-white text-center p-4">
        <XCircle className="w-16 h-16 text-red-400 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Falha no Pagamento</h1>
        <p className="mb-8 max-w-md">
          Não foi possível processar seu pagamento. Por favor, verifique os dados ou tente novamente mais tarde. Nenhum valor foi cobrado.
        </p>
        {analysisId ? (
          <Button asChild variant="outline" className="border-white/50 bg-white/10 hover:bg-white/20">
            <Link to={`/results/${analysisId}`}>Voltar para Análise</Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="border-white/50 bg-white/10 hover:bg-white/20">
            <Link to={`/`}>Voltar ao Início</Link>
          </Button>
        )}
      </div>
    </GradientBackground>
  );
};

export default PaymentFailurePage;
