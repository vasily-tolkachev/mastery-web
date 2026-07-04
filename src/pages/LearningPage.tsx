import { Divider, Grid, Stack, TextField } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useGoal, useGoalProgram } from '../hooks/useGoals';
import { useCurrentProgram } from '../hooks/useProgram';
import { spacing } from '../theme/tokens';
import type { LearningState } from '../types/learning';

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
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [activeGoalId, setActiveGoalId] = useState(() => {
    const raw = localStorage.getItem('active-goal-id');
    if (!raw) return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  });

  const learningStateQuery = useLearningState();
  const currentProgramQuery = useCurrentProgram();
  const goalQuery = useGoal(activeGoalId);
  const goalProgramQuery = useGoalProgram(activeGoalId);
  const startMutation = useStartLearning();
  const submitAnswerMutation = useSubmitAnswer();
  const continueMutation = useContinueLearning();
  const practiceMutation = useSubmitPractice();
  const quickCheckMutation = useSubmitQuickCheck();
  const retryMutation = useSubmitRetry();

  const state = learningStateQuery.data;
  const program = goalProgramQuery.data ?? currentProgramQuery.data;
  const activeGoal = goalQuery.data;

  useEffect(() => {
    if (activeGoalId <= 0) return;
    if (goalQuery.isSuccess && goalQuery.data === null) {
      localStorage.removeItem('active-goal-id');
      setActiveGoalId(0);
    }
  }, [activeGoalId, goalQuery.data, goalQuery.isSuccess]);
  const isPending =
    learningStateQuery.isLoading ||
    currentProgramQuery.isLoading ||
    goalProgramQuery.isLoading ||
    goalQuery.isLoading ||
    startMutation.isPending ||
    submitAnswerMutation.isPending ||
    continueMutation.isPending ||
    practiceMutation.isPending ||
    quickCheckMutation.isPending ||
    retryMutation.isPending;

  const error =
    learningStateQuery.error ??
    currentProgramQuery.error ??
    goalProgramQuery.error ??
    goalQuery.error ??
    startMutation.error ??
    submitAnswerMutation.error;

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

  const clearActiveGoal = () => {
    localStorage.removeItem('active-goal-id');
    setActiveGoalId(0);
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
              <Grid size={{ xs: 12 }}>
                <InfoCard
                  label="Active Goal"
                  value={activeGoal?.title ?? (activeGoalId > 0 ? `Goal #${activeGoalId}` : 'Not selected')}
                  hint={
                    activeGoalId > 0
                      ? `Goal ID: ${activeGoalId}`
                      : 'Select and start a goal from Goals page'
                  }
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                  <ActionButton aria-label="Back to goals" onClick={() => navigate('/goals')}>
                    Back to Goals
                  </ActionButton>
                  <ActionButton aria-label="Clear active goal" onClick={clearActiveGoal}>
                    Clear Active Goal
                  </ActionButton>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <InfoCard
                  label="Learning Path"
                  value={`${activeGoal?.title ?? program?.goalTitle ?? 'Goal not set'} -> ${program?.title ?? 'Program not set'} -> ${state?.context.conceptName ?? 'Concept not started'} -> ${state?.context.microConceptName ?? 'MicroConcept not started'}`}
                />
              </Grid>
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
                <ActionButton aria-label="Start learning" onClick={() => startMutation.mutate()} disabled={isPending}>
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
