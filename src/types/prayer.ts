export type PrayerName = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha"

export interface PrayerTime {
  name: PrayerName
  nameArabic: string
  nameEnglish: string
  time: string
  timestamp: number
}

export interface PrayerTimesData {
  date: string
  hijriDate: string
  hijriDay: string
  hijriMonth: string
  hijriYear: string
  city: string
  country: string
  latitude: number
  longitude: number
  timezone: string
  method: string
  prayers: PrayerTime[]
  // Additional timings from AlAdhan
  imsak?: string
  sunset?: string
  midnight?: string
  firstThird?: string
  lastThird?: string
}

export interface Location {
  latitude: number
  longitude: number
  city?: string
  country?: string
}

export interface QiblaDirection {
  direction: number
  distance: number
}

/**
 * AlAdhan API Calculation Method IDs
 * Full list from https://api.aladhan.com/v1/methods
 */
export type CalculationMethodId =
  | 0  // Jafari / Shia Ithna-Ashari, Leva Institute, Qum
  | 1  // University of Islamic Sciences, Karachi
  | 2  // Islamic Society of North America (ISNA)
  | 3  // Muslim World League (MWL)
  | 4  // Umm Al-Qura University, Makkah
  | 5  // Egyptian General Authority of Survey
  | 7  // Institute of Geophysics, University of Tehran
  | 8  // Gulf Region
  | 9  // Kuwait
  | 10 // Qatar
  | 11 // Majlis Ugama Islam Singapura, Singapore
  | 12 // Union Organization Islamic de France
  | 13 // Diyanet Isleri Baskanligi, Turkey
  | 14 // Spiritual Administration of Muslims of Russia
  | 15 // Moonsighting Committee Worldwide
  | 16 // Dubai (experimental)
  | 17 // Jabatan Kemajuan Islam Malaysia (JAKIM)
  | 18 // Tunisia
  | 19 // Algeria
  | 20 // Kementerian Agama Republik Indonesia
  | 21 // Morocco
  | 22 // Comunidade Islamica de Lisboa (Portugal)
  | 23 // Ministry of Awqaf, Jordan
  | 99 // Custom

/**
 * Asr juristic school
 * 0 = Shafi (standard) - shadow equals object length
 * 1 = Hanafi - shadow equals twice object length
 */
export type AsrSchool = 0 | 1

/**
 * Higher latitude adjustment methods
 */
export type LatitudeAdjustmentMethod =
  | "MIDDLE_OF_THE_NIGHT"
  | "ONE_SEVENTH"
  | "ANGLE_BASED"

export interface CalculationMethodInfo {
  id: CalculationMethodId
  name: string
  label: string
  region: string
}

export const CALCULATION_METHODS: CalculationMethodInfo[] = [
  { id: 3, name: "MWL", label: "Muslim World League", region: "Europe, Far East, parts of US" },
  { id: 2, name: "ISNA", label: "Islamic Society of North America", region: "North America" },
  { id: 5, name: "EGYPT", label: "Egyptian General Authority of Survey", region: "Africa, Syria, Lebanon" },
  { id: 4, name: "MAKKAH", label: "Umm Al-Qura University, Makkah", region: "Arabian Peninsula" },
  { id: 1, name: "KARACHI", label: "University of Islamic Sciences, Karachi", region: "Pakistan, Bangladesh, India" },
  { id: 7, name: "TEHRAN", label: "Institute of Geophysics, Tehran", region: "Iran" },
  { id: 0, name: "JAFARI", label: "Shia Ithna-Ashari, Leva Institute, Qum", region: "Shia communities" },
  { id: 8, name: "GULF", label: "Gulf Region", region: "UAE, Oman" },
  { id: 9, name: "KUWAIT", label: "Kuwait", region: "Kuwait" },
  { id: 10, name: "QATAR", label: "Qatar", region: "Qatar" },
  { id: 11, name: "SINGAPORE", label: "Majlis Ugama Islam Singapura", region: "Singapore" },
  { id: 12, name: "FRANCE", label: "Union Organization Islamic de France", region: "France" },
  { id: 13, name: "TURKEY", label: "Diyanet Isleri Baskanligi", region: "Turkey" },
  { id: 14, name: "RUSSIA", label: "Spiritual Administration of Muslims of Russia", region: "Russia" },
  { id: 15, name: "MOONSIGHTING", label: "Moonsighting Committee Worldwide", region: "Worldwide" },
  { id: 16, name: "DUBAI", label: "Dubai (experimental)", region: "Dubai" },
  { id: 17, name: "JAKIM", label: "Jabatan Kemajuan Islam Malaysia", region: "Malaysia" },
  { id: 18, name: "TUNISIA", label: "Tunisia", region: "Tunisia" },
  { id: 19, name: "ALGERIA", label: "Algeria", region: "Algeria" },
  { id: 20, name: "KEMENAG", label: "Kementerian Agama Republik Indonesia", region: "Indonesia" },
  { id: 21, name: "MOROCCO", label: "Morocco", region: "Morocco" },
  { id: 22, name: "PORTUGAL", label: "Comunidade Islamica de Lisboa", region: "Portugal" },
  { id: 23, name: "JORDAN", label: "Ministry of Awqaf, Jordan", region: "Jordan" },
]

export interface UserPreferences {
  calculationMethod: CalculationMethodId
  school: AsrSchool
  language: "ar" | "en"
  theme: "light" | "dark" | "system"
  location: Location | null
  tune?: string // Comma-separated minute offsets: Imsak,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Sunset,Isha,Midnight
}

export const PRAYER_NAMES: Record<PrayerName, { arabic: string; english: string }> = {
  fajr: { arabic: "الفجر", english: "Fajr" },
  sunrise: { arabic: "الشروق", english: "Sunrise" },
  dhuhr: { arabic: "الظهر", english: "Dhuhr" },
  asr: { arabic: "العصر", english: "Asr" },
  maghrib: { arabic: "المغرب", english: "Maghrib" },
  isha: { arabic: "العشاء", english: "Isha" },
}
