import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Google API Key management utilities
export const getGoogleApiKey = (): string | null => {
  return localStorage.getItem('googleApiKey')
}

export const setGoogleApiKey = (apiKey: string): void => {
  localStorage.setItem('googleApiKey', apiKey.trim())
}

export const removeGoogleApiKey = (): void => {
  localStorage.removeItem('googleApiKey')
}

export const hasGoogleApiKey = (): boolean => {
  const apiKey = getGoogleApiKey()
  return Boolean(apiKey && apiKey.trim().length > 0)
}
