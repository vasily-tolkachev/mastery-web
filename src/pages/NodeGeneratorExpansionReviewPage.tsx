import { Alert, Box, Breadcrumbs, Button, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import {
  acceptWorkspaceExpansionSuggestion,
  dismissWorkspaceExpansionSuggestion,
  runWorkspaceExpansion,
} from '../api/nodeGeneratorApi';
import { LoadingState, SectionCard } from '../components/ui';
import { useNodeGeneratorProject, useSetNodeGeneratorProjectCache } from '../hooks/useNodeGeneratorProject';

export function NodeGeneratorExpansionReviewPage() {
  const { projectId = '' } = useParams();
  const { data: project, isLoading, isError, error } = useNodeGeneratorProject(projectId);
  const setProjectCache = useSetNodeGeneratorProjectCache();

  if (isLoading) return <LoadingState message="Загрузка ревью..." />;
  if (isError) return <Alert severity="error">{error instanceof Error ? error.message : 'Не удалось загрузить ревью'}</Alert>;
  if (!project) return <Alert severity="error">Проект не найден</Alert>;

  const suggestions = (project.workspace?.expansionSuggestions ?? []).filter((item) => item.status.toUpperCase() === 'PENDING');

  return (
    <Stack spacing={2}>
      <Breadcrumbs aria-label="breadcrumb">
        <MuiLink component={Link} to="/node-generator" underline="hover" color="inherit">
          Все квесты
        </MuiLink>
        <MuiLink component={Link} to={`/node-generator/projects/${project.id}`} underline="hover" color="inherit">
          {project.name}
        </MuiLink>
        <Typography color="text.primary">Проверка изменений</Typography>
      </Breadcrumbs>

      <SectionCard title="Обновление действий">
        <Stack spacing={1}>
          <Typography variant="body2">После последних изменений появились новые знания.</Typography>
          <Typography variant="body2">Необходимо проверить изменения в сценах.</Typography>
          <Button
            variant="contained"
            onClick={async () => {
              const updated = await runWorkspaceExpansion(project.id, project.workspace?.globalKnowledge ?? []);
              setProjectCache(updated);
            }}
            sx={{ alignSelf: 'flex-start' }}
          >
            Начать проверку
          </Button>
        </Stack>
      </SectionCard>

      <SectionCard title="Предложения по новым действиям">
        <Stack spacing={1}>
          {suggestions.map((item) => (
            <Box key={item.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
              <Typography variant="subtitle2">Сцена {item.nodeId}</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>+ {item.actionText}</Typography>
              <Typography variant="caption" color="text.secondary">{item.reason}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={async () => {
                    const updated = await acceptWorkspaceExpansionSuggestion(project.id, item.id);
                    setProjectCache(updated);
                  }}
                >
                  Принять
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={async () => {
                    const updated = await dismissWorkspaceExpansionSuggestion(project.id, item.id);
                    setProjectCache(updated);
                  }}
                >
                  Отклонить
                </Button>
              </Stack>
            </Box>
          ))}
          {!suggestions.length ? <Typography variant="body2" color="text.secondary">Нет предложений для ревью.</Typography> : null}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
