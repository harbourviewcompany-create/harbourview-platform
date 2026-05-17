import 'server-only';

export function getGeminiConnectorConfig() {
  return {
    connectorKey: 'gemini',
    provider: 'google_gemini',
    credentialEnvVar: 'GEMINI_API_KEY',
    authorityLevel: 'proposal_only',
    model: process.env.GEMINI_MODEL?.trim() || 'gemini-3-flash-preview',
    enabled: process.env.GEMINI_CONNECTOR_ENABLED === 'true',
    apiKeyPresent: Boolean(process.env.GEMINI_API_KEY?.trim()),
  };
}

export function getGeminiConnectorStatus() {
  const cfg = getGeminiConnectorConfig();
  return {
    connectorKey: cfg.connectorKey,
    provider: cfg.provider,
    credentialEnvVar: cfg.credentialEnvVar,
    model: cfg.model,
    authorityLevel: cfg.authorityLevel,
    apiKeyPresent: cfg.apiKeyPresent,
    status: cfg.enabled ? (cfg.apiKeyPresent ? 'configured' : 'missing_key') : 'disabled',
  };
}
