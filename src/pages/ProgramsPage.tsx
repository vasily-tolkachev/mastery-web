import { Grid, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
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
import { useGoalProgram } from '../hooks/useGoals';
import { useCurrentProgram, useProgramStatus, useProgramTree } from '../hooks/useProgram';
import type { LearningProgram } from '../types/program';

const DEFAULT_USER_ID = 'demo-user';

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
  return `${value} hours`;
}

export function ProgramsPage() {
  const activeGoalId = useMemo(() => {
    const raw = localStorage.getItem('active-goal-id');
    if (!raw) return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, []);

  const goalProgramQuery = useGoalProgram(activeGoalId);
  const selectedProgramId = useMemo(() => {
    const programId = Number(goalProgramQuery.data?.programId ?? 0);
    return Number.isFinite(programId) && programId > 0 ? programId : 0;
  }, [goalProgramQuery.data?.programId]);

  const programStatusQuery = useProgramStatus(selectedProgramId);
  const programTreeQuery = useProgramTree(selectedProgramId);
  const learningStateQuery = useLearningState(DEFAULT_USER_ID);
  const currentProgramQuery = useCurrentProgram(DEFAULT_USER_ID);
  const programQuery = programTreeQuery.data ? programTreeQuery : currentProgramQuery;

  const state = learningStateQuery.data;
  const program = programQuery.data;
  const programStatus = programStatusQuery.data?.status;

  const isLoading =
    learningStateQuery.isLoading ||
    programQuery.isLoading ||
    goalProgramQuery.isLoading ||
    (selectedProgramId > 0 && programStatusQuery.isLoading);
  const error = learningStateQuery.error ?? programQuery.error ?? goalProgramQuery.error ?? programStatusQuery.error;
  const microStatusMap = buildMicroStatusMap(program, state?.context.microConceptId ?? null);
  const roadmapItems = buildRoadmapItems(program);
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
        title="Programs"
        subtitle="Goal -> Program -> Concepts -> MicroConcepts"
        actions={
          <StatusChip
            label={programStatus ?? state?.currentActivity.type ?? 'NO_SESSION'}
            tone={programStatus === 'FAILED' ? 'error' : programStatus === 'READY' ? 'success' : state ? 'info' : 'default'}
          />
        }
      />

      {isLoading ? <LoadingState message="Loading program..." /> : null}
      {error ? <ErrorState message={error instanceof Error ? error.message : 'Unexpected error'} /> : null}
      {!isLoading && !error && (programStatus === 'CREATED' || programStatus === 'GENERATING') ? (
        <LoadingState message="Generating..." />
      ) : null}
      {!isLoading && !error && programStatus === 'FAILED' ? (
        <ErrorState message="Program generation failed." />
      ) : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionCard title="Program Overview">
            {!program ? (
              <EmptyState message="Program is not available yet." />
            ) : (
              <Stack spacing={2}>
                <InfoCard label="Goal" value={program.goalTitle || 'Not specified'} />
                <InfoCard label="Program" value={program.title || 'Untitled program'} />

                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">Concept Tree</Typography>
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
                  <Typography variant="subtitle2">Roadmap</Typography>
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
                    <EmptyState message="Roadmap will appear when program steps are available." />
                  )}
                </Stack>
              </Stack>
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <SectionCard title="Program Statistics">
              <Stack spacing={1}>
                <InfoCard label="Concepts" value={`${completedConcepts} / ${totalConcepts}`} />
                <InfoCard label="Micro Concepts" value={`${completedMicroConcepts} / ${totalMicroConcepts}`} />
                <InfoCard label="Estimated completion" value={`${completionPercent}%`} />
                <InfoCard label="Estimated remaining time" value={formatHours(remainingMinutes)} />
              </Stack>
            </SectionCard>

            <SectionCard title="Current Position">
              {state ? (
                <Stack spacing={1}>
                  <InfoCard label="Current Topic" value={state.context.topicName ?? 'Not started'} />
                  <InfoCard label="Current Concept" value={state.context.conceptName ?? 'Not started'} />
                  <InfoCard label="Current MicroConcept" value={state.context.microConceptName ?? 'Not started'} />
                </Stack>
              ) : (
                <EmptyState message="No active program position yet." />
              )}
            </SectionCard>

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
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
