import { authFetch } from './http';

export type RuntimeItem = {
  id: string;
  name: string;
};

export type RuntimeExit = {
  actionText: string;
  targetLocationId: string | null;
};

export type RuntimeSnapshot = {
  sessionId: string;
  currentLocationId: string;
  description: string;
  items: RuntimeItem[];
  exits: RuntimeExit[];
  inventory: RuntimeItem[];
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
