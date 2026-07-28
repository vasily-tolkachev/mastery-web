export type PipelineStageStatus = 'NOT_STARTED' | 'READY' | 'RUNNING' | 'REVIEW' | 'APPROVED' | 'FAILED';

export type PipelineStageDependency = {
  stageId: string;
  requiredStatus: PipelineStageStatus;
};

export type PipelineStageRevision = {
  revisionNumber: number;
  outputJson: unknown;
  createdAt: string;
  systemPromptUsed: string;
  userPromptUsed: string;
};

export type PipelineStage = {
  id: string;
  name: string;
  enabled: boolean;
  systemPromptTemplate: string;
  userPromptTemplate: string;
  args: unknown;
  memoryMode: 'NONE' | 'SELECTED_STAGES' | 'ALL_PREVIOUS';
  memorySources: string[];
  dependencies: PipelineStageDependency[];
  status: PipelineStageStatus;
  approved: boolean;
  currentRevision: PipelineStageRevision | null;
};

export type PipelineProject = {
  id: string;
  name: string;
  createdAt: string;
  stages: PipelineStage[];
};

export type PipelinePromptPreview = {
  systemPrompt: string;
  userPrompt: string;
  args: unknown;
  memory: string;
};
