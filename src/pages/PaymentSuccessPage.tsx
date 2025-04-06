import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import GradientBackground from '@/components/GradientBackground';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const analysisId = searchParams.get('analysisId');

  useEffect(() => {
    toast.success("Pagamento aprovado! Sua análise premium foi desbloqueada.");
  }, []);

  return (
    <GradientBackground>
      <div className="flex flex-col items-center justify-center min-h-screen text-white text-center p-4">
        <CheckCircle className="w-16 h-16 text-green-400 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Pagamento Aprovado!</h1>
        <p className="mb-8 max-w-md">
          Sua análise premium foi desbloqueada com sucesso. Você já pode acessar todos os insights exclusivos.
        </p>
        {analysisId ? (
          <Button asChild className="bg-white text-purple-700 hover:bg-gray-200">
            <Link to={`/results/${analysisId}`}>Ver Análise Premium</Link>
          </Button>
        ) : (
          <Button asChild className="bg-white text-purple-700 hover:bg-gray-200">
            <Link to={`/`}>Voltar ao Início</Link>
          </Button>
        )}
      </div>
    </GradientBackground>
  );
};

export default PaymentSuccessPage;
