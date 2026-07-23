import { Alert, Box, Breadcrumbs, Button, Link as MuiLink, Stack, Typography } from '@mui/material';
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
        <SectionCard title="Граф сцен">
          <SceneTreeList
            nodes={nodes}
            selectedSceneId={scene.id}
            onSelectScene={(nodeId) => navigate(`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(nodeId)}`)}
          />
        </SectionCard>

        <Stack spacing={2} sx={{ flex: 1 }}>
          <SectionCard title="Локальный граф">
            <LocalSceneGraph
              sceneId={scene.id}
              incoming={incoming}
              outgoing={outgoing}
              onSelectScene={(nodeId) => navigate(`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(nodeId)}`)}
            />
          </SectionCard>

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
                <Button variant="outlined" onClick={() => void handleDeleteScene()}>
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

  const renderNode = (node: WorkspaceNode, level: number): React.ReactNode => {
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

type LocalSceneGraphProps = {
  sceneId: string;
  incoming: Array<{ nodeId: string; actionText: string }>;
  outgoing: Array<{ nodeId: string | null; actionText: string }>;
  onSelectScene: (nodeId: string) => void;
};

function LocalSceneGraph({ sceneId, incoming, outgoing, onSelectScene }: LocalSceneGraphProps) {
  const elk = useMemo(() => {
    try {
      const ctor = (ELK as unknown as { default?: new () => { layout: (graph: unknown) => Promise<unknown> } }).default
        ?? (ELK as unknown as new () => { layout: (graph: unknown) => Promise<unknown> });
      return new ctor();
    } catch {
      return null;
    }
  }, []);

  const { initialNodes, initialEdges } = useMemo(() => {
    const centerId = `scene:${sceneId}`;
    const nodes: Node[] = [
      {
        id: centerId,
        data: { label: `Сцена ${sceneId}`, targetSceneId: sceneId },
        position: { x: 0, y: 0 },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: {
          border: '2px solid #1976d2',
          borderRadius: 8,
          padding: '8px 10px',
          minWidth: 140,
          textAlign: 'center',
          background: '#fff',
          fontWeight: 600,
        },
      },
    ];
    const edges: Edge[] = [];

    incoming.forEach((item, index) => {
      const nodeId = `in:${item.nodeId}:${index}`;
      nodes.push({
        id: nodeId,
        data: { label: item.nodeId, targetSceneId: item.nodeId },
        position: { x: 0, y: 0 },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Bottom,
        style: { border: '1px solid #c4c4c4', borderRadius: 8, padding: '6px 8px', minWidth: 100, background: '#fff' },
      });
      edges.push({
        id: `e:${nodeId}->${centerId}`,
        source: nodeId,
        target: centerId,
        label: item.actionText,
        markerEnd: { type: MarkerType.ArrowClosed },
      });
    });

    outgoing.forEach((item, index) => {
      const nodeId = `out:${item.nodeId ?? 'end'}:${index}`;
      nodes.push({
        id: nodeId,
        data: { label: item.nodeId ?? 'Конец', targetSceneId: item.nodeId ?? null },
        position: { x: 0, y: 0 },
        sourcePosition: Position.Top,
        targetPosition: Position.Top,
        style: { border: '1px solid #c4c4c4', borderRadius: 8, padding: '6px 8px', minWidth: 100, background: '#fff' },
      });
      edges.push({
        id: `e:${centerId}->${nodeId}`,
        source: centerId,
        target: nodeId,
        label: item.actionText,
        markerEnd: { type: MarkerType.ArrowClosed },
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [incoming, outgoing, sceneId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  useEffect(() => {
    let cancelled = false;
    const runLayout = async () => {
      if (!elk) return;
      try {
        const graph = {
          id: 'local-scene-graph',
          layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN',
            'elk.layered.spacing.nodeNodeBetweenLayers': '80',
            'elk.spacing.nodeNode': '40',
            'elk.edgeRouting': 'ORTHOGONAL',
          },
          children: initialNodes.map((node) => ({ id: node.id, width: 150, height: 52 })),
          edges: initialEdges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
        };
        const layout = await elk.layout(graph as never);
        if (cancelled) return;
        const layoutNode = layout as { children?: Array<{ id?: string; x?: number; y?: number }> };
        const byId = new Map((layoutNode.children ?? []).map((item) => [item.id ?? '', item]));
        setNodes((prev) => prev.map((node) => {
          const p = byId.get(node.id);
          if (!p) return node;
          return { ...node, position: { x: p.x ?? node.position.x, y: p.y ?? node.position.y } };
        }));
      } catch {
        if (cancelled) return;
      }
    };
    void runLayout();
    return () => {
      cancelled = true;
    };
  }, [elk, initialEdges, initialNodes, setNodes]);

  return (
    <Box sx={{ height: 320, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        onNodeClick={(_, node) => {
          const target = node.data?.targetSceneId as string | null | undefined;
          if (!target) return;
          onSelectScene(target);
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={18} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </Box>
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
