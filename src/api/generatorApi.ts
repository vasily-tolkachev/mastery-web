import { authFetch } from './http';
import type {
  GeneratorProject,
  GeneratorProjectSnapshot,
  GeneratorStage,
  GeneratorStageStatus,
  GeneratorStageType,
  StagePromptPreview,
  StageRevision,
} from '../types/generator';

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

async function toError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    const message = typeof payload.message === 'string' && payload.message.trim() ? payload.message : fallback;
    return new Error(`${message} (${response.status})`);
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
