import 'server-only';

import type { NotionBlock, NotionRichText } from './types';

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export type NotionReadResult =
  | { ok: true; rawText: string; sections: Record<string, string> }
  | { ok: false; status: 'missing_env' | 'error'; message: string };

function requireNotionApiKey() {
  const apiKey = process.env.NOTION_API_KEY?.trim();
  if (!apiKey) return null;
  return apiKey;
}

function normalizePageId(pageId: string) {
  return pageId.trim().replace(/-/g, '');
}

function notionHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_VERSION,
  };
}

function richTextToPlainText(richText: NotionRichText[] | undefined): string {
  if (!Array.isArray(richText)) return '';
  return richText
    .map((entry) => entry.plain_text || entry.text?.content || '')
    .join('')
    .trimEnd();
}

function extractBlockText(block: NotionBlock): string {
  const payload =
    block.paragraph ||
    block.heading_1 ||
    block.heading_2 ||
    block.heading_3 ||
    block.bulleted_list_item ||
    block.numbered_list_item ||
    block.to_do ||
    block.quote ||
    block.callout;

  return richTextToPlainText(payload?.rich_text);
}

function sectionNameFromHeading(text: string) {
  return text.replace(/^#+\s*/, '').trim().toUpperCase();
}

function parseBlocks(blocks: NotionBlock[]) {
  const lines: string[] = [];
  const sections: Record<string, string> = {};
  let currentSection = 'PREAMBLE';
  let sectionLines: string[] = [];

  function flushSection() {
    const content = sectionLines.join('\n').trim();
    if (content) sections[currentSection] = content;
    sectionLines = [];
  }

  for (const block of blocks) {
    const text = extractBlockText(block);
    if (!text) continue;

    if (block.type === 'heading_1' || block.type === 'heading_2') {
      flushSection();
      currentSection = sectionNameFromHeading(text);
      sectionLines.push(text);
      lines.push(text);
      continue;
    }

    sectionLines.push(text);
    lines.push(text);
  }

  flushSection();

  return {
    rawText: lines.join('\n'),
    sections,
  };
}

async function fetchPageBlocks(pageId: string, apiKey: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | null = null;

  do {
    const params = new URLSearchParams({ page_size: '100' });
    if (cursor) params.set('start_cursor', cursor);

    const response = await fetch(`${NOTION_API_BASE}/blocks/${normalizePageId(pageId)}/children?${params.toString()}`, {
      headers: notionHeaders(apiKey),
      cache: 'no-store',
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof body?.message === 'string' ? body.message : `Notion read failed with ${response.status}`;
      throw new Error(message);
    }

    if (Array.isArray(body.results)) blocks.push(...(body.results as NotionBlock[]));
    cursor = typeof body.next_cursor === 'string' ? body.next_cursor : null;
  } while (cursor);

  return blocks;
}

export async function readNotionPageFromEnv(envName: string): Promise<NotionReadResult> {
  const apiKey = requireNotionApiKey();
  const pageId = process.env[envName]?.trim();

  if (!apiKey || !pageId) {
    return {
      ok: false,
      status: 'missing_env',
      message: `Missing required Notion hub configuration for ${envName}`,
    };
  }

  try {
    return { ok: true, ...parseBlocks(await fetchPageBlocks(pageId, apiKey)) };
  } catch (error) {
    return {
      ok: false,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown Notion read error',
    };
  }
}
