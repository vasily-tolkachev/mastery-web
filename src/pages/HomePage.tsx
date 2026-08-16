import { Grid, Stack } from '@mui/material';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useLearningState, useStartLearning } from '../hooks/useLearning';

function mapNextAction(activityType: string | undefined): string {
  switch (activityType) {
    case 'QUESTION':
      return 'Answer the question';
    case 'LEARNING_CARD':
      return 'Continue learning';
    case 'PRACTICE':
      return 'Submit practice';
    case 'QUICK_CHECK':
      return 'Submit quick check';
    case 'RETRY':
      return 'Submit retry';
    case 'COMPLETED':
      return 'Start a new learning session';
    default:
      return 'Start learning';
  }
}

export function HomePage() {
  const navigate = useNavigate();
  const stateQuery = useLearningState();
  const startMutation = useStartLearning();

  const state = stateQuery.data;
  const isPending = stateQuery.isLoading || startMutation.isPending;
  const error = stateQuery.error ?? startMutation.error;

  const progressHint = useMemo(() => {
    const concept = state?.progress.conceptOrder ?? 0;
    const total = state?.progress.totalConcepts ?? 0;
    return `${concept}/${total}`;
  }, [state]);

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Home"
        subtitle="Continue from where you left off."
        actions={<StatusChip label={state?.currentActivity.type ?? 'IDLE'} tone={state ? 'info' : 'default'} />}
      />

      {isPending ? <LoadingState message="Loading dashboard..." /> : null}
      {error ? <ErrorState message={error instanceof Error ? error.message : 'Unexpected error'} /> : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard
            title="Continue Learning"
            action={
              <ActionButton aria-label="Open learning" onClick={() => navigate('/learning')}>
                Open Learning
              </ActionButton>
            }
          >
            {state ? (
              <Stack spacing={1}>
                <InfoCard label="Next Action" value={mapNextAction(state.currentActivity.type)} />
                <InfoCard label="Current Activity" value={state.currentActivity.type} />
                <InfoCard label="User" value={state.userId} />
              </Stack>
            ) : (
              <EmptyState message="No active learning session found." />
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard
            title="Current Program"
            action={
              <ActionButton aria-label="Open programs" onClick={() => navigate('/programs')}>
                Open Program
              </ActionButton>
            }
          >
            {state ? (
              <Stack spacing={1}>
                <InfoCard label="Topic" value={state.context.topicName ?? '-'} />
                <InfoCard label="Concept" value={state.context.conceptName ?? '-'} />
                <InfoCard label="Micro Concept" value={state.context.microConceptName ?? '-'} />
              </Stack>
            ) : (
              <EmptyState message="Program data will appear after you start learning." />
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Overall Progress">
            <Stack spacing={1.5}>
              <ProgressCard
                title="Concept Progress"
                current={state?.progress.conceptOrder ?? null}
                total={state?.progress.totalConcepts ?? null}
              />
              <InfoCard label="Answers" value={String(state?.progress.answeredCount ?? 0)} hint={`Concepts: ${progressHint}`} />
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard
            title="Recent Programs"
            action={
              <ActionButton aria-label="Start learning" onClick={() => startMutation.mutate()} disabled={isPending}>
                Start Learning
              </ActionButton>
            }
          >
            <Stack spacing={1}>
              <InfoCard label="Latest" value={state?.context.topicName ?? 'No recent program'} />
              <InfoCard label="Status" value={state ? 'Active session available' : 'No session'} />
              <InfoCard label="Recommendation" value='Go to "Learning" and continue your current activity.' />
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
