import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts ALL CAPS text to Title Case for better readability.
 * Only transforms if text is predominantly uppercase (>70%).
 */
export function toTitleCase(text: string): string {
  if (!text) return text;
  
  // Count uppercase vs total letters
  const upperCount = (text.match(/[A-ZÄÖÜ]/g) || []).length;
  const letterCount = (text.match(/[A-Za-zäöüÄÖÜß]/g) || []).length;
  
  // If not predominantly uppercase, return as-is
  if (letterCount > 0 && upperCount / letterCount < 0.7) {
    return text;
  }
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
