export type GeneratorStageType = 'QUEST_DESCRIPTION' | 'QUEST_CONSTRAINTS' | 'ACHIEVEMENT_RESOURCE_ANALYSIS' | 'MYSTERY' | 'WORLD' | 'ACHIEVEMENT_REALISATION' | 'NPC' | 'FACTS' | 'QUEST_OUTLINE' | 'CHAPTERS' | 'SCENES' | 'QUEST_GRAPH';

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
