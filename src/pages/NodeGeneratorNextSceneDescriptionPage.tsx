import { Alert, Box, Breadcrumbs, Button, Link as MuiLink, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createNextWorkspaceNode, generateNextSceneIdeas, type FirstSceneIdea, updateWorkspaceNodeDescription } from '../api/nodeGeneratorApi';
import { LoadingState, SectionCard } from '../components/ui';
import { useNodeGeneratorProject } from '../hooks/useNodeGeneratorProject';

export function NodeGeneratorNextSceneDescriptionPage() {
  const navigate = useNavigate();
  const { projectId = '', sceneId = '', actionId = '' } = useParams();
  const { data: project, isLoading, isError, error } = useNodeGeneratorProject(projectId);
  const [ideas, setIdeas] = useState<FirstSceneIdea[]>([]);
  const [descriptionText, setDescriptionText] = useState('');
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [creating, setCreating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadIdeas = async () => {
      if (!projectId || !sceneId || !actionId) return;
      try {
        setLoadingIdeas(true);
        setLocalError(null);
        const generated = await generateNextSceneIdeas(projectId, sceneId, actionId);
        if (cancelled) return;
        setIdeas(generated);
      } catch (e) {
        if (cancelled) return;
        setLocalError(e instanceof Error ? e.message : 'Не удалось сгенерировать варианты');
      } finally {
        if (cancelled) return;
        setLoadingIdeas(false);
      }
    };
    void loadIdeas();
    return () => {
      cancelled = true;
    };
  }, [projectId, sceneId, actionId]);

  const handleCreateScene = async () => {
    if (!projectId || !sceneId || !actionId || !descriptionText.trim()) return;
    try {
      setLocalError(null);
      setCreating(true);
      const updatedProject = await createNextWorkspaceNode(projectId, sceneId, actionId);
      const newNodeId = findNewNodeId(actionId, updatedProject.workspace?.nodes ?? []);
      if (!newNodeId) {
        throw new Error('Не удалось определить новую сцену');
      }
      await updateWorkspaceNodeDescription(projectId, newNodeId, descriptionText.trim(), descriptionText.trim());
      navigate(`/node-generator/projects/${projectId}/scenes/${encodeURIComponent(newNodeId)}/first-actions`);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Не удалось создать сцену');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) return <LoadingState message="Загрузка..." />;
  if (isError) return <Alert severity="error">{error instanceof Error ? error.message : 'Не удалось загрузить проект'}</Alert>;
  if (!project) return <Alert severity="error">Проект не найден</Alert>;

  return (
    <Stack spacing={2}>
      {localError ? <Alert severity="error">{localError}</Alert> : null}

      <Breadcrumbs aria-label="breadcrumb">
        <MuiLink component={Link} to="/node-generator" underline="hover" color="inherit">
          Все квесты
        </MuiLink>
        <MuiLink component={Link} to={`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(sceneId)}`} underline="hover" color="inherit">
          Сцена {sceneId}
        </MuiLink>
        <Typography color="text.primary">Новая сцена</Typography>
      </Breadcrumbs>

      <SectionCard title="Варианты описания следующей сцены (ИИ)">
        <Stack spacing={1}>
          {loadingIdeas ? <Typography variant="body2" color="text.secondary">Генерация вариантов...</Typography> : null}
          {!loadingIdeas && !ideas.length ? <Typography variant="body2" color="text.secondary">Пока нет вариантов.</Typography> : null}
          {ideas.map((idea, index) => (
            <Box
              key={`${index}-${idea.title}`}
              role="button"
              tabIndex={0}
              onClick={() => setDescriptionText(idea.scenarioText)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setDescriptionText(idea.scenarioText);
              }}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25, cursor: 'pointer' }}
            >
              <Typography variant="subtitle2">{idea.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {idea.scenarioText}
              </Typography>
            </Box>
          ))}
        </Stack>
      </SectionCard>

      <SectionCard title="Описание следующей сцены">
        <TextField
          label="Текст сцены"
          value={descriptionText}
          onChange={(e) => setDescriptionText(e.target.value)}
          multiline
          minRows={5}
          fullWidth
        />
      </SectionCard>

      <Button variant="contained" onClick={() => void handleCreateScene()} disabled={!descriptionText.trim() || creating}>
        Продолжить
      </Button>
    </Stack>
  );
}

function findNewNodeId(sourceActionId: string, nodes: { id: string; sourceActionId?: string | null }[]): string | null {
  const candidate = [...nodes].reverse().find((node) => node.sourceActionId?.toUpperCase() === sourceActionId.toUpperCase());
  return candidate?.id ?? null;
}
