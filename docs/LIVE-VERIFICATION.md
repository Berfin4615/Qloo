# Live Qloo verification — October 29, 2026

The API key was read server-side from .env.local and was not printed or committed.

## Root cause and fix

Search responses use `types: ["urn:entity:movie"]`. Insights responses use `type: "urn:entity"` together with `subtype: "urn:entity:movie"`. The old parser interpreted the parent type as the category, silently discarded every Insights entity and showed an empty-state result. The parser now prioritizes `subtype`. A regression test covers this exact response structure. Research errors affecting all categories now report failure instead of implying no cultural overlap.

## Live checks

Fixed demo inputs: Interstellar, Radiohead, Dune (Dune, #1) versus Spider-Man: Into the Spider-Verse, Daft Punk, The Hobbit. All selected by exact Qloo search results at runtime. Zero shared input IDs.

| Category | Profile A candidates | Profile B candidates | Novel common results |
| --- | ---: | ---: | ---: |
| Movies | 30 | 30 | 0 |
| Artists | 30 | 30 | 1 |
| Books | 30 | 30 | 5 |
| TV shows | 30 | 30 | 10 |
| Video games | 30 | 30 | 0 |

Five selected bridges: Electric Dreams, Norse Mythology, M83, Humans, The Man Who Fell to Earth. Recommendations depend on Qloo's live data and may change.

Live rejection excluded the selected ID from both subsequent research sets. Browser verification showed five result cards, opened source evidence, applied rejection, and passed the 390px mobile overflow check. Screenshot: live-results.png.

## Reproduce

```sh
node --env-file=.env.local --import tsx tests/live-smoke.ts
# With the live local server running on port 3000:
node --import tsx tests/live-browser.ts
```

Offline browser regression tests use a separate server on port 3100 with QLOO_API_KEY explicitly blank so local live configuration cannot change their behavior.

Public deployment is outside the scope of these local checks and remains unverified.
