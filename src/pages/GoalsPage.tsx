import { Box, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionButton, EmptyState, ErrorState, LoadingState, PageHeader, SectionCard, StatusChip } from '../components/ui';
import { useCreateGoal, useGoalProgram, useGoalResolutionStatus, useGoals, useStartGoal } from '../hooks/useGoals';
import type { Goal } from '../types/goal';

const DEFAULT_USER_ID = 'demo-user';

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

function GoalCard({
  goal,
  onStart,
  isStarting,
}: {
  goal: Goal;
  onStart: (goalId: number) => void;
  isStarting: boolean;
}) {
  const statusQuery = useGoalResolutionStatus(goal.id);
  const programQuery = useGoalProgram(goal.id);

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
      {programQuery.data ? (
        <Stack spacing={0.25} sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Program: {programQuery.data.title || programQuery.data.programId}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Origin: {programQuery.data.origin ?? 'GOAL_BASED'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Concepts: {programQuery.data.progress.totalConcepts} | Micro: {programQuery.data.progress.totalMicroConcepts}
          </Typography>
        </Stack>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Program: not linked yet
        </Typography>
      )}
      <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
        <ActionButton
          aria-label={`Start goal ${goal.title}`}
          onClick={() => onStart(goal.id)}
          disabled={isStarting}
        >
          Start
        </ActionButton>
      </Stack>
    </Box>
  );
}

export function GoalsPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const goalsQuery = useGoals();
  const createGoalMutation = useCreateGoal();
  const startGoalMutation = useStartGoal(DEFAULT_USER_ID);

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createGoalMutation.mutateAsync({
      title: title.trim(),
      description: description.trim() || title.trim(),
    });
    setTitle('');
    setDescription('');
  };

  const handleStartGoal = async (goalId: number) => {
    await startGoalMutation.mutateAsync(goalId);
    navigate('/learning');
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
            <GoalCard
              key={goal.id}
              goal={goal}
              onStart={handleStartGoal}
              isStarting={startGoalMutation.isPending}
            />
          ))}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
