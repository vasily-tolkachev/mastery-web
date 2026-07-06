import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGoal, getGoalById, getGoalProgram, getGoalResolutionStatus, getGoals, startGoal } from '../api/goalApi';
import type { Goal, GoalResolutionStatus } from '../types/goal';
import type { LearningProgram } from '../types/program';

const GOALS_QUERY_KEY = ['goals'];

export function useGoals() {
  return useQuery({
    queryKey: GOALS_QUERY_KEY,
    queryFn: getGoals,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGoal,
    onSuccess: (created) => {
      queryClient.setQueryData<Goal[]>(GOALS_QUERY_KEY, (previous) => [created, ...(previous ?? [])]);
    },
  });
}

export function useGoalResolutionStatus(goalId: number) {
  return useQuery({
    queryKey: ['goal-resolution-status', goalId],
    queryFn: () => getGoalResolutionStatus(goalId),
    enabled: goalId > 0,
    refetchInterval: (query) => {
      const data = query.state.data as GoalResolutionStatus | null | undefined;
      if (!data) return 1500;
      return data.stage === 'COMPLETED' || data.stage === 'FAILED' ? false : 1500;
    },
  });
}

export function useStartGoal() {
  return useMutation({
    mutationFn: (goalId: number) => startGoal(goalId),
  });
}

export function useGoalProgram(goalId: number, enabled = true) {
  return useQuery({
    queryKey: ['goal-program', goalId],
    queryFn: () => getGoalProgram(goalId),
    enabled: enabled && goalId > 0,
    refetchInterval: (query) => {
      const data = query.state.data as LearningProgram | null | undefined;
      return data ? false : 1500;
    },
  });
}

export function useGoal(goalId: number) {
  return useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => getGoalById(goalId),
    enabled: goalId > 0,
  });
}
