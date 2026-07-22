import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  acceptWorkspaceExpansionSuggestion,
  dismissWorkspaceExpansionSuggestion,
  getNodeGeneratorProject,
  runWorkspaceExpansion,
} from '../api/nodeGeneratorApi';
import { LoadingState, SectionCard } from '../components/ui';
import type { NodeGeneratorProject } from '../types/nodeGenerator';

export function NodeGeneratorExpansionReviewPage() {
  const { projectId = '' } = useParams();
  const [project, setProject] = useState<NodeGeneratorProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setProject(await getNodeGeneratorProject(projectId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить ревью');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [projectId]);

  if (loading) return <LoadingState message="Загрузка ревью..." />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!project) return <Alert severity="error">Проект не найден</Alert>;

  const suggestions = (project.workspace?.expansionSuggestions ?? []).filter((item) => item.status.toUpperCase() === 'PENDING');

  return (
    <Stack spacing={2}>
      <Button component={Link} to={`/node-generator/projects/${project.id}`} sx={{ alignSelf: 'flex-start' }}>
        ← {project.name}
      </Button>

      <SectionCard title="Обновление действий">
        <Stack spacing={1}>
          <Typography variant="body2">После последних изменений появились новые знания.</Typography>
          <Typography variant="body2">Необходимо проверить изменения в сценах.</Typography>
          <Button
            variant="contained"
            onClick={async () => {
              const updated = await runWorkspaceExpansion(project.id, project.workspace?.globalKnowledge ?? []);
              setProject(updated);
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
                    setProject(updated);
                  }}
                >
                  Принять
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={async () => {
                    const updated = await dismissWorkspaceExpansionSuggestion(project.id, item.id);
                    setProject(updated);
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
