import { Alert, Box, Breadcrumbs, Button, Link as MuiLink, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
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

  const currentScene = useMemo(
    () => project?.workspace?.nodes.find((node) => normalizeNodeId(node.id) === normalizeNodeId(sceneId)) ?? null,
    [project, sceneId],
  );
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

  const handleDeleteScene = async () => {
    if (!project || !currentScene) return;
    setUpdatedProject(await deleteWorkspaceNode(project.id, currentScene.id));
  };

  if (isLoading) return <LoadingState message="Загрузка сцены..." />;
  if (isError) return <Alert severity="error">{error instanceof Error ? error.message : 'Не удалось загрузить сцену'}</Alert>;
  if (!project) return <Alert severity="error">Проект не найден</Alert>;

  const nodes = project.workspace?.nodes ?? [];
  const scene: WorkspaceNode | null = currentScene ?? nodes[0] ?? null;
  const parentScene = useMemo(() => {
    if (!scene?.sourceNodeId) return null;
    return nodes.find((node) => normalizeNodeId(node.id) === normalizeNodeId(scene.sourceNodeId ?? '')) ?? null;
  }, [nodes, scene]);
  const actionTargets = useMemo(() => {
    const map = new Map<string, string>();
    if (!scene) return map;
    for (const node of nodes) {
      if (normalizeNodeId(node.sourceNodeId) !== normalizeNodeId(scene.id)) continue;
      const sourceActionId = (node.sourceActionId ?? '').trim();
      if (!sourceActionId) continue;
      map.set(sourceActionId.toUpperCase(), node.id);
    }
    return map;
  }, [nodes, scene]);

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
            <Stack spacing={1.25}>
              {parentScene ? (
                <MuiLink component={Link} to={`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(parentScene.id)}`} underline="hover">
                  ← Сцена {parentScene.id}
                </MuiLink>
              ) : null}
              <Box sx={{ borderTop: 1, borderColor: 'divider' }} />
              <Typography variant="subtitle2">Описание</Typography>
              <Typography variant="body2">{(scene.stateDescription || scene.actionDescription || '...').trim() || '...'}</Typography>
              <Box sx={{ borderTop: 1, borderColor: 'divider' }} />
              <Typography variant="subtitle2">Действия</Typography>
              <Stack spacing={0.75}>
                {normalizeActions(scene).length === 0 ? <Typography variant="body2" color="text.secondary">Нет действий.</Typography> : null}
                {normalizeActions(scene).map((action) => {
                  const targetNodeId = actionTargets.get(action.id.toUpperCase());
                  return (
                    <Stack key={action.id} direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Button variant="outlined" size="small" disabled sx={{ textTransform: 'none' }}>
                        {action.text}
                      </Button>
                      {targetNodeId ? (
                        <MuiLink component={Link} to={`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(targetNodeId)}`} underline="hover">
                          → Сцена {targetNodeId}
                        </MuiLink>
                      ) : (
                        <Typography variant="body2" color="text.secondary">→ Конец</Typography>
                      )}
                    </Stack>
                  );
                })}
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                <Button variant="outlined" component={Link} to={`/node-generator/projects/${project.id}/scenes/${scene.id}/edit`}>
                  Редактирование
                </Button>
                <Button variant="outlined" color="error" onClick={() => void handleDeleteScene()}>Удалить сцену</Button>
              </Stack>
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
            <Typography variant="caption" color="text.secondary">действий: {normalizeActions(node).length}</Typography>
          </Box>
        </Stack>
        {expandedNodeIds[node.id.toUpperCase()] ? actionOrder.map((actionId) => {
          const actionText = normalizeActions(node).find((action) => action.id.toUpperCase() === actionId)?.text ?? actionId;
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
  const previousIds = new Set(previousNodes.map((node) => normalizeNodeId(node.id)).filter((id) => id.length > 0));
  const created = nextNodes.find((node) => {
    const id = normalizeNodeId(node.id);
    return id.length > 0 && !previousIds.has(id);
  });
  return created?.id ?? null;
}

function findNodeById(nodes: WorkspaceNode[], nodeId: string): WorkspaceNode | null {
  const target = normalizeNodeId(nodeId);
  if (!target) return null;
  return nodes.find((node) => normalizeNodeId(node.id) === target) ?? null;
}

function normalizeNodeId(id: string | null | undefined): string {
  return (id ?? '').trim().toUpperCase();
}

function normalizeActions(node: WorkspaceNode | null | undefined): Array<{ id: string; text: string }> {
  if (!node || !Array.isArray((node as WorkspaceNode).actions)) return [];
  return node.actions
    .map((action) => ({ id: String(action?.id ?? '').trim(), text: String(action?.text ?? '').trim() }))
    .filter((action) => action.id.length > 0);
}
