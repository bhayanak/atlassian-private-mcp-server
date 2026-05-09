import { JiraConfig } from '../config.js';
import { buildAuthHeader } from '../utils/auth.js';
import { JiraServerInfo } from './types.js';

export class JiraApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string
  ) {
    super(`Jira API error ${status} ${statusText}: ${body}`);
    this.name = 'JiraApiError';
  }
}

export class JiraClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly timeoutMs: number;
  private serverVersion: number[] | null = null;

  constructor(private readonly config: JiraConfig) {
    this.baseUrl = config.baseUrl;
    this.authHeader = buildAuthHeader(config.auth);
    this.timeoutMs = config.requestTimeoutMs;
  }

  async getServerInfo(): Promise<JiraServerInfo> {
    return this.get<JiraServerInfo>('/rest/api/2/serverInfo');
  }

  async getServerVersion(): Promise<number[]> {
    if (this.serverVersion) return this.serverVersion;
    const info = await this.getServerInfo();
    this.serverVersion = info.versionNumbers;
    return this.serverVersion;
  }

  /**
   * Check if the Jira version supports the new createmeta endpoint (8.4+)
   */
  async supportsNewCreateMeta(): Promise<boolean> {
    const version = await this.getServerVersion();
    const major = version[0] ?? 0;
    const minor = version[1] ?? 0;
    return major > 8 || (major === 8 && minor >= 4);
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
      throw new JiraApiError(response.status, response.statusText, body);
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
      throw new JiraApiError(response.status, response.statusText, respBody);
    }

    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
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
      throw new JiraApiError(response.status, response.statusText, respBody);
    }

    // PUT often returns 204 No Content
    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
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
      throw new JiraApiError(response.status, response.statusText, body);
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
    if (method === 'GET') {
      // Don't force Accept: application/json — let server decide
    } else if (body) {
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
      throw new JiraApiError(response.status, response.statusText, respBody);
    }

    return response;
  }
}
