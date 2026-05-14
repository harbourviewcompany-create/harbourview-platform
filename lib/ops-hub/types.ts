export type HubServiceStatus = 'ready' | 'missing_env' | 'error';

export type HubServiceHealth = {
  status: HubServiceStatus;
  message: string;
};

export type HubIssue = {
  id: string;
  identifier: string;
  title: string;
  status: string;
  priority: number;
  priorityLabel: string;
  url: string;
  updatedAt: string;
};

export type HubSections = {
  activeContext: string;
  currentTask: string;
  confirmedDecisions: string;
  openQuestions: string;
  handoffQueue: string;
};

export type HubSnapshot = {
  generatedAt: string;
  mode: 'read_only';
  services: {
    notionSharedMemory: HubServiceHealth;
    notionStack: HubServiceHealth;
    notionPromptLibrary: HubServiceHealth;
    linear: HubServiceHealth;
  };
  sections: HubSections;
  stack: string;
  promptLibrary: string;
  issues: HubIssue[];
  writeTools: {
    enabled: false;
    reason: string;
  };
};

export type NotionRichText = {
  plain_text?: string;
  text?: { content?: string };
};

export type NotionBlock = {
  id: string;
  type: string;
  paragraph?: { rich_text?: NotionRichText[] };
  heading_1?: { rich_text?: NotionRichText[] };
  heading_2?: { rich_text?: NotionRichText[] };
  heading_3?: { rich_text?: NotionRichText[] };
  bulleted_list_item?: { rich_text?: NotionRichText[] };
  numbered_list_item?: { rich_text?: NotionRichText[] };
  to_do?: { rich_text?: NotionRichText[] };
  quote?: { rich_text?: NotionRichText[] };
  callout?: { rich_text?: NotionRichText[] };
};
