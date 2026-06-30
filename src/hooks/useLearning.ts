import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  continueLearning,
  getLearningState,
  startLearning,
  submitAnswer,
  submitPractice,
  submitQuickCheck,
  submitRetry,
} from '../api/learningApi';
import type { LearningState } from '../types/learning';

const LEARNING_STATE_QUERY_KEY = (userId: string) => ['learning-state', userId];

export function useLearningState(userId: string) {
  return useQuery({
    queryKey: LEARNING_STATE_QUERY_KEY(userId),
    queryFn: () => getLearningState(userId),
  });
}

export function useStartLearning(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => startLearning({ userId }),
    onSuccess: (state) => {
      queryClient.setQueryData<LearningState>(LEARNING_STATE_QUERY_KEY(userId), state);
    },
  });
}

export function useSubmitAnswer(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answer: string) => submitAnswer({ userId, answer }),
    onSuccess: (state) => {
      queryClient.setQueryData<LearningState>(LEARNING_STATE_QUERY_KEY(userId), state);
    },
  });
}

export function useContinueLearning(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => continueLearning({ userId }),
    onSuccess: (state) => {
      queryClient.setQueryData<LearningState>(LEARNING_STATE_QUERY_KEY(userId), state);
    },
  });
}

export function useSubmitPractice(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { booleanAnswer: boolean | null; selectedOptions: number[] }) =>
      submitPractice({ userId, ...payload }),
    onSuccess: (state) => {
      queryClient.setQueryData<LearningState>(LEARNING_STATE_QUERY_KEY(userId), state);
    },
  });
}

export function useSubmitQuickCheck(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answer: string) => submitQuickCheck({ userId, answer }),
    onSuccess: (state) => {
      queryClient.setQueryData<LearningState>(LEARNING_STATE_QUERY_KEY(userId), state);
    },
  });
}

export function useSubmitRetry(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answer: string) => submitRetry({ userId, answer }),
    onSuccess: (state) => {
      queryClient.setQueryData<LearningState>(LEARNING_STATE_QUERY_KEY(userId), state);
    },
  });
}
