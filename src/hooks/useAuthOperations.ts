
import { supabase } from '@/integrations/supabase/client';
import { RegisterData } from '@/types/auth';
import { 
  validateEmailSecurity, 
  validatePasswordSecurity, 
  sanitizeInputSecure, 
  validateCpfSecurity, 
  validatePhoneSecurity,
  globalRateLimiter,
  securityConfig 
} from '@/utils/validators';

export const useAuthOperations = () => {
  const login = async (email: string, password: string) => {
    console.log('Attempting login for:', email);
    
    // Rate limiting for login attempts
    const rateLimitKey = `login-${email}`;
    if (!globalRateLimiter.isAllowed(rateLimitKey, securityConfig.rateLimits.loginAttempts, securityConfig.rateLimits.timeWindow)) {
      const remainingTime = globalRateLimiter.getRemainingTime(rateLimitKey, securityConfig.rateLimits.timeWindow);
      const minutes = Math.ceil(remainingTime / (1000 * 60));
      return { 
        error: { 
          message: `Muitas tentativas de login. Tente novamente em ${minutes} minutos.`,
          code: 'RATE_LIMIT_EXCEEDED'
        }
      };
    }

    // Validate input
    const emailValidation = validateEmailSecurity(email);
    if (!emailValidation.isValid) {
      return { 
        error: { 
          message: emailValidation.errors.join(', '),
          code: 'INVALID_EMAIL'
        }
      };
    }

    const passwordValidation = validatePasswordSecurity(password);
    if (!passwordValidation.isValid) {
      return { 
        error: { 
          message: 'Credenciais inválidas',
          code: 'INVALID_CREDENTIALS'
        }
      };
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizeInputSecure(email, 254),
        password, // Don't sanitize password, let Supabase handle it
      });
      
      console.log('Login result:', error ? 'Error' : 'Success', data?.user?.id);
      
      if (error) {
        console.error('Login error:', error);
        return { error };
      }

      // Reset rate limiter on successful login
      globalRateLimiter.reset(rateLimitKey);

      console.log('Login successful, profile will be loaded by listener');
      return { error: null };
    } catch (error) {
      console.error('Login exception:', error);
      return { error };
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      // Validate all input fields
      const emailValidation = validateEmailSecurity(userData.email);
      if (!emailValidation.isValid) {
        return { 
          error: { 
            message: emailValidation.errors.join(', '),
            code: 'INVALID_EMAIL'
          }
        };
      }

      const passwordValidation = validatePasswordSecurity(userData.password);
      if (!passwordValidation.isValid) {
        return { 
          error: { 
            message: passwordValidation.errors.join(', '),
            code: 'INVALID_PASSWORD'
          }
        };
      }

      // Validate optional fields
      if (userData.cpf) {
        const cpfValidation = validateCpfSecurity(userData.cpf);
        if (!cpfValidation.isValid) {
          return { 
            error: { 
              message: cpfValidation.errors.join(', '),
              code: 'INVALID_CPF'
            }
          };
        }
      }

      if (userData.phone) {
        const phoneValidation = validatePhoneSecurity(userData.phone);
        if (!phoneValidation.isValid) {
          return { 
            error: { 
              message: phoneValidation.errors.join(', '),
              code: 'INVALID_PHONE'
            }
          };
        }
      }

      // Sanitize inputs
      const sanitizedData = {
        email: sanitizeInputSecure(userData.email, 254),
        password: userData.password, // Don't sanitize password
        name: sanitizeInputSecure(userData.name, 100),
        cpf: userData.cpf ? sanitizeInputSecure(userData.cpf, 14) : '',
        phone: userData.phone ? sanitizeInputSecure(userData.phone, 15) : ''
      };

      const { error } = await supabase.auth.signUp({
        email: sanitizedData.email,
        password: sanitizedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: sanitizedData.name,
            cpf: sanitizedData.cpf,
            phone: sanitizedData.phone
          }
        }
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const logout = async () => {
    console.log('Logging out');
    await supabase.auth.signOut();
  };

  return { login, register, logout };
};
