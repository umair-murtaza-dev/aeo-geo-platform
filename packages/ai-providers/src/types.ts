import type { ObservationSurface } from '@aeo/shared';

export type ProviderErrorCategory =
  | 'rate_limited'
  | 'authentication'
  | 'invalid_request'
  | 'unavailable'
  | 'timeout'
  | 'content_filtered'
  | 'unknown';

export interface ProviderIdentity {
  id: string;
  displayName: string;
  /** True only for in-process contract fixtures. Production adapters must set this to false. */
  mock: boolean;
}

export interface EngineDescriptor {
  id: string;
  displayName: string;
  surface: ObservationSurface;
}

export interface ProviderCapability {
  providerId: string;
  surface: ObservationSurface;
  engines: EngineDescriptor[];
  supportsLocale: boolean;
  supportsMarket: boolean;
  supportsCitations: boolean;
}

export interface ExecutionRequest {
  prompt: string;
  promptVersionId: string;
  surface: ObservationSurface;
  engineId: string;
  locale?: string;
  market?: string;
  idempotencyKey: string;
}

export interface CitationMetadata {
  url: string;
  title?: string;
  domain?: string;
  position?: number;
}

export interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

/** Decimal strings avoid floating-point financial values. */
export interface CostMetadata {
  estimatedAmount?: string;
  actualAmount?: string;
  currency?: string;
}

export interface RateLimitMetadata {
  limit?: number;
  remaining?: number;
  resetsAt?: string;
}

export interface ProviderExecutionResult {
  providerId: string;
  surface: ObservationSurface;
  engineId: string;
  status: 'succeeded' | 'failed';
  executedAt: string;
  completedAt: string;
  responseText?: string;
  rawResponseRef?: string;
  citations: CitationMetadata[];
  usage?: TokenUsage;
  cost?: CostMetadata;
  error?: { category: ProviderErrorCategory; message: string; retryable: boolean };
  rateLimit?: RateLimitMetadata;
}

export interface AIProviderAdapter {
  readonly identity: ProviderIdentity;
  capabilities(): Promise<ProviderCapability[]>;
  execute(request: ExecutionRequest): Promise<ProviderExecutionResult>;
}
