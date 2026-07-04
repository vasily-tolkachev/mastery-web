import { Grid, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  ErrorState,
  InfoCard,
  LoadingState,
  PageHeader,
  ProgressCard,
  SectionCard,
  StatusChip,
} from '../components/ui';
import { useLearningState } from '../hooks/useLearning';

const mockHistory = [
  'Completed: Gravity and Mass basics',
  'Completed: Orbital motion intuition',
  'Reviewed: Earth-Moon relationship',
];

function buildRecommendation(activityType: string | undefined): string {
  switch (activityType) {
    case 'QUESTION':
      return 'Answer current question to keep momentum.';
    case 'LEARNING_CARD':
      return 'Continue to practice after reviewing the card.';
    case 'PRACTICE':
      return 'Finish current practice set.';
    case 'QUICK_CHECK':
      return 'Submit quick check to validate retention.';
    case 'RETRY':
      return 'Retry with rubric focus for stronger recall.';
    case 'COMPLETED':
      return 'Start a new learning goal or review weak areas.';
    default:
      return 'Start learning to generate progress.';
  }
}

export function ProgressPage() {
  const learningStateQuery = useLearningState();
  const state = learningStateQuery.data;
  const isLoading = learningStateQuery.isLoading;
  const error = learningStateQuery.error;

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Progress"
        subtitle="Track learning progression, not only statistics."
        actions={<StatusChip label={state?.currentActivity.type ?? 'NO_SESSION'} tone={state ? 'info' : 'default'} />}
      />

      {isLoading ? <LoadingState message="Loading progress..." /> : null}
      {error ? <ErrorState message={error instanceof Error ? error.message : 'Unexpected error'} /> : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2}>
            <SectionCard title="Learning Trajectory">
              {state ? (
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <InfoCard label="Current Goal" value="Master foundational astronomy concepts" />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <InfoCard label="Current Program" value="Astronomy Foundations" />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <InfoCard label="Current Topic" value={state.context.topicName ?? 'Not started'} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <InfoCard label="Current Concept" value={state.context.conceptName ?? 'Not started'} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <InfoCard label="Current MicroConcept" value={state.context.microConceptName ?? 'Not started'} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <InfoCard label="Mastered Concepts" value={String(Math.max((state.progress.conceptOrder ?? 1) - 1, 0))} />
                  </Grid>
                </Grid>
              ) : (
                <EmptyState message="No active session yet." />
              )}
            </SectionCard>

            <SectionCard title="Learning History (Scaffold)">
              <List dense>
                {mockHistory.map((entry) => (
                  <ListItem key={entry} disableGutters>
                    <ListItemText primary={entry} />
                  </ListItem>
                ))}
              </List>
            </SectionCard>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
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
            <SectionCard title="Next Recommendation">
              <Typography variant="body2" color="text.secondary">
                {buildRecommendation(state?.currentActivity.type)}
              </Typography>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
