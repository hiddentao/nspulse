/**
 * Time constants for use across client and server code
 */
export const ONE_SECOND = 1000
export const ONE_MINUTE = 60 * ONE_SECOND
export const THIRTY_MINUTES = 30 * ONE_MINUTE
export const ONE_HOUR = 60 * ONE_MINUTE

/**
 * OAuth authentication methods
 */
export const OAUTH_METHOD = {
  GOOGLE: "GOOGLE",
  FACEBOOK: "FACEBOOK",
  GITHUB: "GITHUB",
  X: "X",
  TIKTOK: "TIKTOK",
  LINKEDIN: "LINKEDIN",
} as const

export type OAuthMethod = (typeof OAUTH_METHOD)[keyof typeof OAUTH_METHOD]

/**
 * All authentication method types
 */
export const AUTH_METHOD = {
  EMAIL: "EMAIL",
  ...OAUTH_METHOD,
} as const

export type AuthMethod = (typeof AUTH_METHOD)[keyof typeof AUTH_METHOD]

/**
 * Email verification settings
 */
export const EMAIL_VERIFICATION_CODE_EXPIRY_MS = ONE_HOUR
export const EMAIL_VERIFICATION_CODE_MIN = 100000
export const EMAIL_VERIFICATION_CODE_MAX = 999999

export const EVENT_CATEGORY = {
  EDUCATION_LEARNING: "Education & Learning",
  FITNESS_SPORTS: "Fitness & Sports",
  HEALTH_WELLNESS: "Health & Wellness",
  SOCIAL_COMMUNITY: "Social & Community",
  BUSINESS_STARTUPS: "Business & Startups",
  AI_DATA: "AI & Data",
  TECH_ENGINEERING: "Tech & Engineering",
  CREATIVE_ARTS: "Creative & Arts",
  OUTDOOR_ADVENTURE: "Outdoor & Adventure",
  GOVERNANCE_POLICY: "Governance & Policy",
  CONFERENCE_SUMMIT: "Conference & Summit",
  FOOD_DINING: "Food & Dining",
  OTHER: "Other",
} as const

export type EventCategory = (typeof EVENT_CATEGORY)[keyof typeof EVENT_CATEGORY]
export const EVENT_CATEGORIES: EventCategory[] = Object.values(EVENT_CATEGORY)

export const EVENT_CATEGORY_ICONS: Record<EventCategory, string> = {
  "Education & Learning": "📚",
  "Fitness & Sports": "🏃",
  "Health & Wellness": "🧘",
  "Social & Community": "❤️",
  "Business & Startups": "🚀",
  "AI & Data": "🤖",
  "Tech & Engineering": "⚙️",
  "Creative & Arts": "🎨",
  "Outdoor & Adventure": "🌿",
  "Governance & Policy": "🏛️",
  "Conference & Summit": "🎤",
  "Food & Dining": "🍜",
  Other: "🤷🏾‍♂️",
}

export const EVENT_CATEGORY_COLORS: Record<EventCategory, string> = {
  "Education & Learning": "#3b82f6",
  "Fitness & Sports": "#ef4444",
  "Health & Wellness": "#22c55e",
  "Social & Community": "#ec4899",
  "Business & Startups": "#f97316",
  "AI & Data": "#8b5cf6",
  "Tech & Engineering": "#6366f1",
  "Creative & Arts": "#d946ef",
  "Outdoor & Adventure": "#84cc16",
  "Governance & Policy": "#eab308",
  "Conference & Summit": "#10b981",
  "Food & Dining": "#f43f5e",
  Other: "#6b7280",
}

export const LUMA_CALENDAR_API_ID = "cal-4dWxlBFjW9Cd6ou"
export const LUMA_API_BASE = "https://api2.luma.com"

export const SETTINGS_KEYS = {
  LUMA_LAST_FETCHED_DATE: "luma_last_fetched_date",
  EVENT_STATS_CACHE: "event_stats_cache",
} as const
