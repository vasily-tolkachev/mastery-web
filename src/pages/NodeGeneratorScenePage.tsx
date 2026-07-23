import { Alert, Box, Breadcrumbs, Button, Link as MuiLink, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  addWorkspaceNodeAction,
  createWorkspaceNode,
  deleteWorkspaceNode,
  generateWorkspaceNodeDescription,
  updateWorkspaceNodeDescription,
} from '../api/nodeGeneratorApi';
import { LoadingState, SectionCard } from '../components/ui';
import { useNodeGeneratorProject, useSetNodeGeneratorProjectCache } from '../hooks/useNodeGeneratorProject';
import type { WorkspaceNode } from '../types/nodeGenerator';

export function NodeGeneratorScenePage() {
  const navigate = useNavigate();
  const { projectId = '', sceneId = '' } = useParams();
  const { data: project, isLoading, isError, error } = useNodeGeneratorProject(projectId);
  const setProjectCache = useSetNodeGeneratorProjectCache();
  const [actionDescriptionDraft, setActionDescriptionDraft] = useState('');
  const [stateDescriptionDraft, setStateDescriptionDraft] = useState('');
  const [actionDraft, setActionDraft] = useState('');

  const currentScene = useMemo(
    () => project?.workspace?.nodes.find((node) => node.id.toUpperCase() === sceneId.toUpperCase()) ?? null,
    [project, sceneId],
  );

  useEffect(() => {
    setActionDescriptionDraft(currentScene?.actionDescription ?? '');
    setStateDescriptionDraft(currentScene?.stateDescription ?? '');
  }, [currentScene?.id, currentScene?.actionDescription, currentScene?.stateDescription]);

  const setUpdatedProject = (updated: Awaited<ReturnType<typeof createWorkspaceNode>>) => {
    setProjectCache(updated);
  };

  const handleCreateScene = async () => {
    if (!project) return;
    const created = await createWorkspaceNode(project.id);
    const newNodeId = findNewNodeId(project.workspace?.nodes ?? [], created.workspace?.nodes ?? []);
    if (!newNodeId) {
      setUpdatedProject(created);
      return;
    }
    const generated = await generateWorkspaceNodeDescription(project.id, newNodeId);
    const generatedNode = findNodeById(generated.workspace?.nodes ?? [], newNodeId);
    if (!generatedNode) {
      setUpdatedProject(generated);
      navigate(`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(newNodeId)}`);
      return;
    }
    const actionText = generatedNode.generatedActionDescriptionDraft?.trim() || generatedNode.actionDescription || '';
    const stateText = generatedNode.generatedStateDescriptionDraft?.trim() || generatedNode.stateDescription || '';
    const accepted = await updateWorkspaceNodeDescription(project.id, newNodeId, actionText, stateText);
    setUpdatedProject(accepted);
    navigate(`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(newNodeId)}`);
  };

  const handleSaveDescription = async () => {
    if (!project || !currentScene) return;
    setUpdatedProject(await updateWorkspaceNodeDescription(project.id, currentScene.id, actionDescriptionDraft, stateDescriptionDraft));
  };

  const handleAddAction = async (text?: string) => {
    if (!project || !currentScene) return;
    const value = (text ?? actionDraft).trim();
    if (!value) return;
    const updated = await addWorkspaceNodeAction(project.id, currentScene.id, value);
    setActionDraft('');
    setUpdatedProject(updated);
  };

  const handleDeleteScene = async () => {
    if (!project || !currentScene) return;
    setUpdatedProject(await deleteWorkspaceNode(project.id, currentScene.id));
  };

  const handleCreateNext = async (actionId: string) => {
    if (!project || !currentScene) return;
    navigate(`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(currentScene.id)}/actions/${encodeURIComponent(actionId)}/new-scene-description`);
  };

  if (isLoading) return <LoadingState message="Загрузка сцены..." />;
  if (isError) return <Alert severity="error">{error instanceof Error ? error.message : 'Не удалось загрузить сцену'}</Alert>;
  if (!project) return <Alert severity="error">Проект не найден</Alert>;

  const nodes = project.workspace?.nodes ?? [];
  const scene: WorkspaceNode | null = currentScene ?? nodes[0] ?? null;

  if (!scene) {
    return (
      <Stack spacing={2}>
        <Breadcrumbs aria-label="breadcrumb">
          <MuiLink component={Link} to="/node-generator" underline="hover" color="inherit">
            Все квесты
          </MuiLink>
          <MuiLink component={Link} to={`/node-generator/projects/${project.id}`} underline="hover" color="inherit">
            {project.name}
          </MuiLink>
          <Typography color="text.primary">Сцены</Typography>
        </Breadcrumbs>
        <SectionCard title="Сцены">
          <Typography variant="body2" color="text.secondary">Сцен пока нет.</Typography>
          <Button variant="contained" onClick={() => void handleCreateScene()} sx={{ mt: 1 }}>Создать первую сцену</Button>
        </SectionCard>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Breadcrumbs aria-label="breadcrumb">
        <MuiLink component={Link} to="/node-generator" underline="hover" color="inherit">
          Все квесты
        </MuiLink>
        <MuiLink component={Link} to={`/node-generator/projects/${project.id}`} underline="hover" color="inherit">
          {project.name}
        </MuiLink>
        <Typography color="text.primary">Сцена {scene.id}</Typography>
      </Breadcrumbs>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <SectionCard title="Граф сцен">
          <SceneTreeList
            nodes={nodes}
            selectedSceneId={scene.id}
            onSelectScene={(nodeId) => navigate(`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(nodeId)}`)}
          />
        </SectionCard>

        <Stack spacing={2} sx={{ flex: 1 }}>
          <SectionCard title={`Сцена ${scene.id}`}>
            <Stack spacing={1}>
              <TextField label="Описание действия" value={actionDescriptionDraft} onChange={(e) => setActionDescriptionDraft(e.target.value)} multiline minRows={3} />
              <TextField label="Описание состояния" value={stateDescriptionDraft} onChange={(e) => setStateDescriptionDraft(e.target.value)} multiline minRows={4} />
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                <Button variant="contained" onClick={() => void handleSaveDescription()}>Сохранить описание</Button>
                <Button variant="outlined" component={Link} to={`/node-generator/projects/${project.id}/scenes/${scene.id}/edit`}>
                  Редактирование
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
              <Typography variant="body2" color="text.secondary">Сгенерированные варианты</Typography>
              {(scene.generatedActionsDraft ?? []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">Сохранённых вариантов пока нет.</Typography>
              ) : null}
              {(scene.generatedActionsDraft ?? []).map((suggestedAction, index) => (
                <Box key={`${index}-${suggestedAction}`} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ alignItems: { md: 'center' } }}>
                    <Typography variant="body2" sx={{ flex: 1 }}>{suggestedAction}</Typography>
                    <Button size="small" variant="outlined" onClick={() => void handleAddAction(suggestedAction)}>
                      Добавить
                    </Button>
                  </Stack>
                </Box>
              ))}
              <Typography variant="body2" color="text.secondary">Добавленные действия</Typography>
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

type SceneTreeListProps = {
  nodes: WorkspaceNode[];
  selectedSceneId: string;
  onSelectScene: (nodeId: string) => void;
};

function SceneTreeList({ nodes, selectedSceneId, onSelectScene }: SceneTreeListProps) {
  const byParent = new Map<string, WorkspaceNode[]>();
  const roots: WorkspaceNode[] = [];
  const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, boolean>>({});

  nodes.forEach((node) => {
    const parentId = (node.sourceNodeId ?? '').trim();
    if (!parentId) {
      roots.push(node);
      return;
    }
    const key = parentId.toUpperCase();
    const list = byParent.get(key) ?? [];
    list.push(node);
    byParent.set(key, list);
  });

  roots.sort((a, b) => a.id.localeCompare(b.id));
  byParent.forEach((list) => list.sort((a, b) => a.id.localeCompare(b.id)));

  useEffect(() => {
    const parentByNode = new Map<string, string>();
    nodes.forEach((node) => {
      if (node.sourceNodeId) parentByNode.set(node.id.toUpperCase(), node.sourceNodeId.toUpperCase());
    });
    const nextExpanded: Record<string, boolean> = {};
    let cursor = selectedSceneId.toUpperCase();
    while (parentByNode.has(cursor)) {
      const parentId = parentByNode.get(cursor);
      if (!parentId) break;
      nextExpanded[parentId] = true;
      cursor = parentId;
    }
    setExpandedNodeIds((prev) => ({ ...prev, ...nextExpanded }));
  }, [nodes, selectedSceneId]);

  const toggleExpanded = (nodeId: string) => {
    const key = nodeId.toUpperCase();
    setExpandedNodeIds((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderNode = (node: WorkspaceNode, level: number) => {
    const children = byParent.get(node.id.toUpperCase()) ?? [];
    const groupedByAction = new Map<string, WorkspaceNode[]>();
    children.forEach((child) => {
      const actionKey = (child.sourceActionId ?? 'NO_ACTION').toUpperCase();
      const list = groupedByAction.get(actionKey) ?? [];
      list.push(child);
      groupedByAction.set(actionKey, list);
    });
    const actionOrder = Array.from(groupedByAction.keys()).sort();

    return (
      <Box key={node.id} sx={{ ml: level * 1.25 }}>
        <Stack direction="row" spacing={0.5}>
          {children.length > 0 ? (
            <Button size="small" variant="text" onClick={() => toggleExpanded(node.id)} sx={{ minWidth: 28, px: 0.5, alignSelf: 'flex-start' }}>
              {expandedNodeIds[node.id.toUpperCase()] ? '−' : '+'}
            </Button>
          ) : (
            <Box sx={{ width: 28 }} />
          )}
          <Box
            role="button"
            tabIndex={0}
            onClick={() => onSelectScene(node.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') onSelectScene(node.id);
            }}
            sx={{
              border: 1,
              borderColor: selectedSceneId === node.id ? 'primary.main' : 'divider',
              borderRadius: 1,
              p: 1,
              cursor: 'pointer',
              flex: 1,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{node.id}</Typography>
            <Typography variant="caption" color="text.secondary">действий: {node.actions.length}</Typography>
          </Box>
        </Stack>
        {expandedNodeIds[node.id.toUpperCase()] ? actionOrder.map((actionId) => {
          const actionText = node.actions.find((action) => action.id.toUpperCase() === actionId)?.text ?? actionId;
          const groupedChildren = groupedByAction.get(actionId) ?? [];
          return (
            <Box key={`${node.id}-${actionId}`} sx={{ mt: 0.5, ml: 1 }}>
              <Typography variant="caption" color="text.secondary">из действия: {actionText}</Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {groupedChildren.map((child) => renderNode(child, level + 1))}
              </Stack>
            </Box>
          );
        }) : null}
      </Box>
    );
  };

  return <Stack spacing={0.75} sx={{ minWidth: { md: 260 } }}>{roots.map((root) => renderNode(root, 0))}</Stack>;
}

function findNewNodeId(previousNodes: WorkspaceNode[], nextNodes: WorkspaceNode[]): string | null {
  const previousIds = new Set(previousNodes.map((node) => node.id.toUpperCase()));
  const created = nextNodes.find((node) => !previousIds.has(node.id.toUpperCase()));
  return created?.id ?? null;
}

function findNodeById(nodes: WorkspaceNode[], nodeId: string): WorkspaceNode | null {
  return nodes.find((node) => node.id.toUpperCase() === nodeId.toUpperCase()) ?? null;
}
