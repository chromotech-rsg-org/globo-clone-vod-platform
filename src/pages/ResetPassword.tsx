import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useCustomizations } from "@/hooks/useCustomizations";
import { supabase } from "@/integrations/supabase/client";
import { getAuthRedirectUrl } from "@/utils/authConfig";
import { Loader2, Lock, Mail, Info } from "lucide-react";

export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { getCustomization } = useCustomizations('login');
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  // Get customizations using the same keys as login page
  const mainLogoImage = getCustomization('branding', 'main_logo_image', '');
  const bottomLogoImage = getCustomization('branding', 'bottom_logo_image', '');
  const logoLink = getCustomization('branding', 'logo_link', '');
  const loginBgImage = getCustomization('background', 'background_image', '/lovable-uploads/3c31e6f6-37f9-475f-b8fe-d62743f4c2e8.png');
  const loginBgColor = getCustomization('background', 'background_color', '#ffffff');
  const logoBackgroundColor = getCustomization('branding', 'logo_background_color', '#4ade80');
  const logoTextColor = getCustomization('branding', 'logo_text_color', '#ffffff');
  const primaryColor = getCustomization('theme', 'primary_color', '#16a34a');
  const textColor = getCustomization('theme', 'text_color', '#374151');
  const inputBgColor = getCustomization('form', 'input_background_color', '#f9fafb');

  const handleLogoClick = () => {
    if (logoLink) {
      window.open(logoLink, '_blank');
    }
  };

  useEffect(() => {
    // Pegar dados do state do navigation
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      toast({
        title: "Erro de validação",
        description: "Digite um e-mail válido",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl('/reset-password/confirm'),
      });
      
      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setSent(true);
        toast({
          title: "E-mail enviado",
          description: "Verifique sua caixa de entrada para redefinir sua senha"
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen grid lg:grid-cols-2">
        {/* Background Image Section */}
        <div 
          className="hidden lg:block relative"
          style={{
            backgroundImage: `url('${loginBgImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Success Message Section */}
        <div 
          className="flex items-center justify-center px-8 py-12"
          style={{ backgroundColor: loginBgColor }}
        >
          <div className="w-full max-w-md space-y-8">
            {/* Logo and Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div 
                  className="px-4 py-2 rounded-lg font-bold text-2xl cursor-pointer flex items-center justify-center"
                  style={{ 
                    backgroundColor: mainLogoImage ? 'transparent' : logoBackgroundColor,
                    color: logoTextColor 
                  }}
                  onClick={handleLogoClick}
                >
                  {mainLogoImage ? (
                    <img src={mainLogoImage} alt="Logo Principal" className="h-12 w-auto" />
                  ) : (
                    'AGRO'
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 
                  className="text-2xl font-semibold"
                  style={{ color: primaryColor }}
                >
                  E-mail enviado!
                </h1>
                <p 
                  className="text-sm"
                  style={{ color: textColor }}
                >
                  Enviamos um link para redefinir sua senha para o e-mail {email}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Verifique sua caixa de entrada e clique no link para redefinir sua senha. 
                  O link expira em 24 horas.
                </AlertDescription>
              </Alert>
              
              <Button
                className="w-full py-3 text-white font-semibold rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
                onClick={() => navigate('/login')}
              >
                Voltar ao Login
              </Button>
            </div>

            {/* Bottom Logo */}
            <div className="text-center pt-8">
              {bottomLogoImage ? (
                <img 
                  src={bottomLogoImage} 
                  alt="Logo Inferior" 
                  className="h-8 mx-auto cursor-pointer" 
                  onClick={handleLogoClick}
                />
              ) : (
                <div onClick={handleLogoClick} className="cursor-pointer">
                  <span 
                    className="font-bold text-lg"
                    style={{ color: primaryColor }}
                  >
                    agro
                  </span>
                  <span 
                    className="font-bold text-lg"
                    style={{ color: textColor }}
                  >
                    mercado
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Background Image Section */}
      <div 
        className="hidden lg:block relative"
        style={{
          backgroundImage: `url('${loginBgImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Reset Form Section */}
      <div 
        className="flex items-center justify-center px-8 py-12"
        style={{ backgroundColor: loginBgColor }}
      >
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div 
                className="px-4 py-2 rounded-lg font-bold text-2xl cursor-pointer flex items-center justify-center"
                style={{ 
                  backgroundColor: mainLogoImage ? 'transparent' : logoBackgroundColor,
                  color: logoTextColor 
                }}
                onClick={handleLogoClick}
              >
                {mainLogoImage ? (
                  <img src={mainLogoImage} alt="Logo Principal" className="h-12 w-auto" />
                ) : (
                  'AGRO'
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 
                className="text-2xl font-semibold"
                style={{ color: primaryColor }}
              >
                Redefinir Senha
              </h1>
              <p 
                className="text-sm"
                style={{ color: textColor }}
              >
                Digite seu e-mail para receber instruções de redefinição de senha
              </p>
            </div>
          </div>

          {/* Alert Message */}
          {message && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:border-transparent"
                style={{ backgroundColor: inputBgColor }}
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 text-white font-semibold rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Link de Redefinição'
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-sm transition-colors hover:opacity-75"
                style={{ color: textColor }}
                onClick={() => navigate('/login')}
              >
                Voltar ao Login
              </Button>
            </div>
          </form>

          {/* Bottom Logo */}
          <div className="text-center pt-8">
            {bottomLogoImage ? (
              <img 
                src={bottomLogoImage} 
                alt="Logo Inferior" 
                className="h-8 mx-auto cursor-pointer" 
                onClick={handleLogoClick}
              />
            ) : (
              <div onClick={handleLogoClick} className="cursor-pointer">
                <span 
                  className="font-bold text-lg"
                  style={{ color: primaryColor }}
                >
                  agro
                </span>
                <span 
                  className="font-bold text-lg"
                  style={{ color: textColor }}
                >
                  mercado
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}