// Every outside service is optional. When a key is missing, that part of the
// app falls back to realistic demo data and the UI shows a "Demo data" tag.

export const env = {
  googlePlaces: process.env.GOOGLE_PLACES_API_KEY || "",
  anthropic: process.env.ANTHROPIC_API_KEY || "",
  claudeModel: process.env.CLAUDE_MODEL || "claude-opus-5-5",
  openai: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-5-mini",
  openaiWriterModel: process.env.OPENAI_WRITER_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini",
  perplexity: process.env.PERPLEXITY_API_KEY || "",
  perplexityModel: process.env.PERPLEXITY_MODEL || "sonar",
  gemini: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  stripe: process.env.STRIPE_SECRET_KEY || "",
  stripePriceKit: process.env.STRIPE_PRICE_KIT || "",
  stripePriceMonthly: process.env.STRIPE_PRICE_AUTOPILOT_MONTHLY || "",
  stripePriceYearly: process.env.STRIPE_PRICE_AUTOPILOT_YEARLY || "",
  dataforseoLogin: process.env.DATAFORSEO_LOGIN || "",
  dataforseoPassword: process.env.DATAFORSEO_PASSWORD || "",
  predicthq: process.env.PREDICTHQ_TOKEN || "",
  resend: process.env.RESEND_API_KEY || "",
  resendAudience: process.env.RESEND_AUDIENCE_ID || "",
  emailFrom: process.env.EMAIL_FROM || "Opening Day <hello@example.com>",
  cronSecret: process.env.CRON_SECRET || "",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  freeChecksPerDay: Number(process.env.FREE_CHECKS_PER_DAY || 5),
};

export const has = {
  places: () => !!env.googlePlaces,
  anthropic: () => !!env.anthropic,
  openai: () => !!env.openai,
  perplexity: () => !!env.perplexity,
  gemini: () => !!env.gemini,
  anyAI: () => !!(env.anthropic || env.openai || env.perplexity || env.gemini),
  webSearch: () => !!(env.anthropic || env.perplexity || env.openai),
  stripe: () => !!env.stripe,
  dataforseo: () => !!(env.dataforseoLogin && env.dataforseoPassword),
  predicthq: () => !!env.predicthq,
  resend: () => !!env.resend,
};

export const PRICES = {
  kit: { amount: 129, label: "$129", note: "one time" },
  monthly: { amount: 39, label: "$39", note: "per month" },
  yearly: { amount: 349, label: "$349", note: "per year (save $119)" },
};
