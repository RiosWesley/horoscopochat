import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import GradientBackground from '@/components/GradientBackground';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

const PaymentPendingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const analysisId = searchParams.get('analysisId');

  useEffect(() => {
    toast.info("Seu pagamento está sendo processado.");
  }, []);

  return (
    <GradientBackground>
      <div className="flex flex-col items-center justify-center min-h-screen text-white text-center p-4">
        <Clock className="w-16 h-16 text-yellow-400 mb-6 animate-pulse" />
        <h1 className="text-3xl font-bold mb-4">Pagamento Pendente</h1>
        <p className="mb-8 max-w-md">
          Seu pagamento está sendo processado. Assim que for aprovado, sua análise premium será desbloqueada. Você pode verificar o status novamente mais tarde acessando o link da análise.
        </p>
        {analysisId ? (
          <Button asChild variant="outline" className="border-white/50 bg-white/10 hover:bg-white/20">
            <Link to={`/results/${analysisId}`}>Verificar Análise Novamente</Link>
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

export default PaymentPendingPage;
