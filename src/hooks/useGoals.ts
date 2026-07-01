import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGoal, getGoals } from '../api/goalApi';
import type { Goal } from '../types/goal';

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
