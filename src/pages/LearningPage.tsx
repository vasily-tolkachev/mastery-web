import { Divider, Grid, Stack, TextField } from '@mui/material';
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
    normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'y' || normalized === 'da'
      ? true
      : normalized === 'false' ||
          normalized === '0' ||
          normalized === 'no' ||
          normalized === 'n' ||
          normalized === 'net'
        ? false
        : null;

  const selectedOptions = normalized
    .split(/[,\s;/|]+/)
    .map((token) => Number.parseInt(token, 10))
    .filter((value) => Number.isInteger(value));

  return { booleanAnswer, selectedOptions };
}

function getActivityTitle(state: LearningState | undefined): string {
  if (!state) return 'IDLE';
  return state.currentActivity.type.replace('_', ' ');
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
      await practiceMutation.mutateAsync(parsePracticeInput(input));
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
      <Grid size={{ xs: 12, lg: 8.5 }}>
        <Stack spacing={spacing.section}>
          <PageHeader
            title="Learning Workspace"
            subtitle="Core runtime screen"
            actions={<StatusChip label={getActivityTitle(state)} tone={state ? 'info' : 'default'} />}
          />

          <SectionCard title="Context">
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <InfoCard label="Topic" value={state?.context.topicName ?? '-'} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <InfoCard label="Concept" value={state?.context.conceptName ?? '-'} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <InfoCard label="MicroConcept" value={state?.context.microConceptName ?? '-'} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <InfoCard
                  label="Progress"
                  value={`${state?.progress.conceptOrder ?? 0}/${state?.progress.totalConcepts ?? 0}`}
                  hint={`Answered: ${state?.progress.answeredCount ?? 0}`}
                />
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Current Activity">
            {isPending ? <LoadingState message="Loading learning state..." /> : null}
            {error ? <ErrorState message={error instanceof Error ? error.message : 'Unexpected error'} /> : null}
            {!state && !isPending && !error ? <EmptyState message="Press Start to begin learning." /> : null}
            {state ? <LearningActivityView activity={state.currentActivity} /> : null}
          </SectionCard>

          <SectionCard title="Action Area">
            <Stack spacing={1.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="User ID"
                  slotProps={{ htmlInput: { 'aria-label': 'Learning user id input' } }}
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  size="small"
                  fullWidth
                />
                <ActionButton aria-label="Start learning" onClick={() => startMutation.mutate()} disabled={isPending || !userId.trim()}>
                  Start
                </ActionButton>
              </Stack>

              <Divider />

              {state?.currentActivity.type === 'LEARNING_CARD' ? (
                <ActionButton aria-label="Continue learning flow" onClick={() => continueMutation.mutate()} disabled={isPending}>
                  Continue
                </ActionButton>
              ) : null}

              {canSubmitInput ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    label="Answer"
                    slotProps={{ htmlInput: { 'aria-label': 'Learning answer input' } }}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    fullWidth
                  />
                  <ActionButton aria-label="Submit learning answer" onClick={handleSubmit} disabled={isPending || !input.trim()}>
                    Submit
                  </ActionButton>
                </Stack>
              ) : null}
            </Stack>
          </SectionCard>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 3.5 }}>
        <Stack spacing={spacing.section}>
          <ProgressCard
            title="Concept Progress"
            current={state?.progress.conceptOrder ?? null}
            total={state?.progress.totalConcepts ?? null}
          />
          <ProgressCard
            title="MicroConcept Progress"
            current={state?.progress.microConceptOrder ?? null}
            total={state?.progress.totalMicroConcepts ?? null}
          />
          <InfoCard label="Next Step" value={state?.currentActivity.type ?? 'Start Learning'} />
          <InfoCard label="Session ID" value={state?.sessionId ?? '-'} hint={`Schema v${state?.schemaVersion ?? '-'}`} />
        </Stack>
      </Grid>
    </Grid>
  );
}
