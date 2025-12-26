/**
 * Supported Languages Configuration
 * Defines the languages available for video generation
 */

export interface Language {
  code: string
  name: string
  nativeName?: string
}

/**
 * List of supported languages for video generation
 */
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
]

/**
 * Get language name by code
 * @param code - Language code (e.g., 'en', 'es')
 * @returns Language name or code if not found
 */
export function getLanguageName(code: string): string {
  const language = SUPPORTED_LANGUAGES.find((lang) => lang.code === code)
  return language?.name || code
}

/**
 * Get language native name by code
 * @param code - Language code (e.g., 'en', 'es')
 * @returns Language native name, name, or code if not found
 */
export function getLanguageNativeName(code: string): string {
  const language = SUPPORTED_LANGUAGES.find((lang) => lang.code === code)
  return language?.nativeName || language?.name || code
}

/**
 * Check if a language code is supported
 * @param code - Language code to check
 * @returns True if language is supported
 */
export function isLanguageSupported(code: string): boolean {
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === code)
}
