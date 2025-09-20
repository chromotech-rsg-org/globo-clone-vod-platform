import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = "R$ 0,00",
  disabled = false,
  className = ""
}) => {
  const [displayValue, setDisplayValue] = useState('');

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(num);
  };

  const parseCurrency = (str: string): number => {
    // Remove R$, espaços e pontos de separação de milhares, mantém apenas dígitos e vírgula
    const cleanedStr = str.replace(/[R$\s\.]/g, '').replace(',', '.');
    const numericValue = parseFloat(cleanedStr) || 0;
    return numericValue;
  };

  useEffect(() => {
    setDisplayValue(formatCurrency(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove tudo que não for número
    const numbersOnly = inputValue.replace(/\D/g, '');
    
    if (numbersOnly === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }
    
    // Converte para centavos (últimos 2 dígitos são centavos)
    const numericValue = parseInt(numbersOnly) / 100;
    
    // Atualiza o valor formatado
    setDisplayValue(formatCurrency(numericValue));
    onChange(numericValue);
  };

  const handleBlur = () => {
    setDisplayValue(formatCurrency(value));
  };

  return (
    <Input
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
};

export default CurrencyInput;