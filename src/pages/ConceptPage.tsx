import { Button, Grid, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState, ErrorState, InfoCard, LoadingState, PageHeader, SectionCard } from '../components/ui';
import { getMicroConceptGenerationStatus, generateMicroConceptContent } from '../api/programApi';
import { useGoalProgram } from '../hooks/useGoals';
import { useCurrentProgram, useProgramTree } from '../hooks/useProgram';
import type { MicroConceptGenerationStatus } from '../types/program';

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
  const effectiveProgramId = useMemo(() => {
    if (selectedProgramId > 0) return selectedProgramId;
    const parsed = Number(programQuery.data?.programId ?? 0);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [programQuery.data?.programId, selectedProgramId]);

  const [generationStatusByMicroId, setGenerationStatusByMicroId] = useState<Record<number, MicroConceptGenerationStatus>>({});
  const [generationBusyByMicroId, setGenerationBusyByMicroId] = useState<Record<number, boolean>>({});
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadStatuses() {
      if (!concept || effectiveProgramId <= 0) {
        setGenerationStatusByMicroId({});
        return;
      }
      const ids = concept.microConcepts
        .map((micro) => micro.microConceptId)
        .filter((id): id is number => id !== null);
      if (!ids.length) {
        setGenerationStatusByMicroId({});
        return;
      }
      try {
        const pairs = await Promise.all(ids.map(async (id) => [id, await getMicroConceptGenerationStatus(effectiveProgramId, id)] as const));
        if (cancelled) return;
        setGenerationStatusByMicroId(Object.fromEntries(pairs));
      } catch (e) {
        if (cancelled) return;
        setGenerationError(e instanceof Error ? e.message : 'Failed to load generation statuses');
      }
    }
    void loadStatuses();
    return () => {
      cancelled = true;
    };
  }, [concept, effectiveProgramId]);

  useEffect(() => {
    if (!concept || effectiveProgramId <= 0) return;
    const ids = concept.microConcepts
      .map((micro) => micro.microConceptId)
      .filter((id): id is number => id !== null);
    if (!ids.length) return;
    const shouldPoll = ids.some((id) => generationStatusByMicroId[id]?.status === 'GENERATING');
    if (!shouldPoll) return;

    const handle = window.setInterval(() => {
      void Promise.all(ids.map(async (id) => [id, await getMicroConceptGenerationStatus(effectiveProgramId, id)] as const))
        .then((pairs) => setGenerationStatusByMicroId((prev) => ({ ...prev, ...Object.fromEntries(pairs) })))
        .catch(() => {});
    }, 1500);
    return () => window.clearInterval(handle);
  }, [concept, effectiveProgramId, generationStatusByMicroId]);

  const handleGenerate = async (microConceptId: number) => {
    if (effectiveProgramId <= 0) return;
    setGenerationError(null);
    setGenerationBusyByMicroId((prev) => ({ ...prev, [microConceptId]: true }));
    try {
      const started = await generateMicroConceptContent(effectiveProgramId, microConceptId);
      const status = await getMicroConceptGenerationStatus(effectiveProgramId, microConceptId);
      setGenerationStatusByMicroId((prev) => ({ ...prev, [microConceptId]: { ...status, jobId: status.jobId ?? started.jobId } }));
    } catch (e) {
      setGenerationError(e instanceof Error ? e.message : 'Failed to start generation');
    } finally {
      setGenerationBusyByMicroId((prev) => ({ ...prev, [microConceptId]: false }));
    }
  };

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
      {generationError ? <ErrorState message={generationError} /> : null}

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
                  {concept.microConcepts.map((micro, index) => {
                    const id = micro.microConceptId;
                    const status = id === null ? null : generationStatusByMicroId[id];
                    const busy = id === null ? false : Boolean(generationBusyByMicroId[id]);
                    const statusLabel = status ? `${status.status} ${status.progressPercent}%` : 'NOT_STARTED';
                    return (
                      <Stack
                        key={micro.microConceptId ?? `${micro.title}-${index}`}
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
                      >
                        <Typography variant="body2">{`Шаг ${index + 1}: ${micro.title}`}</Typography>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">{statusLabel}</Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={id === null || busy || status?.status === 'GENERATING'}
                            onClick={() => {
                              if (id !== null) void handleGenerate(id);
                            }}
                          >
                            {busy ? 'Starting...' : 'Generate'}
                          </Button>
                        </Stack>
                        {status?.message ? (
                          <Typography variant="caption" color={status.status === 'FAILED' ? 'error.main' : 'text.secondary'} sx={{ width: '100%' }}>
                            {status.message}
                          </Typography>
                        ) : null}
                      </Stack>
                    );
                  })}
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
