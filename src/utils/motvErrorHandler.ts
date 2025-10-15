/**
 * Mapeamento de códigos de erro MOTV para mensagens amigáveis
 */
const MOTV_ERROR_MESSAGES: Record<number, { message: string; action?: string }> = {
  104: {
    message: 'Usuário já existe no MOTV',
    action: 'Tente fazer login ou recuperar sua senha'
  },
  105: {
    message: 'CPF inválido',
    action: 'Verifique o CPF informado e tente novamente'
  },
  106: {
    message: 'Email já está em uso',
    action: 'Use outro email ou recupere sua senha'
  },
  107: {
    message: 'Telefone inválido',
    action: 'Verifique o número de telefone informado'
  },
  108: {
    message: 'Dados incompletos',
    action: 'Preencha todos os campos obrigatórios'
  },
  200: {
    message: 'Credenciais inválidas',
    action: 'Verifique seu email e senha'
  },
  404: {
    message: 'Usuário não encontrado no MOTV',
    action: 'Cadastre-se primeiro'
  },
  500: {
    message: 'Erro interno do servidor MOTV',
    action: 'Tente novamente mais tarde ou contate o suporte'
  }
};

/**
 * Interface para resultado do tratamento de erro
 */
export interface ErrorHandlingResult {
  userMessage: string;
  technicalMessage: string;
  shouldRetry: boolean;
  actionSuggestion?: string;
}

/**
 * Classe para tratamento centralizado de erros MOTV
 */
export class MotvErrorHandler {
  /**
   * Trata erros da API MOTV e retorna mensagens amigáveis
   */
  static handleError(
    error: any,
    operation: string,
    context?: Record<string, any>
  ): ErrorHandlingResult {
    console.error(`[MotvErrorHandler] Error in ${operation}:`, error, context);

    // Se for um erro com código conhecido
    if (typeof error === 'number' || error?.error || error?.code) {
      const errorCode = typeof error === 'number' ? error : (error.error || error.code);
      const errorInfo = MOTV_ERROR_MESSAGES[errorCode];

      if (errorInfo) {
        return {
          userMessage: errorInfo.message,
          technicalMessage: `MOTV Error ${errorCode} in ${operation}`,
          shouldRetry: errorCode >= 500,
          actionSuggestion: errorInfo.action
        };
      }
    }

    // Se for um erro com mensagem
    if (error?.message) {
      return {
        userMessage: `Erro ao ${operation}: ${error.message}`,
        technicalMessage: error.message,
        shouldRetry: false
      };
    }

    // Erro genérico
    return {
      userMessage: `Erro de sincronização com MOTV durante ${operation}. Tente novamente.`,
      technicalMessage: `Unknown error in ${operation}: ${JSON.stringify(error)}`,
      shouldRetry: true,
      actionSuggestion: 'Se o problema persistir, contate o suporte'
    };
  }

  /**
   * Formata mensagem de erro para exibição ao usuário
   */
  static formatUserMessage(result: ErrorHandlingResult): string {
    let message = result.userMessage;
    
    if (result.actionSuggestion) {
      message += `\n\n${result.actionSuggestion}`;
    }

    return message;
  }

  /**
   * Determina se o erro é recuperável
   */
  static isRecoverableError(error: any): boolean {
    const errorCode = typeof error === 'number' ? error : (error?.error || error?.code);
    
    // Erros recuperáveis: duplicatas, dados inválidos, etc
    const recoverableCodes = [104, 105, 106, 107, 108, 200];
    
    return recoverableCodes.includes(errorCode);
  }

  /**
   * Verifica se é erro de usuário já existente
   */
  static isUserExistsError(error: any): boolean {
    const errorCode = typeof error === 'number' ? error : (error?.error || error?.code);
    return errorCode === 104 || errorCode === 106;
  }

  /**
   * Verifica se é erro de autenticação
   */
  static isAuthError(error: any): boolean {
    const errorCode = typeof error === 'number' ? error : (error?.error || error?.code);
    return errorCode === 200 || errorCode === 404;
  }

  /**
   * Loga erro com contexto completo
   */
  static logError(
    operation: string,
    error: any,
    context?: Record<string, any>
  ): void {
    const timestamp = new Date().toISOString();
    const errorCode = typeof error === 'number' ? error : (error?.error || error?.code);
    
    console.error('='.repeat(80));
    console.error(`[MOTV Error Log] ${timestamp}`);
    console.error(`Operation: ${operation}`);
    console.error(`Error Code: ${errorCode}`);
    console.error(`Error Details:`, error);
    
    if (context) {
      console.error('Context:', JSON.stringify(context, null, 2));
    }
    
    console.error('='.repeat(80));
  }
}
