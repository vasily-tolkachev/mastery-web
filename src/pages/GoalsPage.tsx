import { Box, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { ActionButton, EmptyState, ErrorState, LoadingState, PageHeader, SectionCard, StatusChip } from '../components/ui';
import { useCreateGoal, useGoalResolutionStatus, useGoals } from '../hooks/useGoals';
import type { Goal } from '../types/goal';

function GoalResolutionBadge({ goalId }: { goalId: number }) {
  const statusQuery = useGoalResolutionStatus(goalId);
  const status = statusQuery.data;

  if (!status) {
    return <StatusChip label="QUEUED" tone="default" />;
  }

  const tone =
    status.stage === 'COMPLETED' ? 'success' : status.stage === 'FAILED' ? 'error' : 'info';
  return <StatusChip label={`${status.stage} ${status.progressPercent}%`} tone={tone} />;
}

function GoalCard({ goal }: { goal: Goal }) {
  const statusQuery = useGoalResolutionStatus(goal.id);

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
        <Typography variant="subtitle2">{goal.title}</Typography>
        <GoalResolutionBadge goalId={goal.id} />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {goal.description}
      </Typography>
      {statusQuery.data?.message ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
          {statusQuery.data.message}
        </Typography>
      ) : null}
    </Box>
  );
}

export function GoalsPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const goalsQuery = useGoals();
  const createGoalMutation = useCreateGoal();

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createGoalMutation.mutateAsync({
      title: title.trim(),
      description: description.trim() || title.trim(),
    });
    setTitle('');
    setDescription('');
  };

  return (
    <Stack spacing={2}>
      <PageHeader title="Goals" subtitle="Create and manage learning goals." />

      <SectionCard title="Create Goal">
        <Stack spacing={1.5}>
          <TextField
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Become Java Backend Developer"
          />
          <TextField
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional details"
            multiline
            minRows={2}
          />
          <ActionButton
            aria-label="Create goal"
            onClick={handleCreate}
            disabled={createGoalMutation.isPending || !title.trim()}
          >
            + Create Goal
          </ActionButton>
        </Stack>
      </SectionCard>

      <SectionCard title="Goals List">
        {goalsQuery.isLoading ? <LoadingState message="Loading goals..." /> : null}
        {goalsQuery.error ? (
          <ErrorState message={goalsQuery.error instanceof Error ? goalsQuery.error.message : 'Failed to load goals'} />
        ) : null}
        {!goalsQuery.isLoading && !goalsQuery.error && !goalsQuery.data?.length ? (
          <EmptyState message="No goals yet. Create your first goal." />
        ) : null}

        <Stack spacing={1.5}>
          {(goalsQuery.data ?? []).map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
