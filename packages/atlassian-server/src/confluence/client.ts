import { ConfluenceConfig } from '../config.js';
import { buildAuthHeader } from '../utils/auth.js';

export class ConfluenceApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string
  ) {
    super(`Confluence API error ${status} ${statusText}: ${body}`);
    this.name = 'ConfluenceApiError';
  }
}

export class ConfluenceClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfluenceConfig) {
    this.baseUrl = config.baseUrl;
    this.authHeader = buildAuthHeader(config.auth);
    this.timeoutMs = config.requestTimeoutMs;
  }

  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: this.authHeader,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new ConfluenceApiError(response.status, response.statusText, body);
    }

    return (await response.json()) as T;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Atlassian-Token': 'no-check',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      const respBody = await response.text();
      throw new ConfluenceApiError(response.status, response.statusText, respBody);
    }

    return (await response.json()) as T;
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Atlassian-Token': 'no-check',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      const respBody = await response.text();
      throw new ConfluenceApiError(response.status, response.statusText, respBody);
    }

    return (await response.json()) as T;
  }

  async delete(path: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: {
        Authorization: this.authHeader,
        'X-Atlassian-Token': 'no-check',
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new ConfluenceApiError(response.status, response.statusText, body);
    }
  }

  async getRawResponse(
    path: string,
    method: string = 'GET',
    body?: string,
    extraHeaders?: Record<string, string>
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      ...extraHeaders,
    };
    if (method !== 'GET' && body) {
      headers['Content-Type'] = 'application/json';
      headers['X-Atlassian-Token'] = 'no-check';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' && method !== 'DELETE' ? body : undefined,
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      const respBody = await response.text();
      throw new ConfluenceApiError(response.status, response.statusText, respBody);
    }

    return response;
  }
}
