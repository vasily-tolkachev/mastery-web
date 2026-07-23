import { Alert, Box, Breadcrumbs, Button, IconButton, Link as MuiLink, Stack, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
          <MuiLink component={Link} to="/node-generator" underline="hover" color="inherit">Все квесты</MuiLink>
          <MuiLink component={Link} to={`/node-generator/projects/${project.id}`} underline="hover" color="inherit">{project.name}</MuiLink>
          <Typography color="text.primary">Сцены</Typography>
        </Breadcrumbs>
        <SectionCard title="Сцены">
          <Typography variant="body2" color="text.secondary">Сцен пока нет.</Typography>
          <Button variant="contained" onClick={() => void handleCreateScene()} sx={{ mt: 1 }}>Создать первую сцену</Button>
        </SectionCard>
      </Stack>
    );
  }

  const incoming = collectIncoming(nodes, scene.id);
  const outgoing = collectOutgoing(nodes, scene);

  return (
    <Stack spacing={2}>
      <Breadcrumbs aria-label="breadcrumb">
        <MuiLink component={Link} to="/node-generator" underline="hover" color="inherit">Все квесты</MuiLink>
        <MuiLink component={Link} to={`/node-generator/projects/${project.id}`} underline="hover" color="inherit">{project.name}</MuiLink>
        <Typography color="text.primary">Сцена {scene.id}</Typography>
      </Breadcrumbs>

      <Stack spacing={2}>
          <SectionCard title="Локальный граф">
            <LocalSceneGraph
              projectNodes={nodes}
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
              <Button variant="outlined" component={Link} to={`/node-generator/projects/${project.id}/scenes/${scene.id}/edit`}>Редактирование</Button>
              <Button variant="outlined" onClick={() => void handleDeleteScene()}>Удалить сцену</Button>
            </Stack>
          </Stack>
        </SectionCard>
      </Stack>
    </Stack>
  );
}

type LocalSceneGraphProps = {
  projectNodes: WorkspaceNode[];
  sceneId: string;
  incoming: Array<{ nodeId: string; actionText: string }>;
  outgoing: Array<{ nodeId: string | null; actionText: string }>;
  onSelectScene: (nodeId: string) => void;
};

function LocalSceneGraph({ projectNodes, sceneId, incoming, outgoing, onSelectScene }: LocalSceneGraphProps) {
  const theme = useTheme();
  const [depth, setDepth] = useState(() => readSavedGraphDepth());
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
    const byId = new Map<string, WorkspaceNode>();
    projectNodes.forEach((node) => {
      const id = (node.id ?? '').trim();
      if (!id) return;
      if (!byId.has(id.toUpperCase())) byId.set(id.toUpperCase(), node);
    });

    const rawEdges: Array<{ sourceId: string; targetId: string; actionText: string }> = [];
    projectNodes.forEach((node) => {
      const targetId = (node.id ?? '').trim();
      const sourceId = (node.sourceNodeId ?? '').trim();
      const sourceActionId = (node.sourceActionId ?? '').trim().toUpperCase();
      if (!targetId || !sourceId) return;
      const sourceNode = byId.get(sourceId.toUpperCase());
      const actionText = normalizeActions(sourceNode).find((action) => action.id.toUpperCase() === sourceActionId)?.text ?? 'Переход';
      rawEdges.push({ sourceId, targetId, actionText });
    });

    const centerKey = sceneId.trim().toUpperCase();
    const depthByNode = new Map<string, number>([[centerKey, 0]]);
    const queue: string[] = [centerKey];
    let maxDepth = 0;
    while (queue.length > 0) {
      const current = queue.shift() as string;
      const currentDepth = depthByNode.get(current) ?? 0;
      rawEdges.forEach((edge) => {
        const s = edge.sourceId.toUpperCase();
        const t = edge.targetId.toUpperCase();
        let nextId: string | null = null;
        if (s === current && !depthByNode.has(t)) nextId = t;
        if (t === current && !depthByNode.has(s)) nextId = s;
        if (!nextId) return;
        const nextDepth = currentDepth + 1;
        depthByNode.set(nextId, nextDepth);
        if (nextDepth > maxDepth) maxDepth = nextDepth;
        queue.push(nextId);
      });
    }

    const effectiveDepth = Math.max(1, Math.min(depth, maxDepth === 0 ? 1 : maxDepth));
    const included = new Set<string>([centerKey]);
    const frontier = new Set<string>([centerKey]);
    for (let level = 0; level < effectiveDepth; level += 1) {
      const next = new Set<string>();
      rawEdges.forEach((edge) => {
        const s = edge.sourceId.toUpperCase();
        const t = edge.targetId.toUpperCase();
        if (frontier.has(s) && !included.has(t)) next.add(t);
        if (frontier.has(t) && !included.has(s)) next.add(s);
      });
      next.forEach((id) => included.add(id));
      frontier.clear();
      next.forEach((id) => frontier.add(id));
      if (frontier.size === 0) break;
    }

    const flowNodes: Node[] = Array.from(included)
      .map((key) => {
        const original = byId.get(key);
        if (!original) return null;
        const originalId = (original.id ?? '').trim();
        if (!originalId) return null;
        const isCenter = key === centerKey;
        return {
          id: `scene:${originalId}`,
          data: { label: `Сцена ${originalId}`, targetSceneId: originalId },
          position: { x: 0, y: 0 },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
          style: {
            border: isCenter ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
            borderRadius: 8,
            padding: '8px 10px',
            minWidth: 140,
            textAlign: 'center',
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: isCenter ? theme.shadows[3] : 'none',
            fontWeight: isCenter ? 600 : 500,
          },
        } as Node;
      })
      .filter((item): item is Node => item != null);

    const renderedNodeIds = new Set(flowNodes.map((node) => node.id));
    const flowEdges: Edge[] = rawEdges
      .filter((edge) => included.has(edge.sourceId.toUpperCase()) && included.has(edge.targetId.toUpperCase()))
      .map((edge, index) => {
        const sourceNode = byId.get(edge.sourceId.toUpperCase());
        const targetNode = byId.get(edge.targetId.toUpperCase());
        const sourceId = (sourceNode?.id ?? '').trim();
        const targetId = (targetNode?.id ?? '').trim();
        if (!sourceId || !targetId) return null;
        const sourceRef = `scene:${sourceId}`;
        const targetRef = `scene:${targetId}`;
        if (!renderedNodeIds.has(sourceRef) || !renderedNodeIds.has(targetRef)) return null;
        return {
          id: `e:${sourceId}->${targetId}:${index}`,
          source: sourceRef,
          target: targetRef,
          label: edge.actionText,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: theme.palette.text.secondary, strokeWidth: 1.4 },
          labelStyle: { fill: theme.palette.text.secondary, fontSize: 11 },
          labelBgStyle: { fill: theme.palette.background.paper, fillOpacity: 0.95 },
        } as Edge;
      })
      .filter((edge): edge is Edge => edge != null);

    if (flowNodes.length === 1) {
      incoming.forEach((item, index) => {
        const nodeId = `in:${item.nodeId}:${index}`;
        flowNodes.push({
          id: nodeId,
          data: { label: item.nodeId, targetSceneId: item.nodeId },
          position: { x: 0, y: 0 },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Bottom,
          style: {
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8,
            padding: '6px 8px',
            minWidth: 100,
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
        });
        flowEdges.push({
          id: `e:${nodeId}->${centerId}`,
          source: nodeId,
          target: centerId,
          label: item.actionText,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: theme.palette.text.secondary, strokeWidth: 1.4 },
          labelStyle: { fill: theme.palette.text.secondary, fontSize: 11 },
          labelBgStyle: { fill: theme.palette.background.paper, fillOpacity: 0.95 },
        });
      });
      outgoing.forEach((item, index) => {
        const nodeId = `out:${item.nodeId ?? 'end'}:${index}`;
        flowNodes.push({
          id: nodeId,
          data: { label: item.nodeId ?? 'Конец', targetSceneId: item.nodeId ?? null },
          position: { x: 0, y: 0 },
          sourcePosition: Position.Top,
          targetPosition: Position.Top,
          style: {
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8,
            padding: '6px 8px',
            minWidth: 100,
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
        });
        flowEdges.push({
          id: `e:${centerId}->${nodeId}`,
          source: centerId,
          target: nodeId,
          label: item.actionText,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: theme.palette.text.secondary, strokeWidth: 1.4 },
          labelStyle: { fill: theme.palette.text.secondary, fontSize: 11 },
          labelBgStyle: { fill: theme.palette.background.paper, fillOpacity: 0.95 },
        });
      });
    }

    return { initialNodes: flowNodes, initialEdges: flowEdges };
  }, [
    depth,
    incoming,
    projectNodes,
    outgoing,
    sceneId,
    theme.palette.background.paper,
    theme.palette.divider,
    theme.palette.primary.main,
    theme.palette.text.primary,
    theme.palette.text.secondary,
    theme.shadows,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('nodeGenerator.localGraphDepth', String(depth));
    } catch {
      // ignore
    }
  }, [depth]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setFlowNodes(initialNodes);
  }, [initialNodes, setFlowNodes]);

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
        const hasInvalid = Array.from(byId.values()).some((item) => {
          if (item == null) return true;
          const x = item.x;
          const y = item.y;
          return !(Number.isFinite(x) && Number.isFinite(y));
        });
        if (hasInvalid) {
          setFlowNodes((prev) => prev.map((node, index) => ({
            ...node,
            position: { x: (index % 6) * 180, y: Math.floor(index / 6) * 110 },
          })));
          return;
        }
        setFlowNodes((prev) => prev.map((node, index) => {
          const p = byId.get(node.id);
          if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) {
            return {
              ...node,
              position: { x: (index % 6) * 180, y: Math.floor(index / 6) * 110 },
            };
          }
          return { ...node, position: { x: p.x ?? node.position.x, y: p.y ?? node.position.y } };
        }));
      } catch {
        if (cancelled) return;
        setFlowNodes((prev) => prev.map((node, index) => ({
          ...node,
          position: { x: (index % 6) * 180, y: Math.floor(index / 6) * 110 },
        })));
      }
    };
    void runLayout();
    return () => {
      cancelled = true;
    };
  }, [elk, initialEdges, initialNodes, setFlowNodes]);

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">Глубина</Typography>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Tooltip title="Ближе">
            <IconButton
              size="small"
              onClick={() => setDepth((prev) => Math.max(1, prev - 1))}
              sx={{ width: 22, height: 22, border: 1, borderColor: 'divider', borderRadius: 1 }}
            >
              <Typography variant="caption">−</Typography>
            </IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ minWidth: 20, textAlign: 'center', color: 'text.secondary' }}>{depth}</Typography>
          <Tooltip title="Дальше">
            <IconButton
              size="small"
              onClick={() => setDepth((prev) => prev + 1)}
              sx={{ width: 22, height: 22, border: 1, borderColor: 'divider', borderRadius: 1 }}
            >
              <Typography variant="caption">+</Typography>
            </IconButton>
          </Tooltip>
          <Tooltip title="Все доступные">
            <IconButton
              size="small"
              onClick={() => setDepth(100)}
              sx={{ width: 22, height: 22, border: 1, borderColor: 'divider', borderRadius: 1 }}
            >
              <Typography variant="caption">∞</Typography>
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Box
        sx={{
          height: 320,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'background.default',
          '& .react-flow': { background: theme.palette.background.default },
          '& .react-flow__node': { color: theme.palette.text.primary },
          '& .react-flow__controls': {
            boxShadow: theme.shadows[3],
            borderRadius: '10px',
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
          },
          '& .react-flow__controls-button': {
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary,
          },
          '& .react-flow__controls-button svg': { fill: theme.palette.text.primary },
          '& .react-flow__controls-button:hover': { backgroundColor: theme.palette.action.hover },
        }}
      >
        <ReactFlow
          nodes={flowNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          colorMode="light"
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

function readSavedGraphDepth(): number {
  if (typeof window === 'undefined') return 3;
  try {
    const raw = window.localStorage.getItem('nodeGenerator.localGraphDepth');
    const value = Number(raw);
    if (!Number.isFinite(value)) return 3;
    return Math.max(1, Math.floor(value));
  } catch {
    return 3;
  }
}
