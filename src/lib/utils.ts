import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export const BUILDER_BACKEND = import.meta.env.VITE_BACKEND_URL ?? 
(import.meta.env.VITE_ENV === 'test' ? 'http://localhost:3050' : "https://vmi1968527.contaboserver.net/backend");
