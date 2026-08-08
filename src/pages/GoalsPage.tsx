import { Box, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionButton, EmptyState, ErrorState, LoadingState, PageHeader, SectionCard, StatusChip } from '../components/ui';
import { useCreateGoal, useGoalProgram, useGoalResolutionStatus, useGoals, useStartGoal } from '../hooks/useGoals';
import type { Goal } from '../types/goal';

function GoalResolutionBadge({ goalId }: { goalId: number }) {
  const statusQuery = useGoalResolutionStatus(goalId);
  const status = statusQuery.data;

  if (!status) {
    return <StatusChip label="В ОЧЕРЕДИ" tone="default" />;
  }

  const tone =
    status.stage === 'COMPLETED' ? 'success' : status.stage === 'FAILED' ? 'error' : 'info';
  return <StatusChip label={`${status.stage} ${status.progressPercent}%`} tone={tone} />;
}

function GoalCard({
  goal,
  onStart,
  isStarting,
  startError,
}: {
  goal: Goal;
  onStart: (goalId: number) => void;
  isStarting: boolean;
  startError?: string;
}) {
  const statusQuery = useGoalResolutionStatus(goal.id);
  const shouldLoadProgram = statusQuery.data?.stage === 'COMPLETED';
  const programQuery = useGoalProgram(goal.id, shouldLoadProgram);
  const canStart = statusQuery.data?.stage === 'COMPLETED';

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
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
            Программа: {programQuery.data.title || programQuery.data.programId}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Источник: {programQuery.data.origin ?? 'GOAL_BASED'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Концепты: {programQuery.data.progress.totalConcepts} | Микро: {programQuery.data.progress.totalMicroConcepts}
          </Typography>
        </Stack>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Программа: пока не привязана
        </Typography>
      )}
      <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
        <ActionButton
          aria-label={`Запустить цель ${goal.title}`}
          onClick={() => onStart(goal.id)}
          disabled={isStarting || !canStart}
        >
          Старт
        </ActionButton>
      </Stack>
      {!canStart ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Старт будет доступен после завершения генерации.
        </Typography>
      ) : null}
      {startError ? (
        <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
          {startError}
        </Typography>
      ) : null}
    </Box>
  );
}

export function GoalsPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startErrorByGoalId, setStartErrorByGoalId] = useState<Record<number, string>>({});

  const goalsQuery = useGoals();
  const createGoalMutation = useCreateGoal();
  const startGoalMutation = useStartGoal();

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
    setStartErrorByGoalId((previous) => {
      const next = { ...previous };
      delete next[goalId];
      return next;
    });
    try {
      const result = await startGoalMutation.mutateAsync(goalId);
      if (result.status !== 'READY') {
        setStartErrorByGoalId((previous) => ({
          ...previous,
          [goalId]: result.status === 'MICRO_CONCEPT_CONTENT_NOT_READY'
            ? 'Контент для первого микроконцепта еще не сгенерирован.'
            : `Не удалось запустить цель (${result.status})`,
        }));
        return;
      }
      localStorage.setItem('active-goal-id', String(goalId));
      navigate('/learning');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось запустить цель';
      setStartErrorByGoalId((previous) => ({ ...previous, [goalId]: message }));
    }
  };

  return (
    <Stack spacing={2}>
      <PageHeader title="Цели" subtitle="Создание и управление целями обучения." />

      <SectionCard title="Создать цель">
        <Stack spacing={1.5}>
          <TextField
            label="Название"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Стать Java Backend разработчиком"
          />
          <TextField
            label="Описание"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Дополнительные детали"
            multiline
            minRows={2}
          />
          <ActionButton
            aria-label="Создать цель"
            onClick={handleCreate}
            disabled={createGoalMutation.isPending || !title.trim()}
          >
            + Создать цель
          </ActionButton>
        </Stack>
      </SectionCard>

      <SectionCard title="Список целей">
        {goalsQuery.isLoading ? <LoadingState message="Загрузка целей..." /> : null}
        {goalsQuery.error ? (
          <ErrorState message={goalsQuery.error instanceof Error ? goalsQuery.error.message : 'Не удалось загрузить цели'} />
        ) : null}
        {!goalsQuery.isLoading && !goalsQuery.error && !goalsQuery.data?.length ? (
          <EmptyState message="Целей пока нет. Создайте первую цель." />
        ) : null}

        <Stack spacing={1.5}>
          {(goalsQuery.data ?? []).map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onStart={handleStartGoal}
              isStarting={startGoalMutation.isPending}
              startError={startErrorByGoalId[goal.id]}
            />
          ))}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
