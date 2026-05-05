import { z } from "zod";
import { JiraClient } from "../../jira/client.js";
import { JiraIssueLinkType } from "../../jira/types.js";

export const getIssueLinkTypesSchema = z.object({}).optional();

export async function getIssueLinkTypes(client: JiraClient): Promise<string> {
  const result = await client.get<{ issueLinkTypes: JiraIssueLinkType[] }>(
    "/rest/api/2/issueLinkType"
  );

  const types = result.issueLinkTypes || [];
  if (types.length === 0) {
    return "No issue link types available.";
  }

  let output = "Available issue link types:\n\n";
  for (const lt of types) {
    output += `• ${lt.name} (ID: ${lt.id})\n`;
    output += `  Inward: "${lt.inward}" | Outward: "${lt.outward}"\n\n`;
  }
  return output;
}
