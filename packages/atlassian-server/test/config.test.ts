import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('Config loading', () => {
  it('throws when JIRA_BASE_URL is not set', () => {
    const env = { ...process.env };
    delete process.env.JIRA_BASE_URL;
    delete process.env.CONFLUENCE_BASE_URL;
    delete process.env.JIRA_PAT;
    delete process.env.CONFLUENCE_PAT;

    expect(() => loadConfig()).toThrow('JIRA_BASE_URL');

    process.env = env;
  });

  it('throws when URL is not HTTPS', () => {
    const env = { ...process.env };
    process.env.JIRA_BASE_URL = 'http://jira.example.com';
    process.env.JIRA_PAT = 'token';
    process.env.CONFLUENCE_BASE_URL = 'https://confluence.example.com';
    process.env.CONFLUENCE_PAT = 'token';

    expect(() => loadConfig()).toThrow('must use HTTPS');

    process.env = env;
  });

  it('loads config successfully with valid env', () => {
    const env = { ...process.env };
    process.env.JIRA_BASE_URL = 'https://jira.example.com/';
    process.env.JIRA_AUTH_TYPE = 'pat';
    process.env.JIRA_PAT = 'my-jira-token';
    process.env.CONFLUENCE_BASE_URL = 'https://confluence.example.com/';
    process.env.CONFLUENCE_AUTH_TYPE = 'basic';
    process.env.CONFLUENCE_USERNAME = 'admin';
    process.env.CONFLUENCE_PASSWORD = 'secret';

    const config = loadConfig();

    expect(config.jira.baseUrl).toBe('https://jira.example.com');
    expect(config.jira.auth.type).toBe('pat');
    expect(config.jira.auth.pat).toBe('my-jira-token');
    expect(config.confluence.baseUrl).toBe('https://confluence.example.com');
    expect(config.confluence.auth.type).toBe('basic');
    expect(config.confluence.auth.username).toBe('admin');

    process.env = env;
  });
});
