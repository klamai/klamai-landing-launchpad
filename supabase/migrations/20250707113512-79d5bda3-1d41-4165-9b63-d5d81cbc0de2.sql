-- Add missing fields to profiles table for better case data transfer
ALTER TABLE public.profiles 
ADD COLUMN ciudad text,
ADD COLUMN direccion_fiscal text,
ADD COLUMN nombre_gerente text;