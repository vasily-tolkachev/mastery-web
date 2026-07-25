import { Alert, Box, Breadcrumbs, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { LoadingState, SectionCard } from '../components/ui';
import { useNodeGeneratorProjects } from '../hooks/useNodeGeneratorProjects';

export function TextRuntimeProjectsPage() {
  const { data: projects, isLoading, isError, error } = useNodeGeneratorProjects();

  if (isLoading) return <LoadingState message="Загрузка квестов..." />;
  if (isError) return <Alert severity="error">{error instanceof Error ? error.message : 'Не удалось загрузить квесты'}</Alert>;

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

