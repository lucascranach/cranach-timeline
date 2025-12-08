/**
 * Language utilities for bilingual support (German/English)
 */

export type Language = "de" | "en"

export interface LocalizedString {
  de: string
  en: string
}

/**
 * Detect current language from URL path
 * Expected patterns: /de/timeline or /en/timeline
 * Defaults to 'de' if not found
 */
export const getCurrentLanguage = (): Language => {
  const path = window.location.pathname
  const match = path.match(/\/(de|en)\/timeline/)
  return match && (match[1] === "de" || match[1] === "en") ? (match[1] as Language) : "de"
}

/**
 * Get localized value from a bilingual object
 * @param value - Can be a LocalizedString object or a plain string (fallback for old data)
 * @param language - The language to retrieve ('de' or 'en')
 * @returns The localized string, or undefined if not available
 */
export const getLocalizedValue = (
  value: LocalizedString | string | undefined,
  language: Language
): string | undefined => {
  if (!value) return undefined

  // If it's already a string, return it as-is (backward compatibility)
  if (typeof value === "string") return value

  // If it's a LocalizedString object, return the appropriate language
  return value[language]
}
