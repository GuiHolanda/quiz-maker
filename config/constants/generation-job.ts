// config/constants/generation-job.ts

// Tier 1 OpenAI (gpt-5.4-mini): 200K TPM / 500 RPM / 2M TPD. Used for margin docs only;
// there is no in-process TPM enforcement (serverless invocations don't share memory),
// so concurrency is the effective throttle. Kept at 95% for reference.
export const OPENAI_TPM_LIMIT = 190_000;

// Global cap on topics generating in parallel. 200K TPM / ~12K tokens per topic/min ≈ 16;
// 10 leaves ~30% headroom against 429s. Overridable via env for tuning without deploy.
export const GENERATION_MAX_CONCURRENT_TOPICS = Number(process.env.GENERATION_MAX_CONCURRENT_TOPICS ?? 10);

// Per-user slice of the global cap.
export const GENERATION_MAX_TOPICS_PER_USER = 5;

// Per-job topic cap. Vercel Hobby maxDuration=300s / ~75s per 5-slot round ≈ 4 rounds ≈ 20;
// 15 leaves margin so after()-driven processing finishes before the function is killed.
export const GENERATION_MAX_TOPICS_PER_JOB = 15;

// Above this, requested output exceeds max_output_tokens (16000) and JSON truncates.
export const GENERATION_MAX_QUESTIONS_PER_TOPIC = 50;

// Active jobs (queued + running + awaiting_review) a single user may hold.
export const GENERATION_MAX_ACTIVE_JOBS_PER_USER = 3;

// Max sub-topics included in the generation prompt. Above this the list dilutes focus
// rather than guiding the model; a random sample is used instead.
export const GENERATION_MAX_PROMPT_TOPICS = 20;
