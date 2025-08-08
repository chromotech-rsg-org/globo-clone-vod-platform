import DOMPurify from 'dompurify';

/**
 * Enhanced security utilities for input sanitization and XSS prevention
 */

export const securityConfig = {
  // Maximum allowed length for different input types
  maxLengths: {
    name: 100,
    email: 254,
    cpf: 14,
    phone: 15,
    generalText: 1000,
    richText: 10000,
  },
  
  // Rate limiting configurations
  rateLimits: {
    loginAttempts: 5,
    roleChanges: 3,
    passwordResets: 3,
    timeWindow: 3600000, // 1 hour in milliseconds
  },
} as const;

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
};

/**
 * Sanitize plain text input with enhanced protection
 */
export const sanitizeInput = (input: string, maxLength?: number): string => {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:(?!image\/[a-z]+;base64,)/gi, '') // Remove data: URIs except images
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/style\s*=/gi, '') // Remove inline styles
    .replace(/expression\s*\(/gi, '') // Remove CSS expressions
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/livescript:/gi, '') // Remove livescript: protocol
    .replace(/mocha:/gi, '') // Remove mocha: protocol
    .replace(/\x00/g, '') // Remove null bytes
    .trim();

  // Apply length limit if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

/**
 * Enhanced email validation with additional security checks
 */
export const validateEmailSecurity = (email: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!email || typeof email !== 'string') {
    errors.push('Email é obrigatório');
    return { isValid: false, errors };
  }

  const sanitizedEmail = sanitizeInput(email, securityConfig.maxLengths.email);
  
  // Basic format validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(sanitizedEmail)) {
    errors.push('Formato de email inválido');
  }

  // Check for suspicious patterns
  if (sanitizedEmail.includes('..') || sanitizedEmail.startsWith('.') || sanitizedEmail.endsWith('.')) {
    errors.push('Email contém padrões suspeitos');
  }

  // Length validation
  if (sanitizedEmail.length > securityConfig.maxLengths.email) {
    errors.push('Email muito longo');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Enhanced CPF validation with security checks
 */
export const validateCpfSecurity = (cpf: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!cpf) {
    return { isValid: true, errors }; // CPF is optional
  }

  const sanitizedCpf = sanitizeInput(cpf, securityConfig.maxLengths.cpf);
  const cleanCpf = sanitizedCpf.replace(/\D/g, '');

  // Basic format validation
  if (!/^\d{11}$/.test(cleanCpf)) {
    errors.push('CPF deve conter 11 dígitos');
    return { isValid: false, errors };
  }

  // Check for known invalid patterns
  const invalidPatterns = [
    '00000000000', '11111111111', '22222222222', '33333333333',
    '44444444444', '55555555555', '66666666666', '77777777777',
    '88888888888', '99999999999'
  ];

  if (invalidPatterns.includes(cleanCpf)) {
    errors.push('CPF inválido');
    return { isValid: false, errors };
  }

  // Validate CPF algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(9))) {
    errors.push('CPF inválido');
    return { isValid: false, errors };
  }

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(10))) {
    errors.push('CPF inválido');
    return { isValid: false, errors };
  }

  return { isValid: true, errors };
};

/**
 * Enhanced phone validation with security checks
 */
export const validatePhoneSecurity = (phone: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!phone) {
    return { isValid: true, errors }; // Phone is optional
  }

  const sanitizedPhone = sanitizeInput(phone, securityConfig.maxLengths.phone);
  const cleanPhone = sanitizedPhone.replace(/\D/g, '');

  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    errors.push('Telefone deve ter 10 ou 11 dígitos');
  }

  // Check for suspicious patterns
  if (/^(\d)\1+$/.test(cleanPhone)) {
    errors.push('Telefone contém padrão suspeito');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Enhanced password validation with additional security checks
 */
export const validatePasswordSecurity = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Senha é obrigatória');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }

  if (password.length > 128) {
    errors.push('Senha muito longa (máximo 128 caracteres)');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }

  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }

  // Check for common weak patterns
  const weakPatterns = [
    /(.)\1{3,}/, // Repeated characters
    /123456|654321|password|qwerty/i, // Common sequences
    /^[a-zA-Z]+$/, // Only letters
    /^\d+$/, // Only numbers
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      errors.push('Senha contém padrões fracos');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Rate limiting utility for client-side protection
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; timestamp: number }> = new Map();

  isAllowed(key: string, maxAttempts: number, timeWindow: number): boolean {
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry) {
      this.attempts.set(key, { count: 1, timestamp: now });
      return true;
    }

    // Reset if time window has passed
    if (now - entry.timestamp > timeWindow) {
      this.attempts.set(key, { count: 1, timestamp: now });
      return true;
    }

    // Check if limit exceeded
    if (entry.count >= maxAttempts) {
      return false;
    }

    // Increment count
    entry.count++;
    return true;
  }

  getRemainingTime(key: string, timeWindow: number): number {
    const entry = this.attempts.get(key);
    if (!entry) return 0;

    const now = Date.now();
    const elapsed = now - entry.timestamp;
    return Math.max(0, timeWindow - elapsed);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();

/**
 * Content Security Policy helpers
 */
export const cspNonce = (): string => {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
};

/**
 * Escape special characters for safe display
 */
export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};