# CommonGround AI

**Less time searching for common ground. More time connecting.**

A two-person cultural discovery app for the Qloo Agentic Hackathon. Next.js App Router, React, TypeScript, Lucide, responsive custom CSS, and an SVG connection constellation. No account, database, or LLM key required.

## Run

Node 20.9+ required (Node 20.20 tested).

```sh
npm ci
cp .env.example .env.local
# Set QLOO_API_KEY in .env.local to enable real Qloo requests
npm run dev
```

Visit http://localhost:3000. Without a key, a conspicuous offline preview uses synthetic associations. These are neither Qloo records nor verified cultural relationships. With a key, errors NEVER silently fall back to fixtures. Authenticated live search, five-category discovery, browser rendering and rejection were verified locally on October 29, 2026.

Select at least three search results for each person, confirm both participants agree, and discover. Demo profiles resolve exact names at runtime and fail explicitly if ambiguous. Search selections include a server HMAC signature expiring after 30 minutes, so IDs and names cannot be substituted. No API key is sent to the browser.

## Agent and architecture

1. **Understand**: validate bounded profile inputs, unique selections, and signed entity IDs.
2. **Research**: query Qloo separately for each profile across five categories. At most ten Insights calls per discovery; two run concurrently for each category.
3. **Discover**: intersect independent result sets by entity ID. Single-sided recommendations never become bridges. Existing favorites are excluded from novel recommendations. Explicitly shared favorites provide a clearly identified fallback.
4. **Evaluate**: application rank = round(100 × (1/(rankA+1) + 1/(rankB+1))). Prefer category diversity. No numerical compatibility or invented affinity is shown. Surprise reverses the application ranking and excludes previous results.
5. **Plan**: category-specific questions use verified names, Qloo catalog genres and contributor favorites. Even a single bridge yields three distinct conversation prompts. A category-specific preview activity has an explicit 15-minute schedule. No LLM or claims about shared psychological traits.
6. **Reflect**: reject excludes IDs; more-like-this adds a signed liked entity to both research signals and excludes the old card; category selection restricts research; surprise requests unseen results.

The discovery route streams newline-delimited JSON events at real step boundaries. The UI never uses a timer to simulate completed processing. Evidence identifies independent result ranks and contributing favorites from each result's `query.explainability["signal.interests.entities"]` when available. Aggregate query explanations are not substituted for per-result evidence. Only returned IDs matching that participant's actual research inputs are named, ordered by Qloo's contribution values. No contribution values are presented as compatibility percentages. When metadata is absent, the app falls back to profile-level recommendation evidence.

Browser → Next.js `/api/search`, `/api/discover` → server-only Qloo client. `/api/status` reports configuration mode, not upstream health. Profiles remain in React memory. Search queries and entity result data are cached in bounded server memory for five minutes; names are not logged. Interest IDs go to Qloo with consent. Hosting providers may retain infrastructure request logs; configure those for your deployment.

## Qloo API contract

Base: `https://hackathon.api.qloo.com`, header: `X-Api-Key`.

| Purpose | Endpoint | Parameters |
| --- | --- | --- |
| Select entities | GET /search | query, types=urn:entity:{category}, take=8 |
| Independent research | GET /v2/insights | filter.type=urn:entity:{category}, signal.interests.entities=comma-separated IDs, filter.exclude.entities, feature.explainability=true, take=30 |

Categories: movie, artist, book, tv_show, videogame. Parameters use URLSearchParams. Parser accepts search `results[]` with `types[]` and Insights `results.entities[]` with `type=urn:entity` and `subtype=urn:entity:{category}`. Both authenticated shapes were verified live. Unknown envelopes are rejected. Three attempts with exponential backoff for transport errors, 429, and 5xx; 12-second attempt timeout; actionable auth, invalid-input, empty-result, and partial-category error handling.

Official contract sources reviewed October 29, 2026 (main docs host inaccessible): [Qloo search](https://github.com/qloo/docs-public/blob/main/reference/get-search.md), [Qloo Insights](https://github.com/qloo/docs-public/blob/main/reference/insights-api-deep-dive.md). This is documentation review, not live API verification.

## Verification

```sh
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit tests cover overlap, no overlap, diversity, rejection, surprise, response parsing, signed selections, request limits, auth failure, missing key, retries, and timeouts with mocked transport. Browser tests cover the offline demo, evidence, feedback, validation, and 390px mobile overflow. Browser tests expect no API key; run live smoke tests separately. Screenshots are written under docs/.

## Deploy to Vercel

1. Create a public GitHub repository, push this folder (exclude .env.local), and retain the root MIT LICENSE.
2. In Vercel choose **Add New → Project**, import that repository, framework Next.js. Root directory `.`; build `npm run build`.
3. Set secret `QLOO_API_KEY` for Production and Preview. Do not prefix with NEXT_PUBLIC_. Redeploy after adding it.
4. Set the function maximum duration to at least 180 seconds on a compatible plan (the route exports maxDuration=180).
5. Visit the deployed public URL in a signed-out browser. Check live-mode banner, movie/music search, both profiles, research, evidence, rejection, more-like-this and category changes. Confirm no secret in browser network responses.
6. Test invalid key, no-overlap and throttling behavior in a separate preview deployment. Restore the valid key.
7. Add the verified public deployment and repository URLs to Devpost. See [submission draft](docs/DEVPOST.md).

Alternatively, local authenticated GitHub CLI: `gh repo create commonground-ai --public --source=. --remote=origin --push` after creating an initial Git commit. Use Vercel's dashboard import for deployment. No deployment or repository URL has been claimed or verified in this build.

## Limitations / before submission

- Configure your own Qloo credentials for live use. Local live verification passed; deployment credentials and public URL verification remain outstanding. Offline examples demonstrate UI behavior only.
- Current rate limiting and cache are process-local. For a larger public audience, use Vercel Firewall rate limiting or a shared store; forwarded IPs require a trusted hosting proxy.
- Server signatures remain valid for 30 minutes; expired profiles need reselection.
- Sparse overlaps show honest empty states instead of fabricated recommendations. At most 30 candidates per person/category are compared.
- More-like-this effects depend on upstream results; offline fixtures only exercise exclusion, not actual taste modeling.
- No LLM is needed; planning is deterministic and visible. No invitations, persistent history or public sharing.
- A ten-query research pass may exceed short serverless time limits during upstream retries. Partial category failures are disclosed.
- Fonts load from Google Fonts with system fallbacks. All navigation and user flows work without the font request.

MIT licensed. See LICENSE.
