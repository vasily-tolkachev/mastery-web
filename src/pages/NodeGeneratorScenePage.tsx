import { Alert, Box, Breadcrumbs, Button, Link as MuiLink, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ELK from 'elkjs/lib/elk.bundled.js';
import {
  Background,
  Controls,
  MarkerType,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
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

type ElkChildLayout = {
  id?: string;
  x?: number;
  y?: number;
};

export function NodeGeneratorScenePage() {
  const navigate = useNavigate();
  const { projectId = '', sceneId = '' } = useParams();
  const { data: project, isLoading, isError, error } = useNodeGeneratorProject(projectId);
  const setProjectCache = useSetNodeGeneratorProjectCache();
  const [actionDescriptionDraft, setActionDescriptionDraft] = useState('');
  const [stateDescriptionDraft, setStateDescriptionDraft] = useState('');
  const [actionDraft, setActionDraft] = useState('');

  const currentScene = useMemo(
    () => project?.workspace?.nodes.find((node) => normalizeNodeId(node.id) === normalizeNodeId(sceneId)) ?? null,
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
  const availableSuggestedActions = useMemo(() => {
    if (!scene) return [];
    const existing = new Set(normalizeActions(scene).map((action) => action.text.trim().toLowerCase()).filter((item) => item.length > 0));
    return (scene.generatedActionsDraft ?? []).filter((item) => !existing.has(item.trim().toLowerCase()));
  }, [scene]);

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
              {availableSuggestedActions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Сохранённых вариантов пока нет.</Typography>
              ) : null}
              {availableSuggestedActions.map((suggestedAction, index) => (
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
              {normalizeActions(scene).map((action) => (
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
  const elk = useMemo(() => new ELK(), []);
  const [lastDraggedNodeId, setLastDraggedNodeId] = useState<string | null>(null);
  const [lastDragAtMs, setLastDragAtMs] = useState(0);
  const { initialFlowNodes, initialFlowEdges } = useMemo(() => {
    const uniqueNodes: WorkspaceNode[] = [];
    const seenNodeIds = new Set<string>();
    for (const node of nodes) {
      const id = (node.id ?? '').trim();
      if (!id) continue;
      const key = id.toUpperCase();
      if (seenNodeIds.has(key)) continue;
      seenNodeIds.add(key);
      uniqueNodes.push({ ...node, id });
    }
    const flowIdByNodeKey = new Map<string, string>();
    uniqueNodes.forEach((node, index) => {
      flowIdByNodeKey.set(node.id.toUpperCase(), `n_${index + 1}`);
    });

    const existingNodeIds = new Set(uniqueNodes.map((node) => node.id.toUpperCase()));
    const childrenByParent = new Map<string, WorkspaceNode[]>();
    const roots: WorkspaceNode[] = [];
    for (const node of uniqueNodes) {
      const parentId = (node.sourceNodeId ?? '').trim();
      if (!parentId || !existingNodeIds.has(parentId.toUpperCase())) {
        roots.push(node);
        continue;
      }
      const key = parentId.toUpperCase();
      const list = childrenByParent.get(key) ?? [];
      list.push(node);
      childrenByParent.set(key, list);
    }
    roots.sort((a, b) => a.id.localeCompare(b.id));
    childrenByParent.forEach((list) => list.sort((a, b) => a.id.localeCompare(b.id)));

    const levels = new Map<string, number>();
    const orderInLevel = new Map<string, number>();
    const visited = new Set<string>();
    const queue: WorkspaceNode[] = [...roots];
    for (const root of roots) {
      levels.set(root.id.toUpperCase(), 0);
    }
    while (queue.length > 0) {
      const node = queue.shift();
      if (!node) continue;
      const key = node.id.toUpperCase();
      if (visited.has(key)) continue;
      visited.add(key);
      const nextLevel = (levels.get(key) ?? 0) + 1;
      for (const child of childrenByParent.get(key) ?? []) {
        const childKey = child.id.toUpperCase();
        if (!levels.has(childKey)) levels.set(childKey, nextLevel);
        queue.push(child);
      }
    }

    const levelBuckets = new Map<number, WorkspaceNode[]>();
    for (const node of uniqueNodes) {
      const level = levels.get(node.id.toUpperCase()) ?? 0;
      const bucket = levelBuckets.get(level) ?? [];
      bucket.push(node);
      levelBuckets.set(level, bucket);
    }
    for (const [level, bucket] of levelBuckets.entries()) {
      bucket.sort((a, b) => a.id.localeCompare(b.id));
      bucket.forEach((node, index) => {
        orderInLevel.set(`${level}:${node.id.toUpperCase()}`, index);
      });
    }

    const flowNodesLocal: Node[] = uniqueNodes.map((node) => {
      const level = levels.get(node.id.toUpperCase()) ?? 0;
      const index = orderInLevel.get(`${level}:${node.id.toUpperCase()}`) ?? 0;
      const isSelected = selectedSceneId.toUpperCase() === node.id.toUpperCase();
      const flowId = flowIdByNodeKey.get(node.id.toUpperCase()) ?? `n_fallback_${index + 1}`;
      return {
        id: flowId,
        position: { x: level * 320, y: index * 140 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: `${node.id} • действий: ${normalizeActions(node).length}`, originalNodeId: node.id },
        style: {
          border: isSelected ? '2px solid #1976d2' : '1px solid #c4c4c4',
          borderRadius: '8px',
          padding: '10px 12px',
          backgroundColor: '#fff',
          color: '#1f2937',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          minWidth: 220,
          fontSize: 13,
          fontWeight: 500,
        },
      };
    });

    const flowEdgesLocal: Edge[] = [];
    uniqueNodes
      .filter((node) => (node.sourceNodeId ?? '').trim().length > 0)
      .forEach((node) => {
        const sourceNodeId = node.sourceNodeId ?? '';
        if (!existingNodeIds.has(sourceNodeId.toUpperCase()) || !existingNodeIds.has(node.id.toUpperCase())) {
          return;
        }
        const sourceFlowId = flowIdByNodeKey.get(sourceNodeId.toUpperCase());
        const targetFlowId = flowIdByNodeKey.get(node.id.toUpperCase());
        if (!sourceFlowId || !targetFlowId) return;
        const sourceActionId = (node.sourceActionId ?? '').toUpperCase();
        const sourceNode = uniqueNodes.find((item) => item.id.toUpperCase() === sourceNodeId.toUpperCase());
        const actionText = normalizeActions(sourceNode).find((action) => action.id.toUpperCase() === sourceActionId)?.text ?? '';
        flowEdgesLocal.push({
          id: `${sourceFlowId}->${targetFlowId}:${sourceActionId || 'DIRECT'}`,
          source: sourceFlowId,
          target: targetFlowId,
          label: actionText || 'Переход',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#7a7a7a' },
          style: { stroke: '#7a7a7a', strokeWidth: 1.4 },
          labelStyle: { fontSize: 11, fill: '#4b4b4b' },
          labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
        });
      });

    return { initialFlowNodes: flowNodesLocal, initialFlowEdges: flowEdgesLocal };
  }, [nodes, selectedSceneId]);
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialFlowNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialFlowEdges);

  useEffect(() => {
    setFlowNodes(initialFlowNodes);
  }, [initialFlowNodes, setFlowNodes]);

  useEffect(() => {
    setFlowEdges(initialFlowEdges);
  }, [initialFlowEdges, setFlowEdges]);

  useEffect(() => {
    let cancelled = false;
    const runLayout = async () => {
      if (!initialFlowNodes.length) {
        setFlowNodes([]);
        return;
      }
      try {
        const graph = {
          id: 'scene-graph',
          layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': 'RIGHT',
            'elk.spacing.nodeNode': '60',
            'elk.layered.spacing.nodeNodeBetweenLayers': '120',
            'elk.edgeRouting': 'ORTHOGONAL',
          },
          children: initialFlowNodes.map((node) => ({
            id: node.id,
            width: 240,
            height: 64,
          })),
          edges: initialFlowEdges.map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target],
          })),
        };
        const layout = await elk.layout(graph as never);
        if (cancelled) return;
        const children = (layout.children ?? []) as unknown as ElkChildLayout[];
        const byId = new Map(children.map((item) => [item.id ?? '', item]));
        setFlowNodes((prev) => prev.map((node) => {
          const positioned = byId.get(node.id);
          if (!positioned) return node;
          return {
            ...node,
            position: { x: positioned.x ?? node.position.x, y: positioned.y ?? node.position.y },
          };
        }));
      } catch {
        if (cancelled) return;
        setFlowNodes(initialFlowNodes);
      }
    };
    void runLayout();
    return () => {
      cancelled = true;
    };
  }, [elk, initialFlowEdges, initialFlowNodes, setFlowNodes]);

  return (
    <Box sx={{ height: 520, width: '100%', minWidth: { md: 420 }, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        onNodeDragStop={(_, node) => {
          setLastDraggedNodeId(node.id);
          setLastDragAtMs(Date.now());
        }}
        onNodeClick={(_, node) => {
          const dragGuardMs = 220;
          if (lastDraggedNodeId === node.id && Date.now() - lastDragAtMs < dragGuardMs) return;
          const originalNodeId = typeof node.data?.originalNodeId === 'string' ? node.data.originalNodeId : '';
          if (!originalNodeId.trim()) return;
          onSelectScene(originalNodeId);
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </Box>
  );
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
