import 'server-only';

import type { HubIssue } from './types';

const LINEAR_API_URL = 'https://api.linear.app/graphql';

export type LinearReadResult =
  | { ok: true; issues: HubIssue[] }
  | { ok: false; status: 'missing_env' | 'error'; message: string };

function linearHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export async function readLinearProjectIssues(): Promise<LinearReadResult> {
  const apiKey = process.env.LINEAR_API_KEY?.trim();
  const projectId = process.env.LINEAR_PROJECT_ID?.trim();

  if (!apiKey || !projectId) {
    return {
      ok: false,
      status: 'missing_env',
      message: 'Missing required Linear hub configuration',
    };
  }

  const query = `
    query HarbourviewHubProjectIssues($projectId: ID!) {
      project(id: $projectId) {
        issues(first: 50, orderBy: updatedAt) {
          nodes {
            id
            identifier
            title
            priority
            priorityLabel
            url
            updatedAt
            state {
              name
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: linearHeaders(apiKey),
      body: JSON.stringify({ query, variables: { projectId } }),
      cache: 'no-store',
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof body?.message === 'string' ? body.message : `Linear read failed with ${response.status}`;
      throw new Error(message);
    }
    if (Array.isArray(body.errors) && body.errors.length > 0) {
      const firstMessage = typeof body.errors[0]?.message === 'string' ? body.errors[0].message : 'Linear GraphQL returned an error';
      throw new Error(firstMessage);
    }

    const nodes = body?.data?.project?.issues?.nodes;
    const issues: HubIssue[] = Array.isArray(nodes)
      ? nodes.map((node) => ({
          id: String(node.id),
          identifier: String(node.identifier),
          title: String(node.title),
          status: String(node.state?.name || 'Unknown'),
          priority: Number(node.priority || 0),
          priorityLabel: String(node.priorityLabel || 'No priority'),
          url: String(node.url),
          updatedAt: String(node.updatedAt),
        }))
      : [];

    return { ok: true, issues };
  } catch (error) {
    return {
      ok: false,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown Linear read error',
    };
  }
}
