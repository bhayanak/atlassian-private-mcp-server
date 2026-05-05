export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}\n... [Truncated — full length: ${text.length} chars]`;
}

export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString().split("T")[0]!;
  } catch {
    return dateStr;
  }
}

export function formatJiraIssue(issue: Record<string, unknown>, baseUrl: string): string {
  const fields = issue.fields as Record<string, unknown> | undefined;
  if (!fields) return JSON.stringify(issue, null, 2);

  const key = issue.key as string;
  const summary = fields.summary as string;
  const status = (fields.status as Record<string, unknown>)?.name as string ?? "Unknown";
  const statusCategory = ((fields.status as Record<string, unknown>)?.statusCategory as Record<string, unknown>)?.name as string ?? "";
  const priority = (fields.priority as Record<string, unknown>)?.name as string ?? "None";
  const issueType = (fields.issuetype as Record<string, unknown>)?.name as string ?? "Unknown";
  const assignee = fields.assignee as Record<string, unknown> | null;
  const reporter = fields.reporter as Record<string, unknown> | null;
  const project = fields.project as Record<string, unknown> | undefined;
  const description = fields.description as string | null;
  const labels = fields.labels as string[] | undefined;
  const components = fields.components as Record<string, unknown>[] | undefined;
  const fixVersions = fields.fixVersions as Record<string, unknown>[] | undefined;
  const created = fields.created as string | undefined;
  const updated = fields.updated as string | undefined;

  let output = `Issue: ${key} — "${summary}"\n`;
  output += `Status: ${status}${statusCategory ? ` (${statusCategory})` : ""}  |  Priority: ${priority}  |  Type: ${issueType}\n`;
  output += `Assignee: ${assignee ? `${assignee.displayName} (${assignee.name})` : "Unassigned"}  |  Reporter: ${reporter ? `${reporter.displayName} (${reporter.name})` : "Unknown"}\n`;
  if (project) {
    output += `Project: ${project.name} (${project.key})\n`;
  }
  if (created || updated) {
    output += `Created: ${created ? formatDate(created) : "?"}  |  Updated: ${updated ? formatDate(updated) : "?"}\n`;
  }
  output += `URL: ${baseUrl}/browse/${key}\n`;

  if (description) {
    output += `\nDescription:\n  ${truncate(description, 2000)}\n`;
  }

  if (labels && labels.length > 0) {
    output += `\nLabels: ${labels.join(", ")}\n`;
  }
  if (components && components.length > 0) {
    output += `Components: ${components.map((c) => c.name).join(", ")}\n`;
  }
  if (fixVersions && fixVersions.length > 0) {
    output += `Fix Versions: ${fixVersions.map((v) => v.name).join(", ")}\n`;
  }

  return output;
}

export function formatJiraSearchResults(
  data: Record<string, unknown>,
  baseUrl: string
): string {
  const total = data.total as number;
  const startAt = data.startAt as number;
  const maxResults = data.maxResults as number;
  const issues = data.issues as Record<string, unknown>[];

  const page = Math.floor(startAt / maxResults) + 1;
  const totalPages = Math.ceil(total / maxResults);
  const end = Math.min(startAt + issues.length, total);

  let output = `Total: ${total} issues (showing ${startAt + 1}–${end})\n\n`;

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i]!;
    const fields = issue.fields as Record<string, unknown>;
    const key = issue.key as string;
    const summary = fields.summary as string;
    const status = (fields.status as Record<string, unknown>)?.name as string ?? "?";
    const assignee = fields.assignee as Record<string, unknown> | null;
    const priority = (fields.priority as Record<string, unknown>)?.name as string ?? "?";
    const updated = fields.updated as string | undefined;

    output += `[${startAt + i + 1}] ${key} — ${summary}\n`;
    output += `    Status: ${status} | Assignee: ${assignee ? assignee.name : "Unassigned"} | Priority: ${priority}${updated ? ` | Updated: ${formatDate(updated)}` : ""}\n\n`;
  }

  if (totalPages > 1) {
    output += `--- Page ${page} of ${totalPages}. Use startAt=${startAt + maxResults} to get next page. ---\n`;
  }

  return output;
}

export function formatConfluencePage(
  page: Record<string, unknown>,
  baseUrl: string
): string {
  const id = page.id as string;
  const title = page.title as string;
  const space = page.space as Record<string, unknown> | undefined;
  const version = page.version as Record<string, unknown> | undefined;
  const ancestors = page.ancestors as Record<string, unknown>[] | undefined;
  const body = page.body as Record<string, unknown> | undefined;
  const links = page._links as Record<string, unknown> | undefined;

  let output = `Page: "${title}" (ID: ${id})\n`;
  if (space) {
    output += `Space: ${space.key} (${space.name})\n`;
  }
  if (links?.webui) {
    output += `URL: ${baseUrl}${links.webui}\n`;
  }
  if (version) {
    const by = version.by as Record<string, unknown> | undefined;
    output += `Version: ${version.number}  |  Last Modified: ${version.when ? formatDate(version.when as string) : "?"}${by ? ` by ${by.displayName}` : ""}\n`;
  }
  if (ancestors && ancestors.length > 0) {
    output += `Ancestors: ${ancestors.map((a) => a.title).join(" → ")}\n`;
  }

  if (body) {
    const storage = body.storage as Record<string, unknown> | undefined;
    const view = body.view as Record<string, unknown> | undefined;
    const content = (storage?.value ?? view?.value ?? "") as string;
    if (content) {
      output += `\n--- Content ---\n${truncate(content, 5000)}\n`;
    }
  }

  return output;
}

export function formatConfluenceSearchResults(
  data: Record<string, unknown>,
  baseUrl: string
): string {
  const results = data.results as Record<string, unknown>[];
  const totalSize = data.totalSize as number ?? data.size as number ?? results.length;
  const start = data.start as number ?? 0;
  const limit = data.limit as number ?? 25;

  const page = Math.floor(start / limit) + 1;
  const totalPages = Math.ceil(totalSize / limit);

  let output = `Total: ${totalSize} results (showing ${start + 1}–${start + results.length})\n\n`;

  for (let i = 0; i < results.length; i++) {
    const item = results[i]!;
    const id = item.id as string;
    const title = item.title as string;
    const type = item.type as string;
    const space = item.space as Record<string, unknown> | undefined;
    const version = item.version as Record<string, unknown> | undefined;
    const links = item._links as Record<string, unknown> | undefined;

    output += `[${start + i + 1}] ${title} (ID: ${id}, Type: ${type})\n`;
    output += `    Space: ${space ? space.key : "?"}${version ? ` | Version: ${version.number}` : ""}`;
    if (links?.webui) {
      output += ` | URL: ${baseUrl}${links.webui}`;
    }
    output += "\n\n";
  }

  if (totalPages > 1) {
    output += `--- Page ${page} of ${totalPages}. Use startAt=${start + limit} to get next page. ---\n`;
  }

  return output;
}
