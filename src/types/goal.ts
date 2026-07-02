export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface Goal {
  id: number;
  title: string;
  description: string;
  status: GoalStatus;
  createdAt: string;
}

export interface CreateGoalRequest {
  title: string;
  description: string;
}

export type GoalResolutionStage =
  | 'QUEUED'
  | 'SEARCHING_LIBRARY'
  | 'GENERATING'
  | 'COMPLETED'
  | 'FAILED';

export interface GoalResolutionStatus {
  goalId: number;
  stage: GoalResolutionStage;
  progressPercent: number;
  message: string;
  updatedAt: string;
}

export interface GoalStartResult {
  goalId: number;
  programId: string;
  status: string;
}
