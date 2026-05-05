import { AuthConfig } from '../config.js';

export function buildBasicAuthHeader(username: string, password: string): string {
  const encoded = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${encoded}`;
}

export function buildBearerAuthHeader(token: string): string {
  return `Bearer ${token}`;
}

export function buildAuthHeader(config: AuthConfig): string {
  if (config.type === 'pat') {
    if (!config.pat) {
      throw new Error('PAT token is required for PAT authentication');
    }
    return buildBearerAuthHeader(config.pat);
  }

  if (!config.username || !config.password) {
    throw new Error('Username and password are required for Basic authentication');
  }
  return buildBasicAuthHeader(config.username, config.password);
}
