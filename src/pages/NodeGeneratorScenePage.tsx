import { Alert, Box, Breadcrumbs, Button, Link as MuiLink, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
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
          <Button variant="contained" onClick={() => void handleCreateScene()} sx={{ mt: 1 }}>
            Создать первую сцену
          </Button>
        </SectionCard>
      </Stack>
    );
  }

  const incoming = collectIncoming(nodes, scene.id);
  const outgoing = collectOutgoing(nodes, scene);

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
        <SectionCard title="Локальный граф">
          <LocalSceneGraph
            sceneId={scene.id}
            incoming={incoming}
            outgoing={outgoing}
            onSelectScene={(nodeId) => navigate(`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(nodeId)}`)}
          />
        </SectionCard>

        <Stack spacing={2} sx={{ flex: 1 }}>
          <SectionCard title={`Сцена ${scene.id}`}>
            <Stack spacing={1.25}>
              <Typography variant="subtitle2">В эту сцену можно попасть из</Typography>
              <Stack spacing={0.5}>
                {incoming.length === 0 ? <Typography variant="body2" color="text.secondary">Нет входящих переходов.</Typography> : null}
                {incoming.map((item, index) => (
                  <Typography key={`${item.nodeId}-${index}`} variant="body2">
                    • <MuiLink component={Link} to={`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(item.nodeId)}`} underline="hover">{item.nodeId}</MuiLink> — {item.actionText}
                  </Typography>
                ))}
              </Stack>

              <Box sx={{ borderTop: 1, borderColor: 'divider' }} />
              <Typography variant="subtitle2">Описание</Typography>
              <Typography variant="body2">{(scene.stateDescription || scene.actionDescription || '...').trim() || '...'}</Typography>

              <Box sx={{ borderTop: 1, borderColor: 'divider' }} />
              <Typography variant="subtitle2">Из этой сцены можно перейти в</Typography>
              <Stack spacing={0.5}>
                {outgoing.length === 0 ? <Typography variant="body2" color="text.secondary">Нет исходящих переходов.</Typography> : null}
                {outgoing.map((item, index) => (
                  <Typography key={`${item.actionText}-${index}`} variant="body2">
                    • {item.nodeId ? (
                      <><MuiLink component={Link} to={`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(item.nodeId)}`} underline="hover">{item.nodeId}</MuiLink> — {item.actionText}</>
                    ) : (
                      <>Конец — {item.actionText}</>
                    )}
                  </Typography>
                ))}
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                <Button variant="outlined" component={Link} to={`/node-generator/projects/${project.id}/scenes/${scene.id}/edit`}>
                  Редактирование
                </Button>
                <Button variant="outlined" color="error" onClick={() => void handleDeleteScene()}>
                  Удалить сцену
                </Button>
              </Stack>
            </Stack>
          </SectionCard>
        </Stack>
      </Stack>
    </Stack>
  );
}

type LocalSceneGraphProps = {
  sceneId: string;
  incoming: Array<{ nodeId: string; actionText: string }>;
  outgoing: Array<{ nodeId: string | null; actionText: string }>;
  onSelectScene: (nodeId: string) => void;
};

function LocalSceneGraph({ sceneId, incoming, outgoing, onSelectScene }: LocalSceneGraphProps) {
  return (
    <Stack spacing={1.25}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        {incoming.length === 0 ? <Typography variant="body2" color="text.secondary">Нет входящих переходов</Typography> : null}
        {incoming.map((item) => (
          <Button key={`${item.nodeId}-${item.actionText}`} size="small" variant="outlined" onClick={() => onSelectScene(item.nodeId)}>
            {item.nodeId}
          </Button>
        ))}
      </Stack>

      <Box sx={{ border: 1, borderColor: 'primary.main', borderRadius: 1, p: 1, textAlign: 'center' }}>
        <Typography variant="subtitle2">Сцена {sceneId}</Typography>
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        {outgoing.length === 0 ? <Typography variant="body2" color="text.secondary">Нет исходящих переходов</Typography> : null}
        {outgoing.map((item, index) => (
          <Button
            key={`${index}-${item.actionText}`}
            size="small"
            variant="outlined"
            onClick={() => {
              if (item.nodeId) onSelectScene(item.nodeId);
            }}
            disabled={!item.nodeId}
          >
            {item.nodeId ?? 'Конец'}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}

function collectIncoming(nodes: WorkspaceNode[], sceneId: string): Array<{ nodeId: string; actionText: string }> {
  const target = normalizeNodeId(sceneId);
  return nodes
    .filter((node) => normalizeNodeId(node.id) === target)
    .map((node) => {
      const sourceId = (node.sourceNodeId ?? '').trim();
      const sourceActionId = (node.sourceActionId ?? '').trim().toUpperCase();
      const sourceNode = nodes.find((candidate) => normalizeNodeId(candidate.id) === normalizeNodeId(sourceId));
      const actionText = normalizeActions(sourceNode).find((action) => action.id.toUpperCase() === sourceActionId)?.text ?? 'Переход';
      return { nodeId: sourceId, actionText };
    })
    .filter((item) => item.nodeId.length > 0);
}

function collectOutgoing(nodes: WorkspaceNode[], scene: WorkspaceNode): Array<{ nodeId: string | null; actionText: string }> {
  const actionTargets = new Map<string, string>();
  for (const node of nodes) {
    if (normalizeNodeId(node.sourceNodeId) !== normalizeNodeId(scene.id)) continue;
    const sourceActionId = (node.sourceActionId ?? '').trim();
    if (!sourceActionId) continue;
    actionTargets.set(sourceActionId.toUpperCase(), node.id);
  }
  return normalizeActions(scene).map((action) => ({
    nodeId: actionTargets.get(action.id.toUpperCase()) ?? null,
    actionText: action.text,
  }));
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
