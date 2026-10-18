import type { ObservationSurface } from '@aeo/shared';
import type {
  AIProviderAdapter,
  ProviderCapability,
  ProviderErrorCategory,
  ProviderExecutionResult,
} from './types';

const SURFACES: ObservationSurface[] = ['MODEL_API', 'GROUNDED_SEARCH', 'CONSUMER_SEARCH'];

/**
 * In-process fixture used to test the provider contract.
 * It does not make network calls and its text is explicitly marked as a mock.
 */
export function createMockProvider(options?: { fail?: ProviderErrorCategory }): AIProviderAdapter {
  return {
    identity: {
      id: 'mock',
      displayName: 'Mock provider',
      mock: true,
    },
    async capabilities(): Promise<ProviderCapability[]> {
      return SURFACES.map((surface) => ({
        providerId: 'mock',
        surface,
        engines: [{ id: `mock-${surface.toLowerCase()}`, displayName: `Mock ${surface}`, surface }],
        supportsLocale: true,
        supportsMarket: surface !== 'MODEL_API',
        supportsCitations: surface !== 'MODEL_API',
      }));
    },
    async execute(request): Promise<ProviderExecutionResult> {
      const executedAt = new Date().toISOString();
      if (options?.fail) {
        return {
          providerId: 'mock',
          surface: request.surface,
          engineId: request.engineId,
          status: 'failed',
          executedAt,
          completedAt: executedAt,
          citations: [],
          error: {
            category: options.fail,
            message: 'MOCK_PROVIDER_FAILURE',
            retryable: options.fail === 'rate_limited' || options.fail === 'unavailable',
          },
          rateLimit:
            options.fail === 'rate_limited'
              ? { limit: 1, remaining: 0, resetsAt: executedAt }
              : undefined,
        };
      }
      return {
        providerId: 'mock',
        surface: request.surface,
        engineId: request.engineId,
        status: 'succeeded',
        executedAt,
        completedAt: executedAt,
        responseText: 'MOCK_PROVIDER_RESPONSE',
        citations:
          request.surface === 'MODEL_API'
            ? []
            : [{ url: 'https://example.invalid/mock-source', title: 'Mock source', position: 1 }],
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
        cost: { estimatedAmount: '0.000001', currency: 'USD' },
      };
    },
  };
}
