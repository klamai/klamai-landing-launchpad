import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toZonedTime } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const sanitizeFileName = (fileName: string): string => {
  // Extraer la extensión del archivo
  const fileExtension = fileName.split('.').pop() || '';
  // Obtener el nombre del archivo sin la extensión
  const fileNameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));

  // Normalizar para quitar acentos y diacríticos
  const normalizedFileName = fileNameWithoutExtension
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Reemplazar caracteres no alfanuméricos (excepto guiones y puntos) por guiones bajos
  // y eliminar cualquier otro carácter no deseado.
  const sanitizedBaseName = normalizedFileName
    .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
    .replace(/[^a-zA-Z0-9_.-]/g, ''); // Eliminar caracteres no seguros

  // Limitar la longitud del nombre del archivo base para evitar problemas de longitud de ruta
  const truncatedBaseName = sanitizedBaseName.substring(0, 100);

  // Unir el nombre sanitizado con la extensión original
  if (fileExtension) {
    return `${truncatedBaseName}.${fileExtension}`;
  }
  return truncatedBaseName;
};
