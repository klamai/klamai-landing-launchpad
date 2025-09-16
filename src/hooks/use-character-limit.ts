import { useState, useCallback, useEffect } from 'react';

interface UseCharacterLimitOptions {
  maxLength: number;
  initialValue?: string;
}

interface UseCharacterLimitReturn {
  value: string;
  characterCount: number;
  handleChange: (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  maxLength: number;
  isAtLimit: boolean;
  remainingCharacters: number;
}

export function useCharacterLimit({
  maxLength,
  initialValue = ''
}: UseCharacterLimitOptions): UseCharacterLimitReturn {
  const [value, setValue] = useState(initialValue);

  // Actualizar el valor cuando cambia initialValue (cuando cambia el abogado)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const characterCount = value.length;
  const isAtLimit = characterCount >= maxLength;
  const remainingCharacters = Math.max(0, maxLength - characterCount);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newValue = event.target.value;

    // Solo permitir escribir si no se excede el límite
    if (newValue.length <= maxLength) {
      setValue(newValue);
    }
  }, [maxLength]);

  return {
    value,
    characterCount,
    handleChange,
    maxLength,
    isAtLimit,
    remainingCharacters
  };
}