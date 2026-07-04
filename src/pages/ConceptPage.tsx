import { Grid, Stack } from '@mui/material';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState, ErrorState, InfoCard, LoadingState, PageHeader, SectionCard } from '../components/ui';
import { useCurrentProgram } from '../hooks/useProgram';

export function ConceptPage() {
  const params = useParams<{ conceptId: string }>();
  const conceptId = params.conceptId ? Number(params.conceptId) : null;
  const programQuery = useCurrentProgram();

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

  return (
    <Stack spacing={2}>
      <PageHeader
        title={concept?.title ?? 'Concept'}
        subtitle={`${programQuery.data?.title ?? 'Program'} -> ${concept?.title ?? 'Unknown concept'}`}
      />

      {programQuery.isLoading ? <LoadingState message="Loading concept..." /> : null}
      {programQuery.error ? (
        <ErrorState message={programQuery.error instanceof Error ? programQuery.error.message : 'Unexpected error'} />
      ) : null}

      {!programQuery.isLoading && !programQuery.error && !concept ? (
        <EmptyState message="Concept was not found in the current program." />
      ) : null}

      {concept ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={2}>
              <SectionCard title="Description">
                <InfoCard label="Summary" value={concept.description || 'No description yet.'} />
                <InfoCard label="Difficulty" value={concept.difficulty || 'Unknown'} />
                <InfoCard
                  label="Estimated time"
                  value={`${Math.max(0, concept.estimatedTimeMinutes)} min`}
                />
              </SectionCard>

              <SectionCard title="MicroConcepts">
                <Stack spacing={1}>
                  {concept.microConcepts.map((micro, index) => (
                    <InfoCard key={micro.microConceptId ?? `${micro.title}-${index}`} label={`Step ${index + 1}`} value={micro.title} />
                  ))}
                </Stack>
              </SectionCard>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={2}>
              <SectionCard title="Progress">
                <InfoCard label="MicroConcepts" value={`${completedMicro} / ${totalMicro}`} />
              </SectionCard>

              <SectionCard title="Prerequisites">
                {(concept.prerequisites.length ? concept.prerequisites : prerequisites).length ? (
                  <Stack spacing={1}>
                    {(concept.prerequisites.length ? concept.prerequisites : prerequisites).map((title) => (
                      <InfoCard key={title} label="Required" value={title} />
                    ))}
                  </Stack>
                ) : (
                  <EmptyState message="No prerequisites for this concept." />
                )}
              </SectionCard>
            </Stack>
          </Grid>
        </Grid>
      ) : null}
    </Stack>
  );
}
