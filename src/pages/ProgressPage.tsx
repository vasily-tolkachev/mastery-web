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
  'Завершено: основы гравитации и массы',
  'Завершено: интуиция орбитального движения',
  'Повторено: связь Земля-Луна',
];

function buildRecommendation(activityType: string | undefined): string {
  switch (activityType) {
    case 'QUESTION':
      return 'Ответьте на текущий вопрос, чтобы сохранить темп.';
    case 'LEARNING_CARD':
      return 'После карточки перейдите к практике.';
    case 'PRACTICE':
      return 'Завершите текущий набор практики.';
    case 'QUICK_CHECK':
      return 'Отправьте быструю проверку для оценки усвоения.';
    case 'RETRY':
      return 'Повторите с фокусом на критериях для лучшего закрепления.';
    case 'COMPLETED':
      return 'Начните новую цель или повторите слабые места.';
    default:
      return 'Начните обучение, чтобы появился прогресс.';
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
        title="Прогресс"
        subtitle="Отслеживайте путь обучения, а не только цифры."
        actions={<StatusChip label={state?.currentActivity.type ?? 'БЕЗ_СЕССИИ'} tone={state ? 'info' : 'default'} />}
      />

      {isLoading ? <LoadingState message="Загрузка прогресса..." /> : null}
      {error ? <ErrorState message={error instanceof Error ? error.message : 'Непредвиденная ошибка'} /> : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2}>
            <SectionCard title="Траектория обучения">
              {state ? (
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <InfoCard label="Текущая цель" value="Освоить базовые концепты астрономии" />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <InfoCard label="Текущая программа" value="Основы астрономии" />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <InfoCard label="Текущая тема" value={state.context.topicName ?? 'Не начато'} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <InfoCard label="Текущий концепт" value={state.context.conceptName ?? 'Не начато'} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <InfoCard label="Текущий микроконцепт" value={state.context.microConceptName ?? 'Не начато'} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <InfoCard label="Освоено концептов" value={String(Math.max((state.progress.conceptOrder ?? 1) - 1, 0))} />
                  </Grid>
                </Grid>
              ) : (
                <EmptyState message="Активной сессии пока нет." />
              )}
            </SectionCard>

            <SectionCard title="История обучения">
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
              title="Прогресс по концептам"
              current={state?.progress.conceptOrder ?? null}
              total={state?.progress.totalConcepts ?? null}
            />
            <ProgressCard
              title="Прогресс по микроконцептам"
              current={state?.progress.microConceptOrder ?? null}
              total={state?.progress.totalMicroConcepts ?? null}
            />
            <SectionCard title="Следующая рекомендация">
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
