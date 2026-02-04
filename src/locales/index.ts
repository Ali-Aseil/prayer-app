import en from "./en.json"
import ar from "./ar.json"

export type Language = "ar" | "en"

export const translations: Record<Language, Record<string, Record<string, string>>> = { en, ar }
