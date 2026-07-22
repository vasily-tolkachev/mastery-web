import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  addWorkspaceNodeAction,
  createNextWorkspaceNode,
  createWorkspaceNode,
  deleteWorkspaceNode,
  getNodeGeneratorProject,
  updateWorkspaceNodeDescription,
} from '../api/nodeGeneratorApi';
import { LoadingState, SectionCard } from '../components/ui';
import type { NodeGeneratorProject, WorkspaceNode } from '../types/nodeGenerator';

export function NodeGeneratorScenePage() {
  const navigate = useNavigate();
  const { projectId = '', sceneId = '' } = useParams();
  const [project, setProject] = useState<NodeGeneratorProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionDescriptionDraft, setActionDescriptionDraft] = useState('');
  const [stateDescriptionDraft, setStateDescriptionDraft] = useState('');
  const [actionDraft, setActionDraft] = useState('');

  const currentScene = useMemo(
    () => project?.workspace?.nodes.find((node) => node.id.toUpperCase() === sceneId.toUpperCase()) ?? null,
    [project, sceneId],
  );

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const loaded = await getNodeGeneratorProject(projectId);
      setProject(loaded);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить сцену');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [projectId]);

  useEffect(() => {
    setActionDescriptionDraft(currentScene?.actionDescription ?? '');
    setStateDescriptionDraft(currentScene?.stateDescription ?? '');
  }, [currentScene?.id, currentScene?.actionDescription, currentScene?.stateDescription]);

  const setUpdatedProject = (updated: NodeGeneratorProject) => setProject(updated);

  const handleCreateScene = async () => {
    if (!project) return;
    setUpdatedProject(await createWorkspaceNode(project.id));
  };

  const handleSaveDescription = async () => {
    if (!project || !currentScene) return;
    setUpdatedProject(await updateWorkspaceNodeDescription(project.id, currentScene.id, actionDescriptionDraft, stateDescriptionDraft));
  };

  const handleAddAction = async () => {
    if (!project || !currentScene || !actionDraft.trim()) return;
    const updated = await addWorkspaceNodeAction(project.id, currentScene.id, actionDraft);
    setActionDraft('');
    setUpdatedProject(updated);
  };

  const handleDeleteScene = async () => {
    if (!project || !currentScene) return;
    setUpdatedProject(await deleteWorkspaceNode(project.id, currentScene.id));
  };

  const handleCreateNext = async (actionId: string) => {
    if (!project || !currentScene) return;
    setUpdatedProject(await createNextWorkspaceNode(project.id, currentScene.id, actionId));
  };

  if (loading) return <LoadingState message="Загрузка сцены..." />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!project) return <Alert severity="error">Проект не найден</Alert>;

  const nodes = project.workspace?.nodes ?? [];
  const scene: WorkspaceNode | null = currentScene ?? nodes[0] ?? null;

  if (!scene) {
    return (
      <Stack spacing={2}>
        <Button component={Link} to={`/node-generator/projects/${project.id}`} sx={{ alignSelf: 'flex-start' }}>← {project.name}</Button>
        <SectionCard title="Сцены">
          <Typography variant="body2" color="text.secondary">Сцен пока нет.</Typography>
          <Button variant="contained" onClick={() => void handleCreateScene()} sx={{ mt: 1 }}>Создать первую сцену</Button>
        </SectionCard>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Все квесты / {project.name} / Сцена {scene.id}
      </Typography>
      <Button component={Link} to={`/node-generator/projects/${project.id}`} sx={{ alignSelf: 'flex-start' }}>← {project.name}</Button>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <SectionCard title="Дерево сцен">
          <Stack spacing={0.75} sx={{ minWidth: { md: 260 } }}>
            {nodes.map((node) => (
              <Box
                key={node.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(node.id)}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    navigate(`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(node.id)}`);
                  }
                }}
                sx={{
                  border: 1,
                  borderColor: node.id === scene.id ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  p: 1,
                  cursor: 'pointer',
                }}
              >
                <Typography variant="body2">{node.id}</Typography>
              </Box>
            ))}
          </Stack>
        </SectionCard>

        <Stack spacing={2} sx={{ flex: 1 }}>
          <SectionCard title={`Сцена ${scene.id}`}>
            <Stack spacing={1}>
              <TextField
                label="Описание действия"
                value={actionDescriptionDraft}
                onChange={(e) => setActionDescriptionDraft(e.target.value)}
                multiline
                minRows={3}
              />
              <TextField
                label="Описание состояния"
                value={stateDescriptionDraft}
                onChange={(e) => setStateDescriptionDraft(e.target.value)}
                multiline
                minRows={4}
              />
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                <Button variant="contained" onClick={() => void handleSaveDescription()}>Сохранить описание</Button>
                <Button variant="outlined" component={Link} to={`/node-generator/projects/${project.id}/scenes/${scene.id}/generate`}>
                  Продолжить создание
                </Button>
                <Button variant="outlined" color="error" onClick={() => void handleDeleteScene()}>Удалить сцену</Button>
              </Stack>
            </Stack>
          </SectionCard>

          <SectionCard title="Действия">
            <Stack spacing={1}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                <TextField label="Новое действие" size="small" value={actionDraft} onChange={(e) => setActionDraft(e.target.value)} fullWidth />
                <Button variant="contained" onClick={() => void handleAddAction()} disabled={!actionDraft.trim()}>Добавить</Button>
              </Stack>
              {(scene.actions ?? []).map((action) => (
                <Box key={action.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
                  <Typography variant="body2">{action.text}</Typography>
                  <Button size="small" sx={{ mt: 0.5 }} onClick={() => void handleCreateNext(action.id)}>Создать следующую сцену</Button>
                </Box>
              ))}
            </Stack>
          </SectionCard>
        </Stack>
      </Stack>
    </Stack>
  );
}
