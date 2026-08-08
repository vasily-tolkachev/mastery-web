export interface ProgramMicroConcept {
  microConceptId: number | null;
  title: string;
  sortOrder: number | null;
  completed: boolean;
  current: boolean;
  locked: boolean;
}

export interface ProgramConcept {
  conceptId: number | null;
  title: string;
  description: string;
  estimatedTimeMinutes: number;
  difficulty: string;
  prerequisites: string[];
  microConcepts: ProgramMicroConcept[];
}

export interface ProgramProgress {
  totalConcepts: number;
  totalMicroConcepts: number;
}

export interface LearningProgram {
  programId: string;
  goalId?: number | null;
  origin?: 'GOAL_BASED' | 'LIBRARY' | string;
  title: string;
  goalTitle: string;
  concepts: ProgramConcept[];
  progress: ProgramProgress;
}

export type LearningProgramStatus = 'CREATED' | 'GENERATING' | 'READY' | 'FAILED';

export interface ProgramGenerationStatus {
  programId: number;
  status: LearningProgramStatus;
  updatedAt: string;
}

export interface ProgramRecord {
  id: number;
  title: string;
  description: string;
  status: LearningProgramStatus;
  origin: 'GOAL_BASED' | string;
  createdAt: string;
  updatedAt: string;
}

export type MicroConceptGenerationStatusType = 'NOT_STARTED' | 'GENERATING' | 'READY' | 'FAILED';

export interface MicroConceptGenerationStatus {
  programId: number;
  microConceptId: number;
  jobId: number | null;
  status: MicroConceptGenerationStatusType;
  progressPercent: number;
  message: string;
  updatedAt: string;
}
