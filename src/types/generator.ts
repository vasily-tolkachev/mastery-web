export type GeneratorStageType = 'MYSTERY' | 'WORLD' | 'NPC' | 'FACTS' | 'QUEST_GRAPH';

export type GeneratorStageStatus = 'NOT_STARTED' | 'READY' | 'GENERATING' | 'REVIEW' | 'APPROVED';

export type StageRevision = {
  revisionNumber: number;
  outputJson: unknown;
  createdAt: string;
};

export type GeneratorStage = {
  type: GeneratorStageType;
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
};
