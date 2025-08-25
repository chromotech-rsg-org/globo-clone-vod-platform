
import React from 'react';
import { useCustomizations } from '@/hooks/useCustomizations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
  const { getCustomization } = useCustomizations('terms');
  
  const title = getCustomization('terms_title', 'Termos e Condições');
  const content = getCustomization('terms_content', `
    <h2>1. Termos Gerais</h2>
    <p>Estes termos e condições regem o uso da nossa plataforma...</p>
    
    <h2>2. Uso da Plataforma</h2>
    <p>Ao utilizar nossos serviços, você concorda em...</p>
    
    <h2>3. Pagamentos e Assinaturas</h2>
    <p>Todos os pagamentos são processados de forma segura...</p>
    
    <h2>4. Política de Privacidade</h2>
    <p>Seus dados são protegidos de acordo com nossa política...</p>
    
    <h2>5. Cancelamentos</h2>
    <p>Você pode cancelar sua assinatura a qualquer momento...</p>
    
    <h2>6. Contato</h2>
    <p>Para dúvidas ou suporte, entre em contato conosco...</p>
  `);
  
  const lastUpdated = getCustomization('terms_last_updated', new Date().toLocaleDateString('pt-BR'));

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Última atualização: {lastUpdated}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div 
              dangerouslySetInnerHTML={{ __html: content }}
              className="space-y-4 text-foreground [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mt-6 [&>h2]:mb-3 [&>p]:mb-4"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
