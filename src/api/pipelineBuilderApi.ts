import { authFetch } from './http';
import { ApiRequestError } from './generatorApi';
import type { PipelineProject, PipelinePromptPreview } from '../types/pipelineBuilder';

export async function createPipelineProject(name: string): Promise<PipelineProject> {
  const response = await authFetch('/api/pipeline-builder/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw await toError(response, 'Failed to create pipeline project');
  return normalizeProject(await response.json());
}

export async function listPipelineProjects(): Promise<PipelineProject[]> {
  const response = await authFetch('/api/pipeline-builder/projects');
  if (!response.ok) throw await toError(response, 'Failed to list pipeline projects');
  const raw = await response.json();
  return Array.isArray(raw) ? raw.map(normalizeProject) : [];
}

export async function getPipelineProject(projectId: string): Promise<PipelineProject> {
  const response = await authFetch(`/api/pipeline-builder/projects/${projectId}`);
  if (!response.ok) throw await toError(response, 'Failed to get pipeline project');
  return normalizeProject(await response.json());
}

export async function addPipelineStage(projectId: string, payload: Record<string, unknown>): Promise<PipelineProject> {
  const response = await authFetch(`/api/pipeline-builder/projects/${projectId}/stages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await toError(response, 'Failed to add stage');
  return normalizeProject(await response.json());
}

export async function updatePipelineStage(projectId: string, stageId: string, payload: Record<string, unknown>): Promise<PipelineProject> {
  const response = await authFetch(`/api/pipeline-builder/projects/${projectId}/stages/${encodeURIComponent(stageId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await toError(response, 'Failed to update stage');
  return normalizeProject(await response.json());
}

export async function deletePipelineStage(projectId: string, stageId: string): Promise<PipelineProject> {
  const response = await authFetch(`/api/pipeline-builder/projects/${projectId}/stages/${encodeURIComponent(stageId)}`, { method: 'DELETE' });
  if (!response.ok) throw await toError(response, 'Failed to delete stage');
  return normalizeProject(await response.json());
}

export async function previewPipelineStage(projectId: string, stageId: string, payload?: Record<string, unknown>): Promise<PipelinePromptPreview> {
  const response = await authFetch(`/api/pipeline-builder/projects/${projectId}/stages/${encodeURIComponent(stageId)}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!response.ok) throw await toError(response, 'Failed to preview stage');
  const raw = (await response.json()) as Record<string, unknown>;
  return {
    systemPrompt: String(raw.systemPrompt ?? ''),
    userPrompt: String(raw.userPrompt ?? ''),
    args: raw.args ?? null,
    memory: String(raw.memory ?? ''),
  };
}

export async function runPipelineStage(projectId: string, stageId: string, payload?: Record<string, unknown>): Promise<PipelineProject> {
  const response = await authFetch(`/api/pipeline-builder/projects/${projectId}/stages/${encodeURIComponent(stageId)}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!response.ok) throw await toError(response, 'Failed to run stage');
  return normalizeProject(await response.json());
}

export async function approvePipelineStage(projectId: string, stageId: string): Promise<PipelineProject> {
  const response = await authFetch(`/api/pipeline-builder/projects/${projectId}/stages/${encodeURIComponent(stageId)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await toError(response, 'Failed to approve stage');
  return normalizeProject(await response.json());
}

export async function exportPipelineProject(projectId: string): Promise<unknown> {
  const response = await authFetch(`/api/pipeline-builder/projects/${projectId}/export`);
  if (!response.ok) throw await toError(response, 'Failed to export pipeline');
  return await response.json();
}

export async function importPipelineProject(projectId: string, snapshot: unknown): Promise<PipelineProject> {
  const response = await authFetch(`/api/pipeline-builder/projects/${projectId}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ snapshot }),
  });
  if (!response.ok) throw await toError(response, 'Failed to import pipeline');
  return normalizeProject(await response.json());
}

async function toError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    const message = typeof payload.message === 'string' && payload.message.trim() ? payload.message : fallback;
    const code = typeof payload.code === 'string' ? payload.code : 'ERROR';
    return new ApiRequestError(`${message} (${response.status})`, code);
  } catch {
    return new Error(`${fallback} (${response.status})`);
  }
}

function normalizeProject(rawValue: unknown): PipelineProject {
  const raw = (rawValue ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    createdAt: String(raw.createdAt ?? ''),
    stages: Array.isArray(raw.stages) ? raw.stages.map((item) => normalizeStage(item as Record<string, unknown>)) : [],
  };
}

function normalizeStage(raw: Record<string, unknown>) {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    enabled: Boolean(raw.enabled),
    systemPromptTemplate: String(raw.systemPromptTemplate ?? ''),
    userPromptTemplate: String(raw.userPromptTemplate ?? ''),
    args: raw.args ?? {},
    memoryMode: String(raw.memoryMode ?? 'NONE') as 'NONE' | 'SELECTED_STAGES' | 'ALL_PREVIOUS',
    memorySources: Array.isArray(raw.memorySources) ? raw.memorySources.map((item) => String(item)) : [],
    dependencies: Array.isArray(raw.dependencies)
      ? raw.dependencies.map((dep) => ({
        stageId: String((dep as Record<string, unknown>).stageId ?? ''),
        requiredStatus: String((dep as Record<string, unknown>).requiredStatus ?? 'READY') as
          'NOT_STARTED' | 'READY' | 'RUNNING' | 'REVIEW' | 'APPROVED' | 'FAILED',
      }))
      : [],
    status: String(raw.status ?? 'NOT_STARTED') as 'NOT_STARTED' | 'READY' | 'RUNNING' | 'REVIEW' | 'APPROVED' | 'FAILED',
    approved: Boolean(raw.approved),
    currentRevision: raw.currentRevision && typeof raw.currentRevision === 'object'
      ? {
        revisionNumber: Number((raw.currentRevision as Record<string, unknown>).revisionNumber ?? 0),
        outputJson: (raw.currentRevision as Record<string, unknown>).outputJson ?? null,
        createdAt: String((raw.currentRevision as Record<string, unknown>).createdAt ?? ''),
        systemPromptUsed: String((raw.currentRevision as Record<string, unknown>).systemPromptUsed ?? ''),
        userPromptUsed: String((raw.currentRevision as Record<string, unknown>).userPromptUsed ?? ''),
      }
      : null,
  };
}
