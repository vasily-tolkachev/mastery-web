import { authFetch } from './http';
import type { NodeGeneratorProject, StagePromptPreview, WorkspaceNode } from '../types/nodeGenerator';

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

export async function createNodeGeneratorProject(name: string, questStyle: string): Promise<NodeGeneratorProject> {
  const response = await authFetch('/api/node-generator/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, questStyle }),
  });
  if (!response.ok) throw await toError(response, 'Не удалось создать проект');
  return normalizeProject(await response.json());
}

export async function getNodeGeneratorProjects(): Promise<NodeGeneratorProject[]> {
  const response = await authFetch('/api/node-generator/projects');
  if (!response.ok) throw await toError(response, 'Не удалось загрузить проекты');
  const raw = await response.json();
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeProject);
}

export async function getNodeGeneratorProject(id: string): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${id}`);
  if (!response.ok) throw await toError(response, 'Не удалось загрузить проект');
  return normalizeProject(await response.json());
}

export async function renameNodeGeneratorProject(projectId: string, name: string): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw await toError(response, 'Не удалось переименовать проект');
  return normalizeProject(await response.json());
}

export async function deleteNodeGeneratorProject(projectId: string): Promise<void> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await toError(response, 'Не удалось удалить проект');
}

export async function createWorkspaceNode(projectId: string, sourceNodeId?: string, sourceActionId?: string): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceNodeId, sourceActionId }),
  });
  if (!response.ok) throw await toError(response, 'Не удалось создать нод');
  return normalizeProject(await response.json());
}

export async function deleteWorkspaceNode(projectId: string, nodeId: string): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/nodes/${encodeURIComponent(nodeId)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await toError(response, 'Не удалось удалить нод');
  return normalizeProject(await response.json());
}

export async function updateWorkspaceNodeDescription(projectId: string, nodeId: string, actionDescription: string, stateDescription: string): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/nodes/${encodeURIComponent(nodeId)}/description`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionDescription, stateDescription }),
  });
  if (!response.ok) throw await toError(response, 'Не удалось обновить описание');
  return normalizeProject(await response.json());
}

export async function addWorkspaceNodeAction(projectId: string, nodeId: string, text: string): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/nodes/${encodeURIComponent(nodeId)}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw await toError(response, 'Не удалось добавить действие');
  return normalizeProject(await response.json());
}

export async function createNextWorkspaceNode(projectId: string, nodeId: string, actionId: string): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/nodes/${encodeURIComponent(nodeId)}/actions/${encodeURIComponent(actionId)}/create-next-node`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await toError(response, 'Не удалось создать следующий нод');
  return normalizeProject(await response.json());
}

export async function previewWorkspaceNodeDescriptionPrompt(projectId: string, nodeId: string): Promise<StagePromptPreview> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/nodes/${encodeURIComponent(nodeId)}/generate-description/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await toError(response, 'Не удалось получить превью prompt');
  const raw = (await response.json()) as Record<string, unknown>;
  return { systemPrompt: String(raw.systemPrompt ?? ''), userPrompt: String(raw.userPrompt ?? '') };
}

export async function generateWorkspaceNodeDescription(projectId: string, nodeId: string): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/nodes/${encodeURIComponent(nodeId)}/generate-description`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await toError(response, 'Не удалось сгенерировать описание');
  return normalizeProject(await response.json());
}

export async function previewWorkspaceNodeKnowledgePrompt(projectId: string, nodeId: string): Promise<StagePromptPreview> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/nodes/${encodeURIComponent(nodeId)}/extract-knowledge/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await toError(response, 'Не удалось получить превью prompt');
  const raw = (await response.json()) as Record<string, unknown>;
  return { systemPrompt: String(raw.systemPrompt ?? ''), userPrompt: String(raw.userPrompt ?? '') };
}

export async function extractWorkspaceNodeKnowledge(projectId: string, nodeId: string): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/nodes/${encodeURIComponent(nodeId)}/extract-knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await toError(response, 'Не удалось извлечь знания');
  return normalizeProject(await response.json());
}

export async function previewWorkspaceNodeActionsPrompt(projectId: string, nodeId: string): Promise<StagePromptPreview> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/nodes/${encodeURIComponent(nodeId)}/generate-actions/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await toError(response, 'Не удалось получить превью prompt');
  const raw = (await response.json()) as Record<string, unknown>;
  return { systemPrompt: String(raw.systemPrompt ?? ''), userPrompt: String(raw.userPrompt ?? '') };
}

export async function generateWorkspaceNodeActions(projectId: string, nodeId: string): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/nodes/${encodeURIComponent(nodeId)}/generate-actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await toError(response, 'Не удалось сгенерировать действия');
  return normalizeProject(await response.json());
}

export async function addWorkspaceGlobalKnowledge(projectId: string, text: string): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw await toError(response, 'Не удалось добавить знание');
  return normalizeProject(await response.json());
}

export async function removeWorkspaceGlobalKnowledge(projectId: string, text: string): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/knowledge/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw await toError(response, 'Не удалось удалить знание');
  return normalizeProject(await response.json());
}

export async function addNodeKnowledgeToGlobal(projectId: string, nodeId: string, text: string): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/nodes/${encodeURIComponent(nodeId)}/knowledge/add-to-global`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw await toError(response, 'Не удалось перенести знание');
  return normalizeProject(await response.json());
}

export async function runWorkspaceExpansion(projectId: string, knowledge: string[] = []): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/run-expansion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ knowledge }),
  });
  if (!response.ok) throw await toError(response, 'Не удалось запустить обновление');
  return normalizeProject(await response.json());
}

export async function acceptWorkspaceExpansionSuggestion(projectId: string, suggestionId: string): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/expansion/${encodeURIComponent(suggestionId)}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await toError(response, 'Не удалось принять предложение');
  return normalizeProject(await response.json());
}

export async function dismissWorkspaceExpansionSuggestion(projectId: string, suggestionId: string): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/expansion/${encodeURIComponent(suggestionId)}/dismiss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await toError(response, 'Не удалось отклонить предложение');
  return normalizeProject(await response.json());
}

export async function exportProjectJson(projectId: string): Promise<unknown> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/export-json`);
  if (!response.ok) throw await toError(response, 'Не удалось экспортировать JSON');
  return await response.json();
}

export async function importProjectJson(projectId: string, snapshotJson: unknown): Promise<NodeGeneratorProject> {
  const response = await authFetch(`/api/node-generator/projects/${projectId}/import-json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ snapshotJson }),
  });
  if (!response.ok) throw await toError(response, 'Не удалось импортировать JSON');
  return normalizeProject(await response.json());
}

export async function importNodeGeneratorProjectJson(snapshotJson: unknown): Promise<NodeGeneratorProject> {
  const response = await authFetch('/api/node-generator/projects/import-json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ snapshotJson }),
  });
  if (!response.ok) throw await toError(response, 'Не удалось импортировать проект из JSON');
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

function normalizeProject(rawValue: unknown): NodeGeneratorProject {
  const raw = (rawValue ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    questStyle: String(raw.questStyle ?? ''),
    status: String(raw.status ?? ''),
    workspace: normalizeWorkspace(raw.workspace),
  };
}

function normalizeWorkspace(rawValue: unknown): NodeGeneratorProject['workspace'] {
  if (!rawValue || typeof rawValue !== 'object') return null;
  const raw = rawValue as Record<string, unknown>;
  const nodesRaw = Array.isArray(raw.nodes) ? raw.nodes : [];
  return {
    nodes: nodesRaw.map(normalizeWorkspaceNode),
    globalKnowledge: Array.isArray(raw.globalKnowledge) ? raw.globalKnowledge.map((item) => String(item ?? '')) : [],
    expansionSuggestions: Array.isArray(raw.expansionSuggestions)
      ? raw.expansionSuggestions.map((item) => {
        const s = (item ?? {}) as Record<string, unknown>;
        return {
          id: String(s.id ?? ''),
          nodeId: String(s.nodeId ?? ''),
          actionText: String(s.actionText ?? ''),
          reason: String(s.reason ?? ''),
          status: String(s.status ?? 'PENDING'),
          sourceKnowledge: Array.isArray(s.sourceKnowledge) ? s.sourceKnowledge.map((v) => String(v ?? '')) : [],
        };
      }).filter((item) => item.id)
      : [],
    aiRequests: Array.isArray(raw.aiRequests)
      ? raw.aiRequests.map((item) => {
        const r = (item ?? {}) as Record<string, unknown>;
        return {
          id: String(r.id ?? ''),
          stage: String(r.stage ?? ''),
          nodeId: r.nodeId == null ? null : String(r.nodeId),
          systemPrompt: String(r.systemPrompt ?? ''),
          userPrompt: String(r.userPrompt ?? ''),
          createdAt: String(r.createdAt ?? ''),
        };
      }).filter((item) => item.id)
      : [],
    nextNodeIndex: Number(raw.nextNodeIndex ?? 1),
    nextActionIndex: Number(raw.nextActionIndex ?? 1),
    nextSuggestionIndex: Number(raw.nextSuggestionIndex ?? 1),
    nextAiRequestIndex: Number(raw.nextAiRequestIndex ?? 1),
  };
}

function normalizeWorkspaceNode(rawValue: unknown): WorkspaceNode {
  const raw = (rawValue ?? {}) as Record<string, unknown>;
  const actions = Array.isArray(raw.actions) ? raw.actions : [];
  const legacyDescription = String(raw.description ?? '');
  const actionDescription = String(raw.actionDescription ?? '');
  const stateDescription = String(raw.stateDescription ?? '');
  const generatedLegacyDescription = String(raw.generatedDescriptionDraft ?? '');
  const generatedActionDescriptionDraft = String(raw.generatedActionDescriptionDraft ?? '');
  const generatedStateDescriptionDraft = String(raw.generatedStateDescriptionDraft ?? '');
  return {
    id: String(raw.id ?? ''),
    description: legacyDescription,
    actionDescription: actionDescription || (stateDescription ? '' : legacyDescription),
    stateDescription: stateDescription || (actionDescription ? '' : legacyDescription),
    actions: actions.map((action) => {
      const a = (action ?? {}) as Record<string, unknown>;
      return { id: String(a.id ?? ''), text: String(a.text ?? '') };
    }).filter((item) => item.id),
    sourceNodeId: raw.sourceNodeId == null ? null : String(raw.sourceNodeId),
    sourceActionId: raw.sourceActionId == null ? null : String(raw.sourceActionId),
    updatedAt: String(raw.updatedAt ?? ''),
    generatedDescriptionDraft: generatedLegacyDescription,
    generatedActionDescriptionDraft: generatedActionDescriptionDraft || (generatedStateDescriptionDraft ? '' : generatedLegacyDescription),
    generatedStateDescriptionDraft: generatedStateDescriptionDraft || (generatedActionDescriptionDraft ? '' : generatedLegacyDescription),
    extractedKnowledgeDraft: Array.isArray(raw.extractedKnowledgeDraft) ? raw.extractedKnowledgeDraft.map((item) => String(item ?? '')) : [],
    generatedActionsDraft: Array.isArray(raw.generatedActionsDraft) ? raw.generatedActionsDraft.map((item) => String(item ?? '')) : [],
  };
}
