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

const LEARNING_STATE_QUERY_KEY = ['learning-state'];

export function useLearningState() {
  return useQuery({
    queryKey: LEARNING_STATE_QUERY_KEY,
    queryFn: () => getLearningState(),
  });
}

export function useStartLearning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => startLearning({}),
    onSuccess: (state) => {
      queryClient.setQueryData<LearningState>(LEARNING_STATE_QUERY_KEY, state);
    },
  });
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answer: string) => submitAnswer({ answer }),
    onSuccess: (state) => {
      queryClient.setQueryData<LearningState>(LEARNING_STATE_QUERY_KEY, state);
    },
  });
}

export function useContinueLearning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => continueLearning({}),
    onSuccess: (state) => {
      queryClient.setQueryData<LearningState>(LEARNING_STATE_QUERY_KEY, state);
    },
  });
}

export function useSubmitPractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      booleanAnswer: boolean | null;
      selectedOptions: number[];
      orderedOptions: number[];
      matches: Record<number, number>;
    }) =>
      submitPractice({ ...payload }),
    onSuccess: (state) => {
      queryClient.setQueryData<LearningState>(LEARNING_STATE_QUERY_KEY, state);
    },
  });
}

export function useSubmitQuickCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      booleanAnswer: boolean | null;
      selectedOptions: number[];
      orderedOptions: number[];
      matches: Record<number, number>;
    }) => submitQuickCheck({ ...payload }),
    onSuccess: (state) => {
      queryClient.setQueryData<LearningState>(LEARNING_STATE_QUERY_KEY, state);
    },
  });
}

export function useSubmitRetry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      booleanAnswer: boolean | null;
      selectedOptions: number[];
      orderedOptions: number[];
      matches: Record<number, number>;
    }) => submitRetry({ ...payload }),
    onSuccess: (state) => {
      queryClient.setQueryData<LearningState>(LEARNING_STATE_QUERY_KEY, state);
    },
  });
}
