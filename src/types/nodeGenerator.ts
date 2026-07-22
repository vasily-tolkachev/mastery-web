export type NodeGeneratorProject = {
  id: string;
  name: string;
  questStyle: string;
  status: string;
  workspace: NodeWorkspace | null;
};

export type NodeWorkspace = {
  nodes: WorkspaceNode[];
  globalKnowledge: string[];
  expansionSuggestions: WorkspaceExpansionSuggestion[];
  aiRequests: WorkspaceAiRequestLog[];
  nextNodeIndex: number;
  nextActionIndex: number;
  nextSuggestionIndex: number;
  nextAiRequestIndex: number;
};

export type WorkspaceNode = {
  id: string;
  description: string;
  actionDescription: string;
  stateDescription: string;
  actions: WorkspaceAction[];
  sourceNodeId?: string | null;
  sourceActionId?: string | null;
  updatedAt?: string;
  generatedDescriptionDraft?: string;
  generatedActionDescriptionDraft?: string;
  generatedStateDescriptionDraft?: string;
  extractedKnowledgeDraft?: string[];
  generatedActionsDraft?: string[];
};

export type WorkspaceAction = {
  id: string;
  text: string;
};

export type WorkspaceExpansionSuggestion = {
  id: string;
  nodeId: string;
  actionText: string;
  reason: string;
  status: string;
  sourceKnowledge: string[];
};

export type WorkspaceAiRequestLog = {
  id: string;
  stage: string;
  nodeId?: string | null;
  systemPrompt: string;
  userPrompt: string;
  createdAt: string;
};

export type StagePromptPreview = {
  systemPrompt: string;
  userPrompt: string;
};
