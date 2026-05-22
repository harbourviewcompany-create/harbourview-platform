import { randomUUID } from 'node:crypto';
import { getConfiguredProvider, getLlmRuntimeConfig } from './config';
import { callLlmProvider } from './providers';
import { parseLlmGatewayRequest } from './validation';
import { LlmGatewayError, type LlmGatewaySuccess } from './types';

export async function executeLlmGateway(value: unknown): Promise<LlmGatewaySuccess> {
  const config = getLlmRuntimeConfig();
  if (!config.enabled) {
    throw new LlmGatewayError('LLM_GATEWAY_DISABLED', 'The Harbourview LLM gateway is disabled.', 503);
  }

  const request = parseLlmGatewayRequest(value);
  const provider = getConfiguredProvider(config, request.provider);
  if (!provider) {
    throw new LlmGatewayError('LLM_GATEWAY_CONFIG_MISSING', 'Requested LLM provider is not configured.', 503, request.provider);
  }

  const requestId = request.requestId || randomUUID();
  return callLlmProvider(provider, request, config.timeoutMs, requestId);
}
