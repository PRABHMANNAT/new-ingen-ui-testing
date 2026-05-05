# Talent Search Dashboard

## PM artifact LLM fallback

The `/pm` Dashboard calls providers only from the server route `app/api/pm/chat/route.ts`. No API keys are sent to the client bundle.

Fallback order:

1. `OPENAI_API_KEY_PRIMARY`
2. `GROQ_API_KEY_1`
3. `GROQ_API_KEY_2`
4. `GROQ_API_KEY_3`
5. `OPENAI_API_KEY_SECONDARY`

If `OPENAI_API_KEY_PRIMARY` is not set, the provider layer also accepts the legacy `OPENAI_API_KEY` variable as the primary OpenAI key.

Default models:

1. OpenAI: `OPENAI_MODEL`, default `gpt-4o`
2. Groq: `GROQ_MODEL`, default `llama-3.3-70b-versatile`

To add more keys, add a new environment variable and append another provider in `buildProviders()` in `lib/llm/providers.ts`. Keep provider calls server-side and never log key values.

## PM artifacts

Each `/pm` assistant response is normalized to an `ArtifactEnvelope` from `lib/llm/schema.ts`. The right pane renders the latest artifact with version history, JSON export, PNG export, and per-block drill-down prompts.
