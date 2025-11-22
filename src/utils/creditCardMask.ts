export const formatCardNumber = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  const groups = cleanValue.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleanValue;
};

export const formatExpiryDate = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length >= 2) {
    return `${cleanValue.slice(0, 2)}/${cleanValue.slice(2, 4)}`;
  }
  return cleanValue;
};

export const formatCVV = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 4);
};

export const validateCardNumber = (number: string): boolean => {
  const cleanNumber = number.replace(/\D/g, '');
  if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

export const getCardBrand = (number: string): string => {
  const cleanNumber = number.replace(/\D/g, '');
  
  if (/^4/.test(cleanNumber)) return 'Visa';
  if (/^5[1-5]/.test(cleanNumber)) return 'Mastercard';
  if (/^3[47]/.test(cleanNumber)) return 'American Express';
  if (/^6(?:011|5)/.test(cleanNumber)) return 'Discover';
  if (/^35/.test(cleanNumber)) return 'JCB';
  if (/^(?:2131|1800|30[0-5])/.test(cleanNumber)) return 'Diners';
  if (/^50|^60|^63|^67/.test(cleanNumber)) return 'Elo';
  if (/^38|^60/.test(cleanNumber)) return 'Hipercard';
  
  return 'Desconhecido';
};