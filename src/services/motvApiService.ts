import { supabase } from '@/integrations/supabase/client';

/**
 * Interfaces para tipos de retorno da API MOTV
 */
export interface AuthResult {
  success: boolean;
  viewersId?: number;
  email?: string;
  name?: string;
  message?: string;
  error?: number;
}

export interface SearchResult {
  success: boolean;
  customers?: Array<{
    viewers_id: number;
    email?: string;
    login?: string;
    name?: string;
  }>;
  message?: string;
}

export interface CustomerData {
  success: boolean;
  viewersId?: number;
  email?: string;
  name?: string;
  cpf?: string;
  phone?: string;
  message?: string;
}

export interface CreateUserData {
  name: string;
  login: string;
  password: string;
  email: string;
  cpf?: string;
  phone?: string;
}

export interface UpdateData {
  password?: string;
  email?: string;
  profileName?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
}

export interface CreateResult {
  success: boolean;
  viewersId?: number;
  message?: string;
  error?: number;
}

export interface UpdateResult {
  success: boolean;
  message?: string;
  error?: number;
}

export interface PlanHistoryResult {
  success: boolean;
  plans?: Array<{
    products_id: number;
    package_code: string;
    status: string;
    start_date: string;
    end_date?: string;
  }>;
  message?: string;
}

export interface PlanListResult {
  success: boolean;
  plans?: Array<{
    products_id: number;
    name: string;
    available: boolean;
  }>;
  message?: string;
}

export interface PlanCreateResult {
  success: boolean;
  message?: string;
  error?: number;
}

export interface CancelResult {
  success: boolean;
  message?: string;
}

export interface SubscriptionInfo {
  success: boolean;
  data?: any;
  message?: string;
}

/**
 * Serviço centralizado para todas as operações MOTV
 * Garante chamadas consistentes e tratamento de erros padronizado
 */
export class MotvApiService {
  // Helper para extrair viewers_id de respostas variadas
  private static extractViewersId(result: any): number | undefined {
    if (!result) return undefined;
    const r = result;
    const d = r.data || r;
    const candidates = [
      d?.viewers_id,
      d?.viewer_id,
      d?.viewersId,
      d?.user?.viewers_id,
      d?.customer?.viewers_id,
      r?.response
    ];
    for (const val of candidates) {
      const n = typeof val === 'string' ? parseInt(val, 10) : val;
      if (typeof n === 'number' && !isNaN(n)) return n;
    }
    return undefined;
  }

  /**
   * Autenticar usuário no portal
   */
  static async customerAuthenticate(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'customerAuthenticate',
          payload: {
            login: email,
            password: password
          }
        }
      });

      if (error) {
        console.error('[MotvApiService] customerAuthenticate error:', error);
        return { success: false, message: 'Erro ao autenticar no portal' };
      }

      const result = data?.result;
      const status = result?.status || result?.code;

      if (status === 1 && result) {
        let viewersId = MotvApiService.extractViewersId(result);

        // Se não veio o viewers_id, tentar localizar via busca por email/login
        if (!viewersId) {
          const search = await this.customerSearch(email);
          if (search.success) {
            const emailLower = email.toLowerCase();
            const found = search.customers?.find(c =>
              c.email?.toLowerCase() === emailLower || c.login?.toLowerCase() === emailLower
            );
            if (found?.viewers_id) viewersId = found.viewers_id;
          }
        }

        return {
          success: true,
          viewersId,
          email: result?.data?.email,
          name: result?.data?.name
        };
      }

      return {
        success: false,
        message: result?.message || 'Credenciais inválidas',
        error: status
      };
    } catch (error: any) {
      console.error('[MotvApiService] customerAuthenticate exception:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Buscar clientes por termo de busca (wildcard)
   */
  static async customerSearch(searchTerm: string): Promise<SearchResult> {
    try {
      const { data, error } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'customerSearch',
          payload: {
            search: {
              wild_search: searchTerm
            }
          }
        }
      });

      if (error) {
        console.error('[MotvApiService] customerSearch error:', error);
        return { success: false, message: 'Erro ao buscar clientes' };
      }

      const result = data?.result;
      const status = result?.status || result?.code;

      if (status === 1 && result?.data) {
        return {
          success: true,
          customers: Array.isArray(result.data) ? result.data : [result.data]
        };
      }

      return { success: false, message: result?.message || 'Nenhum cliente encontrado' };
    } catch (error: any) {
      console.error('[MotvApiService] customerSearch exception:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Buscar dados de um cliente específico por viewers_id
   */
  static async customerFind(viewersId: number): Promise<CustomerData> {
    try {
      const { data, error } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'customerFind',
          payload: {
            viewers_id: viewersId
          }
        }
      });

      if (error) {
        console.error('[MotvApiService] customerFind error:', error);
        return { success: false, message: 'Erro ao buscar cliente' };
      }

      const result = data?.result;
      const status = result?.status || result?.code;

      if (status === 1 && result?.data) {
        return {
          success: true,
          viewersId: result.data.viewers_id,
          email: result.data.email,
          name: result.data.name,
          cpf: result.data.cpf,
          phone: result.data.phone
        };
      }

      return { success: false, message: result?.message || 'Cliente não encontrado' };
    } catch (error: any) {
      console.error('[MotvApiService] customerFind exception:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Criar novo cliente no MOTV
   */
  static async customerCreate(userData: CreateUserData): Promise<CreateResult> {
    try {
      const payload = {
        name: userData.name,
        login: userData.login,
        password: userData.password,
        email: userData.email,
        cpf: userData.cpf && userData.cpf.trim().length > 0 ? userData.cpf.replace(/\D/g, '') : '',
        phone: userData.phone && userData.phone.trim().length > 0 ? userData.phone.replace(/\D/g, '') : ''
      };

      const { data, error } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'createCustomer',
          payload
        }
      });

      if (error) {
        console.error('[MotvApiService] customerCreate error:', error);
        return { success: false, message: 'Erro ao criar cliente' };
      }

      const result = data?.result;
      
      // Tratar resposta string como erro
      if (typeof result === 'string') {
        return { success: false, message: result };
      }

      const status = result?.status;
      
      // Status 1 = sucesso
      if (status === 1) {
        let viewersId = MotvApiService.extractViewersId(result);
        if (!viewersId) {
          // Buscar por email/login para obter viewers_id
          const search = await this.customerSearch(userData.email);
          if (search.success) {
            const emailLower = userData.email.toLowerCase();
            const found = search.customers?.find(c =>
              c.email?.toLowerCase() === emailLower || c.login?.toLowerCase() === emailLower
            );
            if (found?.viewers_id) viewersId = found.viewers_id;
          }
        }
        return {
          success: true,
          viewersId,
          message: 'Cliente criado com sucesso'
        };
      }

      // Qualquer outro status ou se tiver error/code é erro
      const errorCode = result?.error || result?.code || (status !== 1 ? status : null);
      if (errorCode) {
        // Mapear códigos de erro conhecidos
        switch(errorCode) {
          case 104:
            return { success: false, error: 104, message: 'Usuário já existe no portal' };
          case 105:
            return { success: false, error: 105, message: 'CPF inválido' };
          case 106:
            return { success: false, error: 106, message: 'Email já está em uso' };
          default:
            return { 
              success: false, 
              error: errorCode,
              message: result?.message || 'Erro desconhecido ao criar usuário' 
            };
        }
      }

      return { success: false, message: result?.message || 'Erro ao criar cliente' };
    } catch (error: any) {
      console.error('[MotvApiService] customerCreate exception:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Atualizar dados do cliente no MOTV
   */
  static async customerUpdate(viewersId: number, updates: UpdateData): Promise<UpdateResult> {
    try {
      const payload: any = { viewers_id: viewersId };
      
      if (updates.password) payload.password = updates.password;
      if (updates.email) payload.email = updates.email;
      if (updates.profileName) payload.profileName = updates.profileName;
      if (updates.firstname) payload.firstname = updates.firstname;
      if (updates.lastname) payload.lastname = updates.lastname;
      if (updates.phone) payload.phone = updates.phone.replace(/\D/g, '');

      const { data, error } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'updateCustomer',
          payload
        }
      });

      if (error) {
        console.error('[MotvApiService] customerUpdate error:', error);
        return { success: false, message: 'Erro ao atualizar cliente' };
      }

      const result = data?.result;
      const status = result?.status || result?.code;

      if (status === 1) {
        return { success: true, message: 'Cliente atualizado com sucesso' };
      }

      return { 
        success: false, 
        message: result?.message || 'Erro ao atualizar cliente',
        error: status 
      };
    } catch (error: any) {
      console.error('[MotvApiService] customerUpdate exception:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Buscar histórico de planos do cliente
   */
  static async planHistory(viewersId: number): Promise<PlanHistoryResult> {
    try {
      const { data, error } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'planHistory',
          payload: {
            viewers_id: viewersId
          }
        }
      });

      if (error) {
        console.error('[MotvApiService] planHistory error:', error);
        return { success: false, message: 'Erro ao buscar histórico de planos' };
      }

      const result = data?.result;
      const status = result?.status || result?.code;

      if (status === 1) {
        return {
          success: true,
          plans: result?.data?.plans || []
        };
      }

      return { success: false, message: result?.message || 'Erro ao buscar planos' };
    } catch (error: any) {
      console.error('[MotvApiService] planHistory exception:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Listar planos disponíveis para o cliente
   */
  static async planList(viewersId: number): Promise<PlanListResult> {
    try {
      const { data, error } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'planList',
          payload: {
            viewers_id: viewersId
          }
        }
      });

      if (error) {
        console.error('[MotvApiService] planList error:', error);
        return { success: false, message: 'Erro ao listar planos' };
      }

      const result = data?.result;
      const status = result?.status || result?.code;

      if (status === 1) {
        return {
          success: true,
          plans: result?.data?.plans || []
        };
      }

      return { success: false, message: result?.message || 'Erro ao listar planos' };
    } catch (error: any) {
      console.error('[MotvApiService] planList exception:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Criar/atribuir plano ao cliente
   */
  static async planCreate(viewersId: number, productsId: number): Promise<PlanCreateResult> {
    try {
      const { data, error } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'subscribe',
          payload: {
            viewers_id: viewersId,
            products_id: productsId
          }
        }
      });

      if (error) {
        console.error('[MotvApiService] planCreate error:', error);
        return { success: false, message: 'Erro ao criar plano' };
      }

      const result = data?.result;
      const status = result?.status || result?.code;

      if (status === 1) {
        return { success: true, message: 'Plano atribuído com sucesso' };
      }

      return { 
        success: false, 
        message: result?.message || 'Erro ao atribuir plano',
        error: status 
      };
    } catch (error: any) {
      console.error('[MotvApiService] planCreate exception:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Cancelar todos os planos do cliente
   */
  static async planCancelAll(viewersId: number): Promise<CancelResult> {
    try {
      const { data, error } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'cancelAll',
          viewers_id: viewersId
        }
      });

      if (error) {
        console.error('[MotvApiService] planCancelAll error:', error);
        return { success: false, message: 'Erro ao cancelar planos' };
      }

      const result = data?.result;
      const status = result?.status || result?.code;

      // Status 1 = sucesso, Status 6 = nenhum plano ativo
      if (status === 1 || status === 6) {
        return { 
          success: true, 
          message: status === 6 ? 'Nenhum plano ativo para cancelar' : 'Planos cancelados com sucesso' 
        };
      }

      return { 
        success: false, 
        message: result?.message || 'Erro ao cancelar planos' 
      };
    } catch (error: any) {
      console.error('[MotvApiService] planCancelAll exception:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Buscar informações de assinatura do cliente
   */
  static async getCustomerSubscriptionInfo(viewersId: number): Promise<SubscriptionInfo> {
    try {
      const { data, error } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'getPlanInfo',
          payload: {
            viewers_id: viewersId
          }
        }
      });

      if (error) {
        console.error('[MotvApiService] getCustomerSubscriptionInfo error:', error);
        return { success: false, message: 'Erro ao buscar informações de assinatura' };
      }

      const result = data?.result;
      const status = result?.status || result?.code;

      if (status === 1) {
        return {
          success: true,
          data: result?.data
        };
      }

      return { success: false, message: result?.message || 'Erro ao buscar assinatura' };
    } catch (error: any) {
      console.error('[MotvApiService] getCustomerSubscriptionInfo exception:', error);
      return { success: false, message: error.message };
    }
  }
}
