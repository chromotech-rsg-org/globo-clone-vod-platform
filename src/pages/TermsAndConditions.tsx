
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomizations } from '@/hooks/useCustomizations';
import { useSiteCustomizations } from '@/hooks/useSiteCustomizations';

const TermsAndConditions = () => {
  const { getCustomization } = useCustomizations('legal');
  const { siteName } = useSiteCustomizations();
  
  const termsContent = getCustomization('terms', 'terms_content', 
    `Termos e Condições de Uso do ${siteName}

1. ACEITAÇÃO DOS TERMOS
Ao acessar e usar este site, você aceita e concorda em ficar vinculado aos termos e condições de uso aqui estabelecidos.

2. USO DO SITE
Este site destina-se ao uso pessoal e não comercial. Você não pode usar este site para qualquer finalidade ilegal ou não autorizada.

3. PROPRIEDADE INTELECTUAL
Todo o conteúdo incluído neste site, incluindo textos, gráficos, logos, ícones, imagens, clipes de áudio, downloads digitais e software, é propriedade da empresa ou de seus fornecedores de conteúdo.

4. PRIVACIDADE
Sua privacidade é importante para nós. Consulte nossa Política de Privacidade para informações sobre como coletamos, usamos e protegemos suas informações.

5. LIMITAÇÃO DE RESPONSABILIDADE
Em nenhuma circunstância seremos responsáveis por danos diretos, indiretos, incidentais, consequenciais ou punitivos resultantes do seu uso deste site.

6. MODIFICAÇÕES
Reservamo-nos o direito de modificar estes termos a qualquer momento. As modificações entrarão em vigor imediatamente após a publicação no site.

7. CONTATO
Se você tiver dúvidas sobre estes Termos e Condições, entre em contato conosco.

Última atualização: ${new Date().toLocaleDateString('pt-BR')}`
  );

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Termos e Condições de Uso</CardTitle>
            <CardDescription>
              Leia atentamente os termos e condições de uso do {siteName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div 
                className="whitespace-pre-wrap text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: termsContent.replace(/\n/g, '<br />') }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsAndConditions;
