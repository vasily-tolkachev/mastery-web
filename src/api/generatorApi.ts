import { authFetch } from './http';
import type {
  GeneratorProject,
  GeneratorProjectSnapshot,
  GeneratorStage,
  GeneratorStageStatus,
  GeneratorStageType,
  StagePromptPreview,
  StageRevision,
  WorkspaceNode,
} from '../types/generator';

export class ApiRequestError extends Error {
  code: string;
  errors: string[];
  result: unknown;

  constructor(message: string, code = 'ERROR', errors: string[] = [], result: unknown = null) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.errors = errors;
    this.result = result;
  }
}

export async function createGeneratorProject(name: string, questStyle: string): Promise<GeneratorProject> {
  const response = await authFetch('/api/generator/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, questStyle }),
  });
  if (!response.ok) {
    throw await toError(response, 'Не удалось создать проект генератора');
  }
  return normalizeProject(await response.json());
}

export async function getGeneratorProjects(): Promise<GeneratorProject[]> {
  const response = await authFetch('/api/generator/projects');
  if (!response.ok) {
    throw await toError(response, 'Не удалось загрузить проекты генератора');
  }
  const raw = await response.json();
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeProject);
}

export async function getGeneratorProject(id: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${id}`);
  if (!response.ok) {
    throw await toError(response, 'Не удалось загрузить проект генератора');
  }
  return normalizeProject(await response.json());
}

export async function generateStage(projectId: string, stageType: GeneratorStageType): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/stages/${stageType}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Не удалось сгенерировать этап');
  }
  return normalizeProject(await response.json());
}

export async function previewStagePrompt(projectId: string, stageType: GeneratorStageType): Promise<StagePromptPreview> {
  const response = await authFetch(`/api/generator/projects/${projectId}/stages/${stageType}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to preview stage prompt');
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return {
    systemPrompt: String(raw.systemPrompt ?? ''),
    userPrompt: String(raw.userPrompt ?? ''),
  };
}

export async function generateStageStep(projectId: string, stageType: GeneratorStageType, step: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/stages/${stageType}/steps/${step}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Не удалось сгенерировать шаг этапа');
  }
  return normalizeProject(await response.json());
}

export async function approveStage(projectId: string, stageType: GeneratorStageType): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/stages/${stageType}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Не удалось подтвердить этап');
  }
  return normalizeProject(await response.json());
}

export async function exportProjectJson(projectId: string): Promise<GeneratorProjectSnapshot> {
  const response = await authFetch(`/api/generator/projects/${projectId}/export-json`);
  if (!response.ok) {
    throw await toError(response, 'Не удалось экспортировать JSON проекта');
  }
  return (await response.json()) as GeneratorProjectSnapshot;
}

export async function importProjectJson(projectId: string, snapshotJson: unknown): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/import-json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ snapshotJson }),
  });
  if (!response.ok) {
    throw await toError(response, 'Не удалось импортировать JSON проекта');
  }
  return normalizeProject(await response.json());
}

export async function generateChapter(projectId: string, chapterId: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/stages/CHAPTERS/chapters/${encodeURIComponent(chapterId)}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Не удалось сгенерировать главу');
  }
  return normalizeProject(await response.json());
}

export async function approveChapter(projectId: string, chapterId: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/stages/CHAPTERS/chapters/${encodeURIComponent(chapterId)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Не удалось подтвердить главу');
  }
  return normalizeProject(await response.json());
}

export async function generateScene(projectId: string, sceneId: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/stages/SCENES/scenes/${encodeURIComponent(sceneId)}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Не удалось сгенерировать сцену');
  }
  return normalizeProject(await response.json());
}

export async function approveScene(projectId: string, sceneId: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/stages/SCENES/scenes/${encodeURIComponent(sceneId)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Не удалось подтвердить сцену');
  }
  return normalizeProject(await response.json());
}

export async function generateAchievementScene(projectId: string, wayId: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/stages/ACHIEVEMENT_SCENES/ways/${encodeURIComponent(wayId)}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to generate achievement scenes');
  }
  return normalizeProject(await response.json());
}

export async function approveAchievementScene(projectId: string, wayId: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/stages/ACHIEVEMENT_SCENES/ways/${encodeURIComponent(wayId)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to approve achievement scenes');
  }
  return normalizeProject(await response.json());
}

export async function previewAchievementScenePrompt(projectId: string, wayId: string): Promise<StagePromptPreview> {
  const response = await authFetch(`/api/generator/projects/${projectId}/stages/ACHIEVEMENT_SCENES/ways/${encodeURIComponent(wayId)}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to preview achievement scenes prompt');
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return {
    systemPrompt: String(raw.systemPrompt ?? ''),
    userPrompt: String(raw.userPrompt ?? ''),
  };
}

export async function generateKnowledgeChain(projectId: string, wayId: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/stages/KNOWLEDGE_CHAIN/ways/${encodeURIComponent(wayId)}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to generate knowledge chain');
  }
  return normalizeProject(await response.json());
}

export async function approveKnowledgeChain(projectId: string, wayId: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/stages/KNOWLEDGE_CHAIN/ways/${encodeURIComponent(wayId)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to approve knowledge chain');
  }
  return normalizeProject(await response.json());
}

export async function previewKnowledgeChainPrompt(projectId: string, wayId: string): Promise<StagePromptPreview> {
  const response = await authFetch(`/api/generator/projects/${projectId}/stages/KNOWLEDGE_CHAIN/ways/${encodeURIComponent(wayId)}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to preview knowledge chain prompt');
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return {
    systemPrompt: String(raw.systemPrompt ?? ''),
    userPrompt: String(raw.userPrompt ?? ''),
  };
}

export async function previewActionQuestPrompt(projectId: string, wayId: string): Promise<StagePromptPreview> {
  const response = await authFetch(`/api/generator/projects/${projectId}/stages/ACTION_QUESTS/ways/${encodeURIComponent(wayId)}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to preview action quests prompt');
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return {
    systemPrompt: String(raw.systemPrompt ?? ''),
    userPrompt: String(raw.userPrompt ?? ''),
  };
}

export async function previewActionResolutionPrompt(
  projectId: string,
  wayId: string,
  sceneId: string,
  actionId: string,
): Promise<StagePromptPreview> {
  const response = await authFetch(
    `/api/generator/projects/${projectId}/stages/ACTION_QUESTS/ways/${encodeURIComponent(wayId)}/scenes/${encodeURIComponent(sceneId)}/actions/${encodeURIComponent(actionId)}/preview`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
  );
  if (!response.ok) {
    throw await toError(response, 'Failed to preview action resolution prompt');
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return {
    systemPrompt: String(raw.systemPrompt ?? ''),
    userPrompt: String(raw.userPrompt ?? ''),
  };
}

export async function generateActionResolution(
  projectId: string,
  wayId: string,
  sceneId: string,
  actionId: string,
): Promise<GeneratorProject> {
  const response = await authFetch(
    `/api/generator/projects/${projectId}/stages/ACTION_QUESTS/ways/${encodeURIComponent(wayId)}/scenes/${encodeURIComponent(sceneId)}/actions/${encodeURIComponent(actionId)}/generate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
  );
  if (!response.ok) {
    throw await toError(response, 'Failed to generate action resolution');
  }
  return normalizeProject(await response.json());
}

export async function approveActionResolution(
  projectId: string,
  wayId: string,
  sceneId: string,
  actionId: string,
): Promise<GeneratorProject> {
  const response = await authFetch(
    `/api/generator/projects/${projectId}/stages/ACTION_QUESTS/ways/${encodeURIComponent(wayId)}/scenes/${encodeURIComponent(sceneId)}/actions/${encodeURIComponent(actionId)}/approve`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
  );
  if (!response.ok) {
    throw await toError(response, 'Failed to approve action resolution');
  }
  return normalizeProject(await response.json());
}

export async function createWorkspaceNode(projectId: string, sourceNodeId?: string, sourceActionId?: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/node-workspace/nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceNodeId, sourceActionId }),
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to create node');
  }
  return normalizeProject(await response.json());
}

export async function updateWorkspaceNodeDescription(projectId: string, nodeId: string, description: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/node-workspace/nodes/${encodeURIComponent(nodeId)}/description`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to update node description');
  }
  return normalizeProject(await response.json());
}

export async function addWorkspaceNodeAction(projectId: string, nodeId: string, text: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/node-workspace/nodes/${encodeURIComponent(nodeId)}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to add node action');
  }
  return normalizeProject(await response.json());
}

export async function updateWorkspaceNodeAction(projectId: string, nodeId: string, actionId: string, text: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/node-workspace/nodes/${encodeURIComponent(nodeId)}/actions/${encodeURIComponent(actionId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to update node action');
  }
  return normalizeProject(await response.json());
}

export async function createNextWorkspaceNode(projectId: string, nodeId: string, actionId: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/node-workspace/nodes/${encodeURIComponent(nodeId)}/actions/${encodeURIComponent(actionId)}/create-next-node`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to create next node');
  }
  return normalizeProject(await response.json());
}

export async function generateWorkspaceNodeDescription(projectId: string, nodeId: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/node-workspace/nodes/${encodeURIComponent(nodeId)}/generate-description`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to generate node description');
  }
  return normalizeProject(await response.json());
}

export async function extractWorkspaceNodeKnowledge(projectId: string, nodeId: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/node-workspace/nodes/${encodeURIComponent(nodeId)}/extract-knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to extract node knowledge');
  }
  return normalizeProject(await response.json());
}

export async function generateWorkspaceNodeActions(projectId: string, nodeId: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/node-workspace/nodes/${encodeURIComponent(nodeId)}/generate-actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to generate node actions');
  }
  return normalizeProject(await response.json());
}

export async function addWorkspaceGlobalKnowledge(projectId: string, text: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/node-workspace/global-knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to add global knowledge');
  }
  return normalizeProject(await response.json());
}

export async function addNodeKnowledgeToGlobal(projectId: string, nodeId: string, text: string): Promise<GeneratorProject> {
  const response = await authFetch(`/api/generator/projects/${projectId}/node-workspace/nodes/${encodeURIComponent(nodeId)}/knowledge/add-to-global`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw await toError(response, 'Failed to add node knowledge to global');
  }
  return normalizeProject(await response.json());
}

async function toError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    const message = typeof payload.message === 'string' && payload.message.trim() ? payload.message : fallback;
    const code = typeof payload.code === 'string' ? payload.code : 'ERROR';
    const errors = Array.isArray(payload.errors) ? payload.errors.map((item) => String(item ?? '')).filter((item) => item.trim().length > 0) : [];
    const result = 'result' in payload ? payload.result : null;
    return new ApiRequestError(`${message} (${response.status})`, code, errors, result);
  } catch {
    return new Error(`${fallback} (${response.status})`);
  }
}

function normalizeProject(rawValue: unknown): GeneratorProject {
  const raw = (rawValue ?? {}) as Record<string, unknown>;
  const stagesRaw = Array.isArray(raw.stages) ? raw.stages : [];
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    questStyle: String(raw.questStyle ?? ''),
    status: String(raw.status ?? ''),
    stages: stagesRaw.map(normalizeStage),
    nodeWorkspace: normalizeNodeWorkspace(raw.nodeWorkspace),
  };
}

function normalizeNodeWorkspace(rawValue: unknown): GeneratorProject['nodeWorkspace'] {
  if (!rawValue || typeof rawValue !== 'object') {
    return null;
  }
  const raw = rawValue as Record<string, unknown>;
  const nodesRaw = Array.isArray(raw.nodes) ? raw.nodes : [];
  return {
    nodes: nodesRaw.map(normalizeWorkspaceNode),
    globalKnowledge: Array.isArray(raw.globalKnowledge) ? raw.globalKnowledge.map((item) => String(item ?? '')) : [],
    expansionSuggestions: Array.isArray(raw.expansionSuggestions) ? raw.expansionSuggestions.map((item) => String(item ?? '')) : [],
    nextNodeIndex: Number(raw.nextNodeIndex ?? 1),
    nextActionIndex: Number(raw.nextActionIndex ?? 1),
  };
}

function normalizeWorkspaceNode(rawValue: unknown): WorkspaceNode {
  const raw = (rawValue ?? {}) as Record<string, unknown>;
  const actions = Array.isArray(raw.actions) ? raw.actions : [];
  return {
    id: String(raw.id ?? ''),
    description: String(raw.description ?? ''),
    actions: actions.map((action) => {
      const a = (action ?? {}) as Record<string, unknown>;
      return {
        id: String(a.id ?? ''),
        text: String(a.text ?? ''),
      };
    }).filter((action) => action.id),
    sourceNodeId: raw.sourceNodeId == null ? null : String(raw.sourceNodeId),
    sourceActionId: raw.sourceActionId == null ? null : String(raw.sourceActionId),
    updatedAt: String(raw.updatedAt ?? ''),
    generatedDescriptionDraft: String(raw.generatedDescriptionDraft ?? ''),
    extractedKnowledgeDraft: Array.isArray(raw.extractedKnowledgeDraft) ? raw.extractedKnowledgeDraft.map((item) => String(item ?? '')) : [],
    generatedActionsDraft: Array.isArray(raw.generatedActionsDraft) ? raw.generatedActionsDraft.map((item) => String(item ?? '')) : [],
  };
}

function normalizeStage(rawValue: unknown): GeneratorStage {
  const raw = (rawValue ?? {}) as Record<string, unknown>;
  const rawType = String(raw.type ?? 'QUEST_DESCRIPTION');
  const normalizedType = rawType === 'MYSTERY'
    ? 'QUEST_DESCRIPTION'
    : rawType === 'NPC'
      ? 'ACHIEVEMENT_REALISATION'
      : rawType;
  return {
    type: normalizedType as GeneratorStageType,
    displayName: typeof raw.displayName === 'string' ? raw.displayName : undefined,
    status: String(raw.status ?? 'NOT_STARTED') as GeneratorStageStatus,
    approved: Boolean(raw.approved),
    currentRevision: normalizeRevision(raw.currentRevision),
  };
}

function normalizeRevision(rawValue: unknown): StageRevision | null {
  if (!rawValue || typeof rawValue !== 'object') {
    return null;
  }
  const raw = rawValue as Record<string, unknown>;
  return {
    revisionNumber: Number(raw.revisionNumber ?? 0),
    outputJson: raw.outputJson ?? null,
    createdAt: String(raw.createdAt ?? ''),
  };
}
