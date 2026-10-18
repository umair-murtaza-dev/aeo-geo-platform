# Provider contracts

Package: `@aeo/ai-providers`.

An adapter has an identity, a capability list, and `execute`. Identity includes `mock: true` only for the in-process fixture `createMockProvider`. Production adapters must set `mock` to false and must not be named as if they were the fixture.

## Surfaces

These are different products. A chat completion is not an AI search result.

| Surface | Meaning | Citations |
| --- | --- | --- |
| `MODEL_API` | A model completion or responses API call without a consumer search product. | Not assumed. |
| `GROUNDED_SEARCH` | A provider API that returns grounded sources with the model output. | Expected when the provider supplies them. |
| `CONSUMER_SEARCH` | An observation of a consumer-facing AI search experience. | Expected when the product shows sources. |

Capabilities declare `supportsLocale`, `supportsMarket`, and `supportsCitations` per surface. Callers must not send a market to an engine that does not support it without the adapter rejecting the request.

## Execution result

`execute` returns status, `executedAt`, `completedAt`, optional response text, a raw response storage reference, citations, token usage, decimal cost strings, a categorized error, and optional rate-limit metadata.

Error categories: `rate_limited`, `authentication`, `invalid_request`, `unavailable`, `timeout`, `content_filtered`, `unknown`. `rate_limited`, `unavailable`, and `timeout` are retryable. Authentication and invalid requests are not.

The M01 mock returns the text `MOCK_PROVIDER_RESPONSE` or `MOCK_PROVIDER_FAILURE` and, for search surfaces, a citation on `example.invalid`. It does not open a network connection. The worker's monitoring processor does not call this adapter. It returns `status: "deferred"` so a queued job is not mistaken for a measured observation.

No production provider client is included in M01.
