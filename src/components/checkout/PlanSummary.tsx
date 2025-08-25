
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomizations } from '@/hooks/useCustomizations';

interface Plan {
  name: string;
  price: number;
}

interface PlanSummaryProps {
  plan: Plan;
}

const PlanSummary = ({ plan }: PlanSummaryProps) => {
  const { getCustomization } = useCustomizations('global');
  const siteName = getCustomization('global_site_name', 'Globoplay');

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Plano Selecionado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border border-gray-600 rounded-lg p-4">
          <h3 className="text-white font-semibold text-lg">
            {plan.name}
          </h3>
          <p className="text-gray-400 text-sm mb-4">Padrão com Anúncios</p>
          <div className="text-white">
            <span className="text-sm">12x</span>
            <span className="text-2xl font-bold ml-1">
              R$ {plan.price.toFixed(2)}
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            Total de R$ {(plan.price * 12).toFixed(2)}
          </p>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-white font-medium">Benefícios inclusos:</h4>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• {siteName} completo</li>
            <li>• Canais ao vivo</li>
            <li>• Download para offline</li>
            <li>• Sem anúncios nos conteúdos premium</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanSummary;
