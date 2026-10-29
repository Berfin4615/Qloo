# CommonGround AI

## Elevator pitch
You have more in common than you think. CommonGround AI uses Qloo cultural intelligence to turn two people's favorites into shared discoveries, specific conversation starters, and a 15-minute connection challenge.

## Inspiration
In a new classroom, team, or conference, a meaningful conversation often starts with a small cultural connection. Yet comparing favorites usually stops at identical titles. We wanted to explore what happens between different tastes: a new film, musician, or book that two people might enjoy discovering together.

## What it does
Two participants build temporary profiles in the same browser, selecting real cultural entities without creating accounts. The agent researches each profile separately, compares recommendations, and surfaces common discoveries with visible evidence. Participants can reject a recommendation, add a liked result to the next research pass, explore another category, or ask for a surprise. Results become conversation prompts and a short shared activity.

## How we built it
The app uses Next.js App Router, React, TypeScript, server routes, and an interactive SVG constellation. The backend validates profiles and signed selections, calls Qloo over HTTPS, intersects independent recommendation sets, and ranks candidates by reciprocal result positions with category diversity. Real processing boundaries stream into the UI. Deterministic planning keeps suggestions grounded without requiring an additional LLM service.

## How Qloo powers the experience
Search resolves the exact titles or artists participants select. GET /v2/insights independently explores movies, artists, books, television, and games from each profile's entity IDs. A bridge is a candidate returned in both research sets. This goes beyond matching favorites: two people with no identical inputs can still receive a common new discovery. Qloo's per-result explainability identifies contributing favorites for each participant; the interface shows those separately from the complete research context. Conversation prompts use verified titles, available catalog genres and contributing favorites. Missing contribution metadata falls back to recommendation-list evidence, without inventing relationships or compatibility percentages.

## Challenges we ran into
Separating demonstrated evidence from plausible cultural storytelling was central. We chose conservative intersections and honest empty states. Serverless deployments also require selections to remain verifiable across instances, so search results carry expiring server signatures. Upstream failures receive bounded retries and clear messages instead of silently switching to examples.

## Accomplishments
We implemented an account-free two-person journey, five cultural categories, a connection constellation, transparent evidence, feedback-driven research, accessible responsive layouts, and automated tests around recommendation logic and transport failures.

## What we learned
An explainable cultural agent needs disciplined evidence boundaries. Result overlap supports a shared recommendation, but does not prove friendship, identity, or a specific thematic relationship. Useful planning can begin with verified entity names and clearly stated uncertainty.

## What's next
Validate live discovery quality with consenting pairs, improve recall while maintaining evidence standards, and explore opt-in event and classroom flows. Future invitations and sharing would require explicit consent and careful retention controls.

## Submission readiness — remove only after completing these checks
This draft describes implemented behavior. Local live Qloo search, discovery, favorite-level explanation metadata and rejection were verified on October 29, 2026. Public deployment remains unverified. The offline preview uses explicitly labeled synthetic associations. Before submitting, add verified website and public repository URLs, repeat the discovery smoke test on the deployed site, and record a short demo using live results. Do not submit fixture screenshots as evidence of live Qloo performance.
