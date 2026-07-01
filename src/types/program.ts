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
  title: string;
  goalTitle: string;
  concepts: ProgramConcept[];
  progress: ProgramProgress;
}
