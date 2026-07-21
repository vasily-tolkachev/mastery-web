export type GeneratorStageType = 'FIRST_SCENE' | 'QUEST_DESCRIPTION' | 'QUEST_CONSTRAINTS' | 'ACHIEVEMENT_RESOURCE_ANALYSIS' | 'MYSTERY' | 'WORLD' | 'ACHIEVEMENT_REALISATION' | 'ACHIEVEMENT_INFORMATION_FLOW' | 'KNOWLEDGE_CHAIN' | 'ACHIEVEMENT_SCENES' | 'ACTION_QUESTS' | 'NPC' | 'FACTS' | 'QUEST_OUTLINE' | 'CHAPTERS' | 'SCENES' | 'QUEST_GRAPH';

export type GeneratorStageStatus = 'NOT_STARTED' | 'READY' | 'GENERATING' | 'REVIEW' | 'APPROVED';

export type StageRevision = {
  revisionNumber: number;
  outputJson: unknown;
  createdAt: string;
};

export type GeneratorStage = {
  type: GeneratorStageType;
  displayName?: string;
  status: GeneratorStageStatus;
  approved: boolean;
  currentRevision: StageRevision | null;
};

export type GeneratorProject = {
  id: string;
  name: string;
  questStyle: string;
  status: string;
  stages: GeneratorStage[];
  nodeWorkspace?: NodeWorkspace | null;
};

export type NodeWorkspace = {
  nodes: WorkspaceNode[];
  globalKnowledge: string[];
  expansionSuggestions: string[];
  nextNodeIndex: number;
  nextActionIndex: number;
};

export type WorkspaceNode = {
  id: string;
  description: string;
  actions: WorkspaceAction[];
  sourceNodeId?: string | null;
  sourceActionId?: string | null;
  updatedAt?: string;
};

export type WorkspaceAction = {
  id: string;
  text: string;
};

export type GeneratorProjectSnapshot = {
  name: string;
  questStyle: string;
  status: string;
  stages: Array<{
    type: string;
    status: string;
    approved: boolean;
    outputJson: unknown;
  }>;
};

export type StagePromptPreview = {
  systemPrompt: string;
  userPrompt: string;
};
