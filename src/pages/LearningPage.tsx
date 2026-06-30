import { Box, Grid, Stack, TextField } from '@mui/material';
import { useMemo, useState } from 'react';
import { LearningActivityView } from '../components/LearningActivityView';
import {
  ActionButton,
  EmptyState,
  ErrorState,
  InfoCard,
  LoadingState,
  PageHeader,
  ProgressCard,
  SectionCard,
  StatusChip,
} from '../components/ui';
import {
  useContinueLearning,
  useLearningState,
  useStartLearning,
  useSubmitAnswer,
  useSubmitPractice,
  useSubmitQuickCheck,
  useSubmitRetry,
} from '../hooks/useLearning';
import { spacing } from '../theme/tokens';
import type { LearningState } from '../types/learning';

const DEFAULT_USER_ID = 'demo-user';

function parsePracticeInput(input: string): { booleanAnswer: boolean | null; selectedOptions: number[] } {
  const normalized = input.trim().toLowerCase();
  const booleanAnswer =
    normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'y' || normalized === 'да'
      ? true
      : normalized === 'false' ||
          normalized === '0' ||
          normalized === 'no' ||
          normalized === 'n' ||
          normalized === 'нет'
        ? false
        : null;

  const selectedOptions = normalized
    .split(/[,\s;/|]+/)
    .map((token) => Number.parseInt(token, 10))
    .filter((value) => Number.isInteger(value));

  return { booleanAnswer, selectedOptions };
}

function buildStateSummary(state: LearningState): string {
  const topic = state.context.topicName ?? '-';
  const concept = state.context.conceptName ?? '-';
  const progress = `${state.progress.conceptOrder ?? '-'}/${state.progress.totalConcepts ?? '-'}`;
  return `Topic: ${topic} | Concept: ${concept} | Progress: ${progress}`;
}

export function LearningPage() {
  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [input, setInput] = useState('');

  const learningStateQuery = useLearningState(userId);
  const startMutation = useStartLearning(userId);
  const submitAnswerMutation = useSubmitAnswer(userId);
  const continueMutation = useContinueLearning(userId);
  const practiceMutation = useSubmitPractice(userId);
  const quickCheckMutation = useSubmitQuickCheck(userId);
  const retryMutation = useSubmitRetry(userId);

  const state = learningStateQuery.data;
  const isPending =
    learningStateQuery.isLoading ||
    startMutation.isPending ||
    submitAnswerMutation.isPending ||
    continueMutation.isPending ||
    practiceMutation.isPending ||
    quickCheckMutation.isPending ||
    retryMutation.isPending;

  const error = learningStateQuery.error ?? startMutation.error ?? submitAnswerMutation.error;

  const canSubmitInput = useMemo(() => {
    if (!state) return false;
    return state.currentActivity.type !== 'LEARNING_CARD' && state.currentActivity.type !== 'COMPLETED';
  }, [state]);

  const handleSubmit = async () => {
    if (!state) return;
    if (state.currentActivity.type === 'QUESTION') {
      await submitAnswerMutation.mutateAsync(input);
      setInput('');
      return;
    }
    if (state.currentActivity.type === 'PRACTICE') {
      const practicePayload = parsePracticeInput(input);
      await practiceMutation.mutateAsync(practicePayload);
      setInput('');
      return;
    }
    if (state.currentActivity.type === 'QUICK_CHECK') {
      await quickCheckMutation.mutateAsync(input);
      setInput('');
      return;
    }
    if (state.currentActivity.type === 'RETRY') {
      await retryMutation.mutateAsync(input);
      setInput('');
    }
  };

  return (
    <Grid container spacing={spacing.section}>
      <Grid size={{ xs: 12, md: 8 }}>
        <SectionCard
          title="Learning"
          action={<StatusChip label={state?.currentActivity.type ?? 'IDLE'} tone={state ? 'info' : 'default'} />}
        >
          <Stack spacing={spacing.section}>
            <PageHeader title="Learning State" subtitle="Backend-driven runtime view" />
            <Stack direction="row" spacing={1.5}>
              <TextField
                label="User ID"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                size="small"
                fullWidth
              />
              <ActionButton onClick={() => startMutation.mutate()} disabled={isPending || !userId.trim()}>
                Start
              </ActionButton>
            </Stack>

            {isPending ? <LoadingState message="Loading state..." /> : null}
            {error ? <ErrorState message={error instanceof Error ? error.message : 'Unexpected error'} /> : null}

            {state ? (
              <>
                <InfoCard label="Session" value={buildStateSummary(state)} />
                <LearningActivityView activity={state.currentActivity} />

                {state.currentActivity.type === 'LEARNING_CARD' ? (
                  <ActionButton onClick={() => continueMutation.mutate()} disabled={isPending}>
                    Continue
                  </ActionButton>
                ) : null}

                {canSubmitInput ? (
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="Answer"
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      fullWidth
                    />
                    <ActionButton onClick={handleSubmit} disabled={isPending || !input.trim()}>
                      Submit
                    </ActionButton>
                  </Stack>
                ) : null}
              </>
            ) : (
              <EmptyState message="Click Start to begin learning." />
            )}
          </Stack>
        </SectionCard>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={spacing.stack}>
          <ProgressCard
            title="Concept Progress"
            current={state?.progress.conceptOrder ?? null}
            total={state?.progress.totalConcepts ?? null}
          />
          <SectionCard title="Raw JSON">
            <Box component="pre" sx={{ overflow: 'auto', fontSize: 12, mt: 1, mb: 0 }}>
              {state ? JSON.stringify(state, null, 2) : 'No state yet'}
            </Box>
          </SectionCard>
        </Stack>
      </Grid>
    </Grid>
  );
}
