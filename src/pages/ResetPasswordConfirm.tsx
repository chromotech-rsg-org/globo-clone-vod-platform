import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useCustomizations } from "@/hooks/useCustomizations";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Lock, Info } from "lucide-react";

export default function ResetPasswordConfirm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getCustomization } = useCustomizations('login');
  
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    // Check if we have the necessary tokens in the URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      toast({
        title: "Link inválido",
        description: "Este link de redefinição de senha é inválido ou expirou.",
        variant: "destructive"
      });
      navigate('/reset-password');
    }
  }, [searchParams, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Senha redefinida com sucesso! Redirecionando..."
        });
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Reset password confirm error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
                Nova Senha
              </h1>
              <p 
                className="text-sm"
                style={{ color: textColor }}
              >
                Digite sua nova senha
              </p>
            </div>
          </div>

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:border-transparent"
                  style={{ backgroundColor: inputBgColor }}
                  placeholder="Nova senha"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:border-transparent"
                  style={{ backgroundColor: inputBgColor }}
                  placeholder="Confirmar nova senha"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 text-white font-semibold rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
              disabled={loading}
            >
              {loading ? 'Atualizando...' : 'Redefinir Senha'}
            </Button>

            <div className="text-center space-y-2">
              <Button
                type="button"
                variant="link"
                className="text-sm transition-colors hover:opacity-75"
                style={{ color: textColor }}
                onClick={() => navigate('/login')}
              >
                Voltar ao Login
              </Button>
              
              <Button
                type="button"
                variant="link"
                className="text-sm transition-colors hover:opacity-75"
                style={{ color: textColor }}
                onClick={() => navigate('/')}
              >
                Voltar à Home
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