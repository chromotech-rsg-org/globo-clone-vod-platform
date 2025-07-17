export const formatCpf = (value: string): string => {
  return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatPhone = (value: string): string => {
  return value.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

export const formatBillingCycle = (cycle: string): string => {
  switch (cycle) {
    case 'monthly': return 'Mensal';
    case 'annually': return 'Anual';
    case 'quarterly': return 'Trimestral';
    case 'biannually': return 'Semestral';
    case 'weekly': return 'Semanal';
    default: return cycle;
  }
};