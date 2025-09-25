import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeTextForStorage(input: string): string {
  if (!input) return ''

  let text = input

  // Remove dangerous/invalid control characters (keep newlines and tabs already normalized later)
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')

  // Normalize Unicode to NFC
  try {
    text = text.normalize('NFC')
  } catch (_) {
    // ignore if environment lacks Intl support
  }

  // Unify line endings to \n
  text = text.replace(/\r\n?/g, '\n')

  // Normalize horizontal whitespace runs (including non-breaking and zero-width) to a single space
  text = text.replace(/[ \t\f\v\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000]+/g, ' ')

  // Trim each line
  text = text
    .split('\n')
    .map((line) => line.trim())
    .join('\n')

  // Collapse 3+ consecutive blank lines to a single blank line
  text = text.replace(/\n{3,}/g, '\n\n')

  // Final overall trim
  text = text.trim()

  return text
}
