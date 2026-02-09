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
  HEALTH_FITNESS: "Health & Fitness",
  SOCIAL_COMMUNITY: "Social & Community",
  BUSINESS_STARTUPS: "Business & Startups",
  TECH_AI: "Tech & AI",
  CREATIVE_ARTS: "Creative & Arts",
  OUTDOOR_ADVENTURE: "Outdoor & Adventure",
  GOVERNANCE_POLICY: "Governance & Policy",
  CONFERENCE_SUMMIT: "Conference & Summit",
  OTHER: "Other",
} as const

export type EventCategory = (typeof EVENT_CATEGORY)[keyof typeof EVENT_CATEGORY]
export const EVENT_CATEGORIES: EventCategory[] = Object.values(EVENT_CATEGORY)

export const EVENT_CATEGORY_ICONS: Record<EventCategory, string> = {
  "Education & Learning": "📚",
  "Health & Fitness": "💪",
  "Social & Community": "❤️",
  "Business & Startups": "🚀",
  "Tech & AI": "🤖",
  "Creative & Arts": "🎨",
  "Outdoor & Adventure": "🌿",
  "Governance & Policy": "🏛️",
  "Conference & Summit": "🎤",
  Other: "🤷🏾‍♂️",
}

export const EVENT_CATEGORY_COLORS: Record<EventCategory, string> = {
  "Education & Learning": "#3b82f6",
  "Health & Fitness": "#22c55e",
  "Social & Community": "#ec4899",
  "Business & Startups": "#f97316",
  "Tech & AI": "#8b5cf6",
  "Creative & Arts": "#d946ef",
  "Outdoor & Adventure": "#84cc16",
  "Governance & Policy": "#eab308",
  "Conference & Summit": "#10b981",
  Other: "#6b7280",
}

export const MEMBER_SKILL_CATEGORIES = [
  "Crypto & Web3",
  "Software Engineering",
  "Business & Entrepreneurship",
  "Data & AI",
  "Finance & Trading",
  "Marketing & Growth",
  "Design & Creative",
  "Operations",
  "Content Creation",
  "Research & Academia",
  "Unknown",
] as const

export type MemberSkillCategory = (typeof MEMBER_SKILL_CATEGORIES)[number]

export const MEMBER_SKILL_CATEGORY_COLORS: Record<MemberSkillCategory, string> =
  {
    "Crypto & Web3": "#8b5cf6",
    "Software Engineering": "#3b82f6",
    "Business & Entrepreneurship": "#f97316",
    "Data & AI": "#06b6d4",
    "Finance & Trading": "#eab308",
    "Marketing & Growth": "#ec4899",
    "Design & Creative": "#d946ef",
    Operations: "#64748b",
    "Content Creation": "#f43f5e",
    "Research & Academia": "#14b8a6",
    Unknown: "#6b7280",
  }

export const MEMBER_INTEREST_CATEGORIES = [
  "Technology",
  "Finance & Investing",
  "Health & Fitness",
  "Arts & Music",
  "Reading & Learning",
  "Philosophy & Mindfulness",
  "Networking & Community",
  "Travel & Culture",
  "Sports",
  "Social Impact",
  "Unknown",
] as const

export type MemberInterestCategory = (typeof MEMBER_INTEREST_CATEGORIES)[number]

export const MEMBER_INTEREST_CATEGORY_COLORS: Record<
  MemberInterestCategory,
  string
> = {
  Technology: "#3b82f6",
  "Finance & Investing": "#eab308",
  "Health & Fitness": "#22c55e",
  "Arts & Music": "#d946ef",
  "Reading & Learning": "#06b6d4",
  "Philosophy & Mindfulness": "#a855f7",
  "Networking & Community": "#ec4899",
  "Travel & Culture": "#f97316",
  Sports: "#ef4444",
  "Social Impact": "#14b8a6",
  Unknown: "#6b7280",
}

export const RANKED_ITEM_COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#06b6d4",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#d946ef",
  "#14b8a6",
] as const

export function getCategoryColor(
  colorMap: Record<string, string>,
  category: string,
): string {
  if (colorMap[category]) return colorMap[category]
  let hash = 0
  for (const ch of category) {
    hash = ch.charCodeAt(0) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 55%)`
}

export const LUMA_CALENDAR_API_ID = "cal-4dWxlBFjW9Cd6ou"
export const LUMA_API_BASE = "https://api2.luma.com"

export const SETTINGS_KEYS = {
  LUMA_LAST_FETCHED_DATE: "luma_last_fetched_date",
  EVENT_STATS_CACHE: "event_stats_cache",
} as const

// AI processing config shared by scripts and workers
export const AI_MODEL = "claude-haiku-4-5-20251001"
export const AI_MAX_TOKENS = 4096
export const AI_BATCH_DELAY_MS = 500
export const AI_RETRY_DELAY_MS = 2000
export const AI_CONTENT_SLICE_LIMIT = 500
export const AI_DESCRIPTION_SLICE_LIMIT = 200
export const AI_CLASSIFY_BATCH_SIZE = 10
export const AI_CATEGORIZE_BATCH_SIZE = 15

export const AI_DISCUSSION_SNIPPET_CONTEXT_SIZE = 10
export const AI_DISCUSSION_SNIPPETS_PER_BATCH = 10
export const AI_DISCUSSION_SEED_MIN_REACTION_SCORE = 3
export const AI_DISCUSSION_SEED_MIN_CONTENT_LENGTH = 20

export const AI_DISCUSSION_SEED_KEYWORDS = [
  "idea",
  "build",
  "built",
  "app",
  "project",
  "suggest",
  "tool",
  "product",
  "ship",
  "launch",
  "prototype",
  "created",
  "making",
  "what if",
  "we could",
  "we should",
  "would be cool",
] as const

export const AI_DISCUSSION_SEED_NOISE_PATTERNS = ["Started a thread"] as const

export const AI_DISCUSSION_EXTRACT_PROMPT = `You analyze conversation snippets from a Discord community discussion channel.

For each conversation snippet, determine if it contains a genuine idea/suggestion or an app/project that was built or proposed. Extract only real ideas and apps — skip general chat, logistics, and greetings.

Return JSON with:
{
  "ideas": [{ "name": "short title", "description": "one sentence", "engagement": N }],
  "apps": [{ "name": "app/project name", "description": "one sentence", "engagement": N }]
}

Set engagement based on the seed message's reaction count plus how enthusiastic/numerous the replies are. If a snippet contains no genuine idea or app, return empty arrays. Return ONLY valid JSON, no markdown or explanation.`

export const AI_DISCUSSION_CONSOLIDATE_PROMPT = `You are consolidating extracted ideas and apps from a Discord community discussion channel.

You will receive a list of ideas and apps extracted from multiple conversation snippets. Your job is to:
1. Consolidate duplicates — the same concept may appear multiple times worded differently
2. Sum engagement scores for duplicates
3. Rank by combined frequency of mentions + engagement score
4. Return the top 10 ideas and top 10 apps

Return JSON with:
{
  "ideas": [{ "name": "short title", "description": "one sentence summary", "score": N }],
  "apps": [{ "name": "app/project name", "description": "one sentence summary", "score": N }]
}

Return ONLY valid JSON, no markdown or explanation.`

export const AI_RECEPTION_CLASSIFY_PROMPT = `You classify Discord messages from a community reception channel.

For each message, return a JSON object keyed by index with:
- "type": "intro" if the person is introducing themselves, otherwise "skip"
- "skills": comma-separated skills/expertise they mention, or "-"
- "interests": comma-separated interests/hobbies they mention, or "-"

Return ONLY valid JSON, no markdown or explanation.`

export const AI_EVENT_CATEGORIZE_PROMPT = `You are an event categorizer for a community dashboard. Categorize each event into exactly one of these categories:

${EVENT_CATEGORIES.map((c) => `- ${c}`).join("\n")}

For each event, return a JSON object mapping event IDs to a single category string.
Pick the single most relevant category for each event.
Only use categories from the list above.
If unsure, use "Other".
Return ONLY valid JSON, no markdown or explanation.`
