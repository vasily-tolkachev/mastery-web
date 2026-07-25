import { Alert, Box, Breadcrumbs, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNodeGeneratorProjects } from '../api/nodeGeneratorApi';
import { LoadingState, SectionCard } from '../components/ui';
import type { NodeGeneratorProject } from '../types/nodeGenerator';

export function TextRuntimeProjectsPage() {
  const [projects, setProjects] = useState<NodeGeneratorProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loaded = await getNodeGeneratorProjects();
        if (cancelled) return;
        setProjects(loaded);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Не удалось загрузить квесты');
      } finally {
        if (cancelled) return;
        setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <LoadingState message="Загрузка квестов..." />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Stack spacing={2}>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography color="text.primary">Текстовый режим</Typography>
      </Breadcrumbs>

      <SectionCard title="Выберите квест">
        <Stack spacing={1}>
          {(projects ?? []).length === 0 ? (
            <Typography variant="body2" color="text.secondary">Нет квестов.</Typography>
          ) : null}
          {(projects ?? []).map((project) => (
            <Box
              key={project.id}
              component={Link}
              to={`/node-generator/projects/${project.id}/runtime`}
              sx={{
                display: 'block',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.25,
                textDecoration: 'none',
                color: 'text.primary',
              }}
            >
              <Typography variant="body1">{project.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Сцен: {project.workspace?.nodes?.length ?? 0}
              </Typography>
            </Box>
          ))}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
