/**
 * Utilidades para validación de contraseñas seguras
 * Cumple con estándares de seguridad y RGPD
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number; // 0-100
}

/**
 * Valida la fortaleza de una contraseña
 * @param password - Contraseña a validar
 * @returns Resultado de validación con detalles
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  let score = 0;

  // Validaciones básicas
  if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres");
  } else {
    score += 20;
  }

  if (password.length >= 12) {
    score += 10;
  }

  // Validaciones de complejidad
  if (!/[A-Z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una letra mayúscula");
  } else {
    score += 15;
  }

  if (!/[a-z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una letra minúscula");
  } else {
    score += 15;
  }

  if (!/\d/.test(password)) {
    errors.push("La contraseña debe contener al menos un número");
  } else {
    score += 15;
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password)) {
    errors.push("La contraseña debe contener al menos un carácter especial");
  } else {
    score += 15;
  }

  // Validaciones adicionales de seguridad
  if (/(.)\1{2,}/.test(password)) {
    errors.push("La contraseña no debe contener más de 2 caracteres repetidos consecutivos");
    score -= 10;
  }

  if (/123|abc|qwe|asd|zxc/i.test(password)) {
    errors.push("La contraseña no debe contener secuencias comunes");
    score -= 10;
  }

  // Determinar fortaleza
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  if (score < 50) {
    strength = 'weak';
  } else if (score < 70) {
    strength = 'medium';
  } else if (score < 90) {
    strength = 'strong';
  } else {
    strength = 'very-strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.max(0, Math.min(100, score))
  };
};

/**
 * Genera una contraseña segura aleatoria
 * @param length - Longitud de la contraseña (mínimo 8)
 * @returns Contraseña segura generada
 */
export const generateSecurePassword = (length: number = 12): string => {
  const minLength = Math.max(8, length);
  
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*(),.?":{}|<>_-+=';
  
  let password = '';
  
  // Asegurar al menos un carácter de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Completar con caracteres aleatorios
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = password.length; i < minLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar la contraseña
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Obtiene el color CSS para mostrar la fortaleza de la contraseña
 * @param strength - Nivel de fortaleza
 * @returns Clase CSS de color
 */
export const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong' | 'very-strong'): string => {
  switch (strength) {
    case 'weak':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-500';
    case 'strong':
      return 'text-blue-500';
    case 'very-strong':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
};

/**
 * Obtiene el texto descriptivo de la fortaleza
 * @param strength - Nivel de fortaleza
 * @returns Texto descriptivo
 */
export const getPasswordStrengthText = (strength: 'weak' | 'medium' | 'strong' | 'very-strong'): string => {
  switch (strength) {
    case 'weak':
      return 'Débil';
    case 'medium':
      return 'Media';
    case 'strong':
      return 'Fuerte';
    case 'very-strong':
      return 'Muy Fuerte';
    default:
      return 'Desconocida';
  }
}; 