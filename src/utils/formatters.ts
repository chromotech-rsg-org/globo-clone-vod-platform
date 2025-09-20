export const formatCpf = (value: string): string => {
  return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatPhone = (value: string): string => {
  return value.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

export const formatBillingCycle = (cycle: string): string => {
  switch (cycle) {
    case 'monthly': return 'Mês';
    case 'annually': 
    case 'annual': 
    case 'yearly': return 'Ano';
    case 'quarterly': return 'Trimestral';
    case 'biannually': return 'Semestral';
    case 'weekly': return 'Semanal';
    default: return cycle;
  }
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    });
  } catch (error) {
    return dateString;
  }
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  } catch (error) {
    return dateString;
  }
};

export const formatDateTimeForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    // Convert to local time string expected by datetime-local input (no timezone)
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  } catch (error) {
    return '';
  }
};