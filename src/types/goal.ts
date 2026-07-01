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
