import { authFetch } from './http';

export type RuntimeItem = {
  id: string;
  name: string;
};

export type RuntimeNpc = {
  id: string;
  description: string;
  dialogue: string;
};

export type RuntimeExit = {
  actionText: string;
  targetLocationId: string | null;
};

export type RuntimeAction = {
  id: string;
  description: string;
  targetId: string | null;
};

export type RuntimeSnapshot = {
  sessionId: string;
  currentLocationId: string;
  description: string;
  items: RuntimeItem[];
  exits: RuntimeExit[];
  availableActions: RuntimeAction[];
  inventory: RuntimeItem[];
  npcs: RuntimeNpc[];
};

export type RuntimeActionResult = {
  message: string;
  snapshot: RuntimeSnapshot;
  engineAction: string;
};

export type RuntimeQuestSummary = {
  id: string;
  name: string;
  description: string;
};

async function toRuntimeError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = await response.json();
    const message = typeof payload?.message === 'string' ? payload.message : fallback;
    return new Error(message);
  } catch {
    return new Error(fallback);
  }
}

export async function listTextRuntimeQuests(): Promise<RuntimeQuestSummary[]> {
  const response = await authFetch('/api/text-runtime/quests');
  if (!response.ok) throw await toRuntimeError(response, 'Не удалось загрузить список квестов');
  const raw = await response.json();
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => ({
    id: String(item?.id ?? ''),
    name: String(item?.name ?? ''),
    description: String(item?.description ?? ''),
  })).filter((item) => item.id.length > 0);
}

export async function startTextRuntimeQuest(questId: string): Promise<RuntimeSnapshot> {
  const response = await authFetch(`/api/text-runtime/quests/${encodeURIComponent(questId)}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await toRuntimeError(response, 'Не удалось запустить квест');
  return await response.json() as RuntimeSnapshot;
}

export async function inspectTextRuntime(sessionId: string): Promise<RuntimeSnapshot> {
  const response = await authFetch(`/api/text-runtime/sessions/${sessionId}/inspect`);
  if (!response.ok) throw await toRuntimeError(response, 'Не удалось загрузить состояние');
  return await response.json() as RuntimeSnapshot;
}

export async function moveTextRuntime(sessionId: string, locationId: string): Promise<RuntimeSnapshot> {
  const response = await authFetch(`/api/text-runtime/sessions/${sessionId}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locationId }),
  });
  if (!response.ok) throw await toRuntimeError(response, 'Переход недоступен');
  return await response.json() as RuntimeSnapshot;
}

export async function takeTextRuntime(sessionId: string, itemId: string): Promise<RuntimeSnapshot> {
  const response = await authFetch(`/api/text-runtime/sessions/${sessionId}/take`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId }),
  });
  if (!response.ok) throw await toRuntimeError(response, 'Не удалось взять предмет');
  return await response.json() as RuntimeSnapshot;
}

export async function useTextRuntime(sessionId: string, itemId: string, targetId: string): Promise<RuntimeSnapshot> {
  const response = await authFetch(`/api/text-runtime/sessions/${sessionId}/use`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, targetId }),
  });
  if (!response.ok) throw await toRuntimeError(response, 'Не удалось использовать предмет');
  return await response.json() as RuntimeSnapshot;
}

export async function interactTextRuntime(sessionId: string, targetId: string): Promise<RuntimeActionResult> {
  const response = await authFetch(`/api/text-runtime/sessions/${sessionId}/interact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId }),
  });
  if (!response.ok) throw await toRuntimeError(response, 'Не удалось выполнить взаимодействие');
  return await response.json() as RuntimeActionResult;
}

export async function inspectTargetTextRuntime(sessionId: string, targetId: string): Promise<string> {
  const response = await authFetch(`/api/text-runtime/sessions/${sessionId}/inspect-target`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId }),
  });
  if (!response.ok) throw await toRuntimeError(response, 'Не удалось осмотреть цель');
  const payload = await response.json() as { description?: string };
  return payload.description ?? '';
}

export type RuntimeGenerationStatus = {
  sessionId: string;
  sceneId: string;
  sceneGenerated: boolean;
  actionsGenerated: boolean;
  generatedSceneText: string | null;
  generatedActions: RuntimeGeneratedAction[];
};

export type RuntimeGeneratedAction = {
  id: string;
  label: string;
  targetId: string | null;
};

export async function generateSceneTextRuntime(sessionId: string): Promise<RuntimeGenerationStatus> {
  const response = await authFetch(`/api/text-runtime/sessions/${sessionId}/generate-scene`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await toRuntimeError(response, 'Не удалось сгенерировать сцену');
  return await response.json() as RuntimeGenerationStatus;
}

export async function generateActionsTextRuntime(sessionId: string): Promise<RuntimeGenerationStatus> {
  const response = await authFetch(`/api/text-runtime/sessions/${sessionId}/generate-actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await toRuntimeError(response, 'Не удалось сгенерировать действия');
  return await response.json() as RuntimeGenerationStatus;
}

export async function generationStatusTextRuntime(sessionId: string): Promise<RuntimeGenerationStatus> {
  const response = await authFetch(`/api/text-runtime/sessions/${sessionId}/generation-status`);
  if (!response.ok) throw await toRuntimeError(response, 'Не удалось получить статус генерации');
  return await response.json() as RuntimeGenerationStatus;
}
