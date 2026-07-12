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
      return 'Ответить на вопрос';
    case 'LEARNING_CARD':
      return 'Продолжить обучение';
    case 'PRACTICE':
      return 'Отправить практику';
    case 'QUICK_CHECK':
      return 'Отправить быструю проверку';
    case 'RETRY':
      return 'Отправить повтор';
    case 'COMPLETED':
      return 'Начать новое обучение';
    default:
      return 'Начать обучение';
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
        title="Главная"
        subtitle="Продолжайте с того места, где остановились."
        actions={<StatusChip label={state?.currentActivity.type ?? 'IDLE'} tone={state ? 'info' : 'default'} />}
      />

      {isPending ? <LoadingState message="Загрузка панели..." /> : null}
      {error ? <ErrorState message={error instanceof Error ? error.message : 'Непредвиденная ошибка'} /> : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard
            title="Продолжить обучение"
            action={
              <ActionButton aria-label="Открыть обучение" onClick={() => navigate('/learning')}>
                Открыть обучение
              </ActionButton>
            }
          >
            {state ? (
              <Stack spacing={1}>
                <InfoCard label="Следующее действие" value={mapNextAction(state.currentActivity.type)} />
                <InfoCard label="Текущая активность" value={state.currentActivity.type} />
                <InfoCard label="Пользователь" value={state.userId} />
              </Stack>
            ) : (
              <EmptyState message="Активная сессия обучения не найдена." />
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard
            title="Текущая программа"
            action={
              <ActionButton aria-label="Открыть программы" onClick={() => navigate('/programs')}>
                Открыть программу
              </ActionButton>
            }
          >
            {state ? (
              <Stack spacing={1}>
                <InfoCard label="Тема" value={state.context.topicName ?? '-'} />
                <InfoCard label="Концепт" value={state.context.conceptName ?? '-'} />
                <InfoCard label="Микроконцепт" value={state.context.microConceptName ?? '-'} />
              </Stack>
            ) : (
              <EmptyState message="Данные программы появятся после старта обучения." />
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Общий прогресс">
            <Stack spacing={1.5}>
              <ProgressCard
                title="Прогресс по концептам"
                current={state?.progress.conceptOrder ?? null}
                total={state?.progress.totalConcepts ?? null}
              />
              <InfoCard label="Ответов" value={String(state?.progress.answeredCount ?? 0)} hint={`Концепты: ${progressHint}`} />
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard
            title="Последние программы"
            action={
              <ActionButton aria-label="Начать обучение" onClick={() => startMutation.mutate()} disabled={isPending}>
                Начать обучение
              </ActionButton>
            }
          >
            <Stack spacing={1}>
              <InfoCard label="Последняя" value={state?.context.topicName ?? 'Нет недавней программы'} />
              <InfoCard label="Статус" value={state ? 'Есть активная сессия' : 'Сессии нет'} />
              <InfoCard label="Рекомендация" value="Перейдите в «Обучение» и продолжите текущую активность." />
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
