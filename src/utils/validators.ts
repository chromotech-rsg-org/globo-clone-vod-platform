
// Enhanced security validators
export { 
  validatePasswordSecurity as validatePassword,
  validateEmailSecurity,
  validateCpfSecurity,
  validatePhoneSecurity,
  sanitizeInput as sanitizeInputSecure,
  sanitizeHtml,
  globalRateLimiter,
  securityConfig
} from './securityUtils';

export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

// Legacy simple validators for backward compatibility
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.length === 11 && /^\d{11}$/.test(cleanCPF);
};

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};
