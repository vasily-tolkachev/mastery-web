import { Button, Grid, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
import { useGoal, useGoalProgram, useGoals } from '../hooks/useGoals';
import { useCurrentProgram, useProgramStatus, useProgramTree } from '../hooks/useProgram';
import type { LearningProgram } from '../types/program';

type MicroStatus = 'completed' | 'current' | 'locked';

function buildMicroStatusMap(program: LearningProgram | undefined, currentMicroConceptId: number | null) {
  const map = new Map<number, MicroStatus>();
  if (!program) {
    return map;
  }

  const backendHasStatuses = program.concepts.some((concept) =>
    concept.microConcepts.some((micro) => micro.completed || micro.current || micro.locked),
  );
  if (backendHasStatuses) {
    program.concepts.forEach((concept) => {
      concept.microConcepts.forEach((micro) => {
        if (micro.microConceptId === null) return;
        if (micro.completed) map.set(micro.microConceptId, 'completed');
        else if (micro.current) map.set(micro.microConceptId, 'current');
        else map.set(micro.microConceptId, 'locked');
      });
    });
    return map;
  }

  if (currentMicroConceptId === null) {
    return map;
  }

  const orderedMicroIds = program.concepts
    .flatMap((concept) => concept.microConcepts)
    .map((microConcept) => microConcept.microConceptId)
    .filter((id): id is number => id !== null);

  const currentIndex = orderedMicroIds.indexOf(currentMicroConceptId);
  if (currentIndex < 0) {
    return map;
  }

  orderedMicroIds.forEach((id, index) => {
    if (index < currentIndex) {
      map.set(id, 'completed');
      return;
    }
    if (index === currentIndex) {
      map.set(id, 'current');
      return;
    }
    map.set(id, 'locked');
  });

  return map;
}

function conceptSymbol(statuses: MicroStatus[]): string {
  if (!statuses.length) return '[ ]';
  if (statuses.every((status) => status === 'completed')) return '[#]';
  if (statuses.some((status) => status === 'current' || status === 'completed')) return '[>]';
  return '[ ]';
}

function microSymbol(status: MicroStatus | undefined): string {
  if (status === 'completed') return '[#]';
  if (status === 'current') return '[>]';
  return '[ ]';
}

function buildRoadmapItems(program: LearningProgram | undefined) {
  if (!program) {
    return [];
  }

  return program.concepts.flatMap((concept) =>
    concept.microConcepts.map((microConcept) => ({
      id: microConcept.microConceptId,
      conceptTitle: concept.title,
      microTitle: microConcept.title,
    })),
  );
}

function formatHours(minutes: number): string {
  const hours = minutes / 60;
  const value = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `${value} ч`;
}

export function ProgramsPage() {
  const [activeGoalId, setActiveGoalId] = useState(() => {
    const raw = localStorage.getItem('active-goal-id');
    if (!raw) return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  });

  const goalsQuery = useGoals();
  const goalQuery = useGoal(activeGoalId);
  const goalProgramQuery = useGoalProgram(activeGoalId);
  const selectedProgramId = useMemo(() => {
    const programId = Number(goalProgramQuery.data?.programId ?? 0);
    return Number.isFinite(programId) && programId > 0 ? programId : 0;
  }, [goalProgramQuery.data?.programId]);

  const programTreeQuery = useProgramTree(selectedProgramId);
  const learningStateQuery = useLearningState();
  const currentProgramQuery = useCurrentProgram();
  const programQuery = selectedProgramId > 0 ? programTreeQuery : currentProgramQuery;
  const hasProgramData = Boolean(programQuery.data ?? currentProgramQuery.data);
  const programStatusQuery = useProgramStatus(selectedProgramId, !hasProgramData);

  const state = learningStateQuery.data;
  const program = programQuery.data ?? currentProgramQuery.data;
  const programForView = program ?? undefined;
  const programStatus = programStatusQuery.data?.status;
  const hasProgramDataForView = Boolean(program);

  const isLoading = !hasProgramDataForView && (
    learningStateQuery.isLoading ||
    programQuery.isLoading ||
    goalProgramQuery.isLoading ||
    (selectedProgramId > 0 && programStatusQuery.isLoading)
  );
  const error = hasProgramDataForView
    ? null
    : goalsQuery.error ?? learningStateQuery.error ?? programQuery.error ?? goalProgramQuery.error ?? programStatusQuery.error;

  useEffect(() => {
    if (activeGoalId <= 0) return;
    if (goalQuery.isSuccess && goalQuery.data === null) {
      localStorage.removeItem('active-goal-id');
      setActiveGoalId(0);
    }
  }, [activeGoalId, goalQuery.data, goalQuery.isSuccess]);

  useEffect(() => {
    if (activeGoalId > 0) return;
    const firstGoalId = goalsQuery.data?.[0]?.id ?? 0;
    if (firstGoalId <= 0) return;
    localStorage.setItem('active-goal-id', String(firstGoalId));
    setActiveGoalId(firstGoalId);
  }, [activeGoalId, goalsQuery.data]);

  const selectableGoals = goalsQuery.data ?? [];
  const selectedGoalTitle = selectableGoals.find((goal) => goal.id === activeGoalId)?.title ?? '';
  const microStatusMap = buildMicroStatusMap(programForView, state?.context.microConceptId ?? null);
  const roadmapItems = buildRoadmapItems(programForView);
  const totalConcepts = program?.progress.totalConcepts ?? 0;
  const totalMicroConcepts = program?.progress.totalMicroConcepts ?? 0;
  const completedMicroConcepts = program
    ? program.concepts.flatMap((concept) => concept.microConcepts).filter((micro) => micro.completed).length
    : 0;
  const completedConcepts = program
    ? program.concepts.filter(
        (concept) => concept.microConcepts.length > 0 && concept.microConcepts.every((micro) => micro.completed),
      ).length
    : 0;
  const completionPercent =
    totalMicroConcepts > 0 ? Math.round((completedMicroConcepts / totalMicroConcepts) * 100) : 0;
  const totalEstimatedMinutes = program
    ? program.concepts.reduce((sum, concept) => sum + Math.max(0, concept.estimatedTimeMinutes), 0)
    : 0;
  const remainingMinutes = Math.max(
    0,
    totalEstimatedMinutes - Math.round((totalEstimatedMinutes * completionPercent) / 100),
  );

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Программы"
        subtitle="Цель -> Программа -> Концепты -> Микроконцепты"
        actions={
          <StatusChip
            label={programStatus ?? state?.currentActivity.type ?? 'БЕЗ_СЕССИИ'}
            tone={programStatus === 'FAILED' ? 'error' : programStatus === 'READY' ? 'success' : state ? 'info' : 'default'}
          />
        }
      />

      {isLoading ? <LoadingState message="Загрузка программы..." /> : null}
      {error ? <ErrorState message={error instanceof Error ? error.message : 'Непредвиденная ошибка'} /> : null}
      {!isLoading && !error && (programStatus === 'CREATED' || programStatus === 'GENERATING') ? (
        <LoadingState message="Генерация..." />
      ) : null}
      {!isLoading && !error && programStatus === 'FAILED' ? (
        <ErrorState message="Не удалось сгенерировать программу." />
      ) : null}

      <SectionCard title="Program selection">
        {!selectableGoals.length ? (
          <EmptyState message="No goals found yet." />
        ) : (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {selectableGoals.map((goal) => (
              <Button
                key={goal.id}
                size="small"
                variant={goal.id === activeGoalId ? 'contained' : 'outlined'}
                onClick={() => {
                  localStorage.setItem('active-goal-id', String(goal.id));
                  setActiveGoalId(goal.id);
                }}
              >
                {goal.title || `Goal ${goal.id}`}
              </Button>
            ))}
          </Stack>
        )}
        {selectedGoalTitle ? (
          <Typography variant="caption" color="text.secondary">
            {`Current goal: ${selectedGoalTitle}`}
          </Typography>
        ) : null}
      </SectionCard>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionCard title="Обзор программы">
            {!program ? (
              <EmptyState message="Программа пока недоступна." />
            ) : (
              <Stack spacing={2}>
                <InfoCard label="Цель" value={program.goalTitle || 'Не указана'} />
                <InfoCard label="Программа" value={program.title || 'Без названия'} />

                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">Дерево концептов</Typography>
                  <List dense disablePadding>
                    {program.concepts.map((concept) => {
                      const conceptStatuses = concept.microConcepts
                        .map((microConcept) =>
                          microConcept.microConceptId === null
                            ? undefined
                            : microStatusMap.get(microConcept.microConceptId),
                        )
                        .map((status) => status ?? 'locked');

                      return (
                        <Stack key={concept.conceptId ?? concept.title} spacing={0.25}>
                          <ListItem disableGutters dense>
                            <ListItemText
                              primary={
                                concept.conceptId !== null ? (
                                  <Typography
                                    component={RouterLink}
                                    to={`/programs/concepts/${concept.conceptId}`}
                                    variant="body1"
                                    sx={{
                                      fontWeight: 500,
                                      textDecoration: 'none',
                                      color: 'primary.main',
                                      '&:hover': { textDecoration: 'underline' },
                                    }}
                                  >
                                    {`${conceptSymbol(conceptStatuses)} ${concept.title}`}
                                  </Typography>
                                ) : (
                                  `${conceptSymbol(conceptStatuses)} ${concept.title}`
                                )
                              }
                            />
                          </ListItem>

                          {concept.microConcepts.map((microConcept) => (
                            <ListItem
                              key={microConcept.microConceptId ?? `${concept.conceptId}-${microConcept.title}`}
                              disableGutters
                              dense
                              sx={{ pl: 3 }}
                            >
                              <ListItemText
                                primary={`${microSymbol(
                                  microConcept.microConceptId === null
                                    ? undefined
                                    : microStatusMap.get(microConcept.microConceptId),
                                )} ${microConcept.title}`}
                              />
                            </ListItem>
                          ))}
                        </Stack>
                      );
                    })}
                  </List>
                </Stack>

                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">Маршрут</Typography>
                  {roadmapItems.length ? (
                    <List dense disablePadding>
                      {roadmapItems.map((item, index) => (
                        <Stack key={item.id ?? `${item.conceptTitle}-${item.microTitle}-${index}`} spacing={0}>
                          <ListItem disableGutters dense>
                            <ListItemText
                              primary={
                                <Typography variant="body2">
                                  {`${microSymbol(item.id === null ? undefined : microStatusMap.get(item.id))} ${item.microTitle}`}
                                </Typography>
                              }
                              secondary={<Typography variant="caption">{item.conceptTitle}</Typography>}
                            />
                          </ListItem>
                          {index < roadmapItems.length - 1 ? (
                            <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                              v
                            </Typography>
                          ) : null}
                        </Stack>
                      ))}
                    </List>
                  ) : (
                    <EmptyState message="Маршрут появится, когда будут доступны шаги программы." />
                  )}
                </Stack>
              </Stack>
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <SectionCard title="Статистика программы">
              <Stack spacing={1}>
                <InfoCard label="Концепты" value={`${completedConcepts} / ${totalConcepts}`} />
                <InfoCard label="Микроконцепты" value={`${completedMicroConcepts} / ${totalMicroConcepts}`} />
                <InfoCard label="Оценка завершения" value={`${completionPercent}%`} />
                <InfoCard label="Оценка оставшегося времени" value={formatHours(remainingMinutes)} />
              </Stack>
            </SectionCard>

            <SectionCard title="Текущая позиция">
              {state ? (
                <Stack spacing={1}>
                  <InfoCard label="Текущая тема" value={state.context.topicName ?? 'Не начато'} />
                  <InfoCard label="Текущий концепт" value={state.context.conceptName ?? 'Не начато'} />
                  <InfoCard label="Текущий микроконцепт" value={state.context.microConceptName ?? 'Не начато'} />
                </Stack>
              ) : (
                <EmptyState message="Активная позиция в программе пока отсутствует." />
              )}
            </SectionCard>

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
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
