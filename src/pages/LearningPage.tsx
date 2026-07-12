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
  if (!state) return 'БЕЗ_СЕССИИ';
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
            title="Обучение"
            subtitle="Основной рабочий экран"
            actions={<StatusChip label={getActivityTitle(state)} tone={state ? 'info' : 'default'} />}
          />

          <SectionCard title="Контекст">
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12 }}>
                <InfoCard
                  label="Активная цель"
                  value={activeGoal?.title ?? (activeGoalId > 0 ? `Цель #${activeGoalId}` : 'Не выбрана')}
                  hint={
                    activeGoalId > 0
                      ? `ID цели: ${activeGoalId}`
                      : 'Выберите и запустите цель на странице «Цели»'
                  }
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                  <ActionButton aria-label="Назад к целям" onClick={() => navigate('/goals')}>
                    К целям
                  </ActionButton>
                  <ActionButton aria-label="Очистить активную цель" onClick={clearActiveGoal}>
                    Очистить активную цель
                  </ActionButton>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <InfoCard
                  label="Путь обучения"
                  value={`${activeGoal?.title ?? program?.goalTitle ?? 'Цель не задана'} -> ${program?.title ?? 'Программа не задана'} -> ${state?.context.conceptName ?? 'Концепт не начат'} -> ${state?.context.microConceptName ?? 'Микроконцепт не начат'}`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <InfoCard label="Тема" value={state?.context.topicName ?? '-'} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <InfoCard label="Концепт" value={state?.context.conceptName ?? '-'} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <InfoCard label="Микроконцепт" value={state?.context.microConceptName ?? '-'} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <InfoCard
                  label="Прогресс"
                  value={`${state?.progress.conceptOrder ?? 0}/${state?.progress.totalConcepts ?? 0}`}
                  hint={`Ответов: ${state?.progress.answeredCount ?? 0}`}
                />
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Текущая активность">
            {isPending ? <LoadingState message="Загрузка состояния обучения..." /> : null}
            {error ? <ErrorState message={error instanceof Error ? error.message : 'Непредвиденная ошибка'} /> : null}
            {!state && !isPending && !error ? <EmptyState message="Нажмите «Старт», чтобы начать обучение." /> : null}
            {state ? <LearningActivityView activity={state.currentActivity} /> : null}
          </SectionCard>

          <SectionCard title="Действия">
            <Stack spacing={1.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <ActionButton aria-label="Начать обучение" onClick={() => startMutation.mutate()} disabled={isPending}>
                  Старт
                </ActionButton>
              </Stack>

              <Divider />

              {state?.currentActivity.type === 'LEARNING_CARD' ? (
                <ActionButton aria-label="Продолжить обучение" onClick={() => continueMutation.mutate()} disabled={isPending}>
                  Продолжить
                </ActionButton>
              ) : null}

              {canSubmitInput ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    label="Ответ"
                    slotProps={{ htmlInput: { 'aria-label': 'Поле ответа' } }}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    fullWidth
                  />
                  <ActionButton aria-label="Отправить ответ" onClick={handleSubmit} disabled={isPending || !input.trim()}>
                    Отправить
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
            title="Прогресс по концептам"
            current={state?.progress.conceptOrder ?? null}
            total={state?.progress.totalConcepts ?? null}
          />
          <ProgressCard
            title="Прогресс по микроконцептам"
            current={state?.progress.microConceptOrder ?? null}
            total={state?.progress.totalMicroConcepts ?? null}
          />
          <InfoCard label="Следующий шаг" value={state?.currentActivity.type ?? 'Начать обучение'} />
          <InfoCard label="ID сессии" value={state?.sessionId ?? '-'} hint={`Схема v${state?.schemaVersion ?? '-'}`} />
        </Stack>
      </Grid>
    </Grid>
  );
}
