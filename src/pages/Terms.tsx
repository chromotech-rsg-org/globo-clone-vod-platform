import React from 'react';
import { useCustomizations } from '@/hooks/useCustomizations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Terms = () => {
  const { getCustomization } = useCustomizations('home');
  
  const termsTitle = getCustomization('terms', 'terms_title', 'Termos e Condições');
  const termsContent = getCustomization('terms', 'terms_content', `
    <h2>1. Aceitação dos Termos</h2>
    <p>Ao acessar e usar este serviço, você aceita e concorda em estar vinculado aos termos e condições deste acordo.</p>
    
    <h2>2. Uso do Serviço</h2>
    <p>Você concorda em usar o serviço apenas para fins legais e de acordo com estes Termos e Condições.</p>
    
    <h2>3. Privacidade</h2>
    <p>Sua privacidade é importante para nós. Coletamos e usamos informações pessoais de acordo com nossa Política de Privacidade.</p>
    
    <h2>4. Propriedade Intelectual</h2>
    <p>Todo o conteúdo incluído no serviço, como texto, gráficos, logotipos, imagens, é propriedade nossa ou de nossos fornecedores de conteúdo.</p>
    
    <h2>5. Alterações nos Termos</h2>
    <p>Reservamos o direito de modificar estes termos a qualquer momento. É sua responsabilidade revisar estes termos periodicamente.</p>
  `);
  
  const siteName = getCustomization('global', 'global_site_name', 'Agroplay');
  
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-green-400">{termsTitle}</h1>
        
        <div 
          className="prose prose-invert prose-green max-w-none space-y-6"
          dangerouslySetInnerHTML={{ __html: termsContent }}
          style={{
            lineHeight: '1.8'
          }}
        />
        
        <div className="mt-12 p-6 bg-gray-900 border border-green-600/30 rounded-lg">
          <p className="text-sm text-gray-400">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Para dúvidas sobre estes termos, entre em contato com {siteName}.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;
