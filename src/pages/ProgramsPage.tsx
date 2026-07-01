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
import { useCurrentProgram } from '../hooks/useProgram';
import type { LearningProgram } from '../types/program';

const DEFAULT_USER_ID = 'demo-user';

type MicroStatus = 'completed' | 'current' | 'locked';

function buildMicroStatusMap(program: LearningProgram | undefined, currentMicroConceptId: number | null) {
  const map = new Map<number, MicroStatus>();
  if (!program || currentMicroConceptId === null) {
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

export function ProgramsPage() {
  const learningStateQuery = useLearningState(DEFAULT_USER_ID);
  const programQuery = useCurrentProgram(DEFAULT_USER_ID);

  const state = learningStateQuery.data;
  const program = programQuery.data;

  const isLoading = learningStateQuery.isLoading || programQuery.isLoading;
  const error = learningStateQuery.error ?? programQuery.error;
  const microStatusMap = buildMicroStatusMap(program, state?.context.microConceptId ?? null);
  const roadmapItems = buildRoadmapItems(program);

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Programs"
        subtitle="Goal -> Program -> Concepts -> MicroConcepts"
        actions={<StatusChip label={state?.currentActivity.type ?? 'NO_SESSION'} tone={state ? 'info' : 'default'} />}
      />

      {isLoading ? <LoadingState message="Loading program..." /> : null}
      {error ? <ErrorState message={error instanceof Error ? error.message : 'Unexpected error'} /> : null}

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
                              primary={`${conceptSymbol(conceptStatuses)} ${concept.title}`}
                              primaryTypographyProps={{ variant: 'body1' }}
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
                                primaryTypographyProps={{ variant: 'body2' }}
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
                              primary={`${microSymbol(item.id === null ? undefined : microStatusMap.get(item.id))} ${item.microTitle}`}
                              secondary={item.conceptTitle}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                          {index < roadmapItems.length - 1 ? (
                            <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                              |
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
