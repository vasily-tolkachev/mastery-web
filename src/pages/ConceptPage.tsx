import { Grid, Stack } from '@mui/material';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState, ErrorState, InfoCard, LoadingState, PageHeader, SectionCard } from '../components/ui';
import { useGoalProgram } from '../hooks/useGoals';
import { useCurrentProgram, useProgramTree } from '../hooks/useProgram';

export function ConceptPage() {
  const params = useParams<{ conceptId: string }>();
  const conceptId = params.conceptId ? Number(params.conceptId) : null;

  const activeGoalIdRaw = localStorage.getItem('active-goal-id');
  const activeGoalId = activeGoalIdRaw ? Number(activeGoalIdRaw) : 0;
  const safeGoalId = Number.isFinite(activeGoalId) && activeGoalId > 0 ? activeGoalId : 0;

  const goalProgramQuery = useGoalProgram(safeGoalId);
  const selectedProgramId = useMemo(() => {
    const parsed = Number(goalProgramQuery.data?.programId ?? 0);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [goalProgramQuery.data?.programId]);

  const programTreeQuery = useProgramTree(selectedProgramId);
  const currentProgramQuery = useCurrentProgram();
  const programQuery = selectedProgramId > 0 ? programTreeQuery : currentProgramQuery;

  const concept = useMemo(() => {
    if (!programQuery.data || conceptId === null || Number.isNaN(conceptId)) {
      return null;
    }
    return programQuery.data.concepts.find((item) => item.conceptId === conceptId) ?? null;
  }, [programQuery.data, conceptId]);

  const conceptIndex = useMemo(() => {
    if (!programQuery.data || !concept) return -1;
    return programQuery.data.concepts.findIndex((item) => item.conceptId === concept.conceptId);
  }, [programQuery.data, concept]);

  const prerequisites = useMemo(() => {
    if (!programQuery.data || conceptIndex <= 0) return [];
    return programQuery.data.concepts.slice(0, conceptIndex).map((item) => item.title);
  }, [programQuery.data, conceptIndex]);

  const totalMicro = concept?.microConcepts.length ?? 0;
  const completedMicro = concept?.microConcepts.filter((micro) => micro.completed).length ?? 0;
  const loading = goalProgramQuery.isLoading || programQuery.isLoading;
  const error = goalProgramQuery.error ?? programQuery.error;

  return (
    <Stack spacing={2}>
      <PageHeader
        title={concept?.title ?? 'Концепт'}
        subtitle={`${programQuery.data?.title ?? 'Программа'} -> ${concept?.title ?? 'Неизвестный концепт'}`}
      />

      {loading ? <LoadingState message="Загрузка концепта..." /> : null}
      {error ? (
        <ErrorState message={error instanceof Error ? error.message : 'Непредвиденная ошибка'} />
      ) : null}

      {!loading && !error && !concept ? (
        <EmptyState message="Концепт не найден в текущей программе." />
      ) : null}

      {concept ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={2}>
              <SectionCard title="Описание">
                <InfoCard label="Кратко" value={concept.description || 'Описание пока отсутствует.'} />
                <InfoCard label="Сложность" value={concept.difficulty || 'Неизвестно'} />
                <InfoCard
                  label="Оценка времени"
                  value={`${Math.max(0, concept.estimatedTimeMinutes)} мин`}
                />
              </SectionCard>

              <SectionCard title="Микроконцепты">
                <Stack spacing={1}>
                  {concept.microConcepts.map((micro, index) => (
                    <InfoCard key={micro.microConceptId ?? `${micro.title}-${index}`} label={`Шаг ${index + 1}`} value={micro.title} />
                  ))}
                </Stack>
              </SectionCard>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={2}>
              <SectionCard title="Прогресс">
                <InfoCard label="Микроконцепты" value={`${completedMicro} / ${totalMicro}`} />
              </SectionCard>

              <SectionCard title="Предпосылки">
                {(concept.prerequisites.length ? concept.prerequisites : prerequisites).length ? (
                  <Stack spacing={1}>
                    {(concept.prerequisites.length ? concept.prerequisites : prerequisites).map((title) => (
                      <InfoCard key={title} label="Требуется" value={title} />
                    ))}
                  </Stack>
                ) : (
                  <EmptyState message="Для этого концепта нет обязательных предпосылок." />
                )}
              </SectionCard>
            </Stack>
          </Grid>
        </Grid>
      ) : null}
    </Stack>
  );
}
