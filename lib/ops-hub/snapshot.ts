import 'server-only';

import type { HubSections, HubServiceHealth, HubSnapshot } from './types';
import { readLinearProjectIssues } from './linearRead';
import { readNotionPageFromEnv, type NotionReadResult } from './notionRead';

const EMPTY_SECTIONS: HubSections = {
  activeContext: '',
  currentTask: '',
  confirmedDecisions: '',
  openQuestions: '',
  handoffQueue: '',
};

function serviceHealth(result: NotionReadResult | Awaited<ReturnType<typeof readLinearProjectIssues>>): HubServiceHealth {
  if (result.ok) return { status: 'ready', message: 'Read-only source loaded' };
  return { status: result.status, message: result.message };
}

function getSection(sections: Record<string, string>, key: string) {
  return sections[key] || sections[key.replace(/ /g, '_')] || '';
}

function mapSharedMemorySections(result: NotionReadResult): HubSections {
  if (!result.ok) return EMPTY_SECTIONS;
  return {
    activeContext: getSection(result.sections, 'ACTIVE CONTEXT'),
    currentTask: getSection(result.sections, 'CURRENT TASK'),
    confirmedDecisions: getSection(result.sections, 'CONFIRMED DECISIONS'),
    openQuestions: getSection(result.sections, 'OPEN QUESTIONS'),
    handoffQueue: getSection(result.sections, 'HANDOFF QUEUE'),
  };
}

export async function getOpsHubSnapshot(): Promise<HubSnapshot> {
  const [sharedMemory, stack, promptLibrary, linear] = await Promise.all([
    readNotionPageFromEnv('NOTION_SHARED_MEMORY_PAGE_ID'),
    readNotionPageFromEnv('NOTION_STACK_PAGE_ID'),
    readNotionPageFromEnv('NOTION_PROMPT_LIBRARY_PAGE_ID'),
    readLinearProjectIssues(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    mode: 'read_only',
    services: {
      notionSharedMemory: serviceHealth(sharedMemory),
      notionStack: serviceHealth(stack),
      notionPromptLibrary: serviceHealth(promptLibrary),
      linear: serviceHealth(linear),
    },
    sections: mapSharedMemorySections(sharedMemory),
    stack: stack.ok ? stack.rawText : '',
    promptLibrary: promptLibrary.ok ? promptLibrary.rawText : '',
    issues: linear.ok ? linear.issues : [],
    writeTools: {
      enabled: false,
      reason: 'Authoritative writes, decision promotion, session logging, and Linear mutation are intentionally disabled in the read-only first PR.',
    },
  };
}
