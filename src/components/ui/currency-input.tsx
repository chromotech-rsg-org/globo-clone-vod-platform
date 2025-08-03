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
    const cleanedStr = str.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleanedStr) || 0;
  };

  useEffect(() => {
    setDisplayValue(formatCurrency(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = parseCurrency(inputValue);
    
    setDisplayValue(inputValue);
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