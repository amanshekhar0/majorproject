# System Design Preparation Guide

> How to discuss scaling, performance, and resilience for the AI Interview Platform in SDE interviews (internship → 15+ LPA). Each section gives the framing, the answer, and likely follow-ups.

---

## 0. Baseline (today's design)

- **Client:** React SPA (static, CDN-served), holds all session state in memory.
- **Server:** Stateless Express API — orchestrates LLM (Groq), execution (Judge0), and persistence (MongoDB).
- **No server session state** during an interview → already horizontally scalable.
- **External heavy lifting:** inference and sandboxed execution are someone else's compute.

This baseline is the thing to scale. The whole story is: *"the architecture is already stateless and offloads the heavy work, so scaling is mostly about the API tier, the external-service dependencies, and the data tier."*

---

## 1. How would you scale this to 1,000,000 users?

**Framing first — estimate load.** Say 1M registered, ~5% daily active = 50k interviews/day. Each interview ≈ 10 LLM calls + a few code runs over ~30 min. Peak ≈ 50k/86400 × (peak factor 5) ≈ **~3 interviews/sec starting**, but **concurrent active** matters more: if 30 min each, steady-state concurrency ≈ 50k × (30/1440) ≈ **~1,000 concurrent interviews**. That's modest for the API tier (I/O-bound) but heavy on **LLM tokens** and **Judge0 quota** — those are the real constraints.

**Scaling plan:**

1. **Stateless API behind a load balancer + autoscaling** (k8s/ECS). Because no in-memory session state, just add replicas. Add health-based autoscaling on CPU + event-loop lag.
2. **CDN for the SPA** — static `dist/` is infinitely cacheable; the browser does the session work, so 1M users cost almost nothing on the frontend.
3. **LLM is the bottleneck, not Node.** Mitigate with:
   - **Caching** static/repeatable generations (question sets per difficulty) in Redis.
   - **Request coalescing** and **token budgeting**.
   - **Async evaluation via a queue** (below) so spikes don't stampede the provider.
   - Multiple provider keys / fallback providers (OpenAI-compatible SDK makes this a config swap).
4. **Code execution:** self-host a **Judge0 cluster** (or pool of workers) behind its own queue with concurrency caps, instead of the shared RapidAPI quota.
5. **Database:** MongoDB replica set (1 primary + N secondaries) with **reads routed to secondaries** for analytics; **shard by `userId`** if write volume demands it.
6. **Decouple with a queue (SQS/BullMQ):** the final evaluation and persistence don't need to be synchronous — enqueue them, return a "processing" state, and push the report when ready (WebSocket/poll). This flattens LLM spikes.

```
        CDN (SPA)                         ┌─ Redis (cache, rate, sessions)
            │                             │
   Users ──┼──► LB ──► API replicas ──────┼─► Queue ─► Eval workers ─► Groq
            │           (stateless)       │                 │
            │                             ├─► Judge0 worker pool ◄── Queue
            └──────────────────────────►  └─► MongoDB (primary + secondaries, sharded by userId)
```

- *Follow-up: What's the single biggest cost at 1M?* → LLM tokens. Cache aggressively, use the smallest model that passes quality, and make evaluation async + batched.
- *Follow-up: Where's the state if a server dies mid-interview?* → In the user's browser — so an API replica dying is invisible to active interviews. Only in-flight async eval jobs need a durable queue (which they have).

---

## 2. How would you improve performance?

- **Frontend:** code-split routes (`React.lazy` per page), lazy-load MediaPipe/Monaco (already excluded from pre-bundle), preconnect to API/CDN, memoize chart data, virtualize long chat lists.
- **Network:** HTTP/2, gzip/brotli, CDN edge caching for the SPA, keep-alive to upstreams.
- **API:** connection pooling to Mongo, reuse the OpenAI client, stream LLM responses (`stream:true`) so the interviewer "types" instead of waiting for the full completion.
- **LLM latency:** Groq is already low-latency; streaming + showing partial tokens hides the rest. Cache question generation.
- **Execution:** keep the poll interval tuned (1.5s) and cap attempts; warm Judge0 workers.

- *Follow-up: How would you make the AI feel faster without being faster?* → Stream tokens to the chat panel and start the TTS on first sentence; perceived latency drops sharply.

---

## 3. How would you handle high traffic / spikes?

- **Autoscaling** on the stateless API.
- **Queue + backpressure** for LLM/exec so bursts don't overwhelm rate-limited upstreams; return 202 + async result.
- **Per-route rate limiting** (stricter on `/code/run` and LLM routes) + a global limiter (already present at 100/15min).
- **Circuit breakers** around Groq and Judge0: on repeated failures, trip to the static question bank / `FALLBACK_EVALUATION` so users still get a result.
- **Graceful degradation** is already a design principle here — lean into it under load.

---

## 4. Caching strategy

| Layer | What | TTL / policy |
|-------|------|--------------|
| CDN | SPA assets | immutable, content-hashed filenames |
| Redis | Generated question sets per `(difficulty)` and resume-less random sets | hours; invalidate on prompt change |
| Redis | User performance aggregates | short (e.g. 60s) — recompute lazily |
| In-process | OpenAI client, Judge0 headers | process lifetime |
| Client | Identity, theme | localStorage |

**Cache-aside** for question generation: check Redis → on miss call LLM → store. This cuts the most expensive, most repeatable LLM calls. Don't cache *evaluations* (they're per-session and unique) or *chat* (conversational).

- *Follow-up: Cache invalidation?* → Key generated content by a prompt/version hash; bumping the prompt version naturally invalidates.

---

## 5. Database sharding & replication

- **Replication:** MongoDB replica set for HA + read scaling. Route analytics reads (`/performance`) to secondaries with `readPreference: secondaryPreferred`; keep writes on the primary.
- **Sharding (only if needed):** shard key = `userId` (hashed). All of a user's sessions co-locate, and the access pattern is "this user's recent sessions," so queries are targeted (not scatter-gather). Avoid `completedAt` as a shard key — it'd create a hot shard for "now."
- **Indexes** already match queries (`email`, `userId`, `overallScore`, `completedAt`).
- **Archival:** old sessions → cold storage/TTL if analytics only need recent history.

- *Follow-up: Why `userId` not `email`?* → Sessions reference `userId`; sharding on it keeps the 1-N relationship's reads single-shard.
- *Follow-up: Hot-shard risk?* → A power user is bounded; hashed `userId` spreads load evenly.

---

## 6. How would you secure the application in production?

1. **AuthN/Z:** magic-link or OTP email verification → signed JWT in an HTTP-only, SameSite cookie → middleware guards `/api/user/*` and derives identity from the token (not a query param).
2. **Secrets:** rotate the historically-leaked keys, store in a secrets manager (not `.env` in the image), least-privilege Mongo user.
3. **Headers:** Helmet (CSP, HSTS, X-Frame-Options).
4. **Validation:** Zod schemas on every request body.
5. **Rate limiting:** per-route + per-user, not just per-IP.
6. **Sandboxing:** keep code execution in Judge0; never `eval` server-side.
7. **PII:** webcam/audio stay on-device (already true); store only derived counts. Encrypt at rest; document retention.
8. **Supply chain:** lockfile + `npm audit` in CI; remove unused deps (did this for `@google/generative-ai`).

---

## 7. Reliability / fault tolerance

- **Graceful degradation everywhere:** DB down → interview still works (in-memory); LLM down → static bank + fallback report; Judge0 down → clear terminal error. The product never hard-fails.
- **Idempotency:** persistence upserts users by email and guards double-writes with a ref on the client.
- **Timeouts/retries:** axios timeouts on all upstreams; add exponential backoff + jitter and a circuit breaker.
- **Observability:** structured logs (already per-controller), add request IDs, metrics (RED: rate/errors/duration), and tracing across the API→LLM→Judge0 hops.

---

## 8. Trade-offs made (be ready to defend each)

| Decision | Trade-off | Why it's right for this product |
|----------|-----------|----------------------------------|
| Thick client / in-memory session | No server-side resume of an interrupted session | Instant UX; stateless, cheap, scalable server |
| Context API over Redux | Whole-tree re-renders on change | One cohesive store, small consumer tree → simpler |
| LLM JSON via regex+parse | Less robust than structured output | Provider-agnostic; guarded by fallback; fast to build |
| Email identity, no auth | Spoofable analytics | MVP for a practice tool; clear upgrade path |
| MongoDB Mixed evaluation | No schema validation on the rubric | AI shape evolves; indexes cover queried fields |
| MediaPipe on-device | Defeatable proctoring | Privacy + zero server cost; it's a deterrent, not exam-grade |
| Judge0 via RapidAPI | Third-party quota/latency | Never run untrusted code yourself; self-host later if needed |
| Static fallback question bank | Maintenance of two sources | Guarantees the app works with zero external dependencies |

---

## 9. "Design this from scratch" — how I'd present it in 5 minutes

1. **Requirements:** timed mock interview, mixed question types, live AI interviewer, code execution, proctoring, scored report, history.
2. **Non-functional:** low latency (live feel), resilient to external-service failure, privacy for camera/audio, cost control on LLM.
3. **High-level:** CDN SPA + stateless API + (LLM, sandbox, DB) — draw the box diagram from §1.
4. **Deep dive 1 — LLM orchestration:** prompt design, JSON discipline, temperature per task, caching, async evaluation queue.
5. **Deep dive 2 — code execution:** submit/poll, base64, sandbox isolation, worker pool + queue at scale.
6. **Data model:** User 1-N Session, index/shard rationale.
7. **Scale & failure:** autoscale stateless tier, queue for spikes, circuit-break to fallbacks, replicate/shard DB.
8. **Security:** auth path, secrets, validation, on-device media.

---

## 10. Rapid-fire system-design Qs

- *How to resume an interrupted interview?* Periodically checkpoint the session snapshot to the server (or IndexedDB); on reconnect, rehydrate context from the last checkpoint.
- *How to support 60+ languages?* Already trivial — Judge0 supports them; expand `LANGUAGE_ID_MAP` and editor language list.
- *How to prevent prompt injection from resumes/chat?* Treat resume text and user messages as untrusted data, not instructions; keep the system prompt authoritative, strip/escape, and validate the structured output rather than trusting free text.
- *How to A/B test prompts?* Version prompts, route a % of traffic, log outcome scores, compare.
- *How to add real-time multiplayer (peer mock interviews)?* WebSocket/WebRTC signaling server, rooms keyed by session id; the stateless API stays, add a thin realtime tier.
- *How to cut LLM cost 50%?* Cache question generation, use a smaller model for chat vs. evaluation, batch + async, trim context windows (already sending last-10/last-40).
