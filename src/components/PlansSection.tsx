
import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlansSection = () => {
  const [billingCycle, setBillingCycle] = useState<'mensal' | 'anual'>('anual');
  const navigate = useNavigate();

  const plans = [
    {
      id: 'premiere',
      name: 'Globoplay Premiere',
      logo: 'PREMIERE',
      monthlyPrice: 36.90,
      annualPrice: 442.80,
      originalAnnualPrice: 442.80,
      benefits: [
        'Globoplay completo',
        'Premiere sem anúncios',
        'Canais ao vivo',
        'Download para offline'
      ],
      highlighted: true
    },
    {
      id: 'cartola',
      name: 'Globoplay Cartola',
      logo: 'cartola',
      monthlyPrice: 15.40,
      annualPrice: 184.80,
      originalAnnualPrice: 184.80,
      benefits: [
        'Globoplay completo',
        'Cartola FC Premium',
        'Estatísticas exclusivas',
        'Download para offline'
      ]
    },
    {
      id: 'telecine',
      name: 'Globoplay Telecine',
      logo: 'TELECINE',
      monthlyPrice: 29.90,
      annualPrice: 358.80,
      originalAnnualPrice: 358.80,
      benefits: [
        'Globoplay completo',
        'Telecine sem anúncios',
        'Filmes em primeira mão',
        'Download para offline'
      ]
    },
    {
      id: 'combate',
      name: 'Globoplay Combate',
      logo: 'combate',
      monthlyPrice: 28.80,
      annualPrice: 345.60,
      originalAnnualPrice: 345.60,
      benefits: [
        'Globoplay completo',
        'Combate sem anúncios',
        'Lutas ao vivo',
        'Download para offline'
      ]
    }
  ];

  const handleSubscribe = (planId: string) => {
    navigate('/checkout', { state: { selectedPlan: planId, billingCycle } });
  };

  return (
    <section className="bg-gray-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Combos Globoplay Plano Padrão com Anúncios
          </h2>
          <p className="text-gray-300 text-lg">
            O melhor catálogo de conteúdo para você!
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-700 p-1 rounded-lg flex">
            <button
              onClick={() => setBillingCycle('mensal')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === 'mensal'
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('anual')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === 'anual'
                  ? 'bg-white text-gray-900 font-medium'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Anual
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-gray-700 rounded-lg p-6 ${
                plan.highlighted ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="text-center mb-6">
                <div className="text-white text-xl font-bold mb-2">globoplay</div>
                <div className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-bold mb-4">
                  {plan.logo}
                </div>
                <div className="text-gray-300 text-sm mb-2">Padrão com Anúncios</div>
                <div className="text-gray-300 text-sm mb-4">Plano Anual</div>
                
                <div className="mb-4">
                  <div className="text-white">
                    <span className="text-sm">12x</span>
                    <span className="text-2xl font-bold">
                      R$ {billingCycle === 'anual' ? (plan.annualPrice / 12).toFixed(2) : plan.monthlyPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-gray-400 text-sm">
                    Total de R$ {billingCycle === 'anual' ? plan.annualPrice.toFixed(2) : (plan.monthlyPrice * 12).toFixed(2)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSubscribe(plan.id)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md font-semibold mb-4 transition-colors"
              >
                Assinar
              </button>

              <button className="w-full text-gray-300 hover:text-white py-2 text-sm transition-colors flex items-center justify-center space-x-2">
                <span>Mais detalhes</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
