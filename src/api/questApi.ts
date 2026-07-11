import { authFetch } from './http';
import type { QuestGameView, QuestMapView, QuestSummary, StartQuestResponse, UploadQuestResponse } from '../types/quest';

export async function getQuests(): Promise<QuestSummary[]> {
  const response = await authFetch('/api/quests');
  if (!response.ok) {
    throw new Error(`Failed to load quests (${response.status})`);
  }
  const raw = await response.json();
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeQuestSummary);
}

export async function startQuest(questId: string): Promise<StartQuestResponse> {
  const response = await authFetch(`/api/quests/${questId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to start quest (${response.status})`);
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return {
    sessionId: String(raw.sessionId ?? ''),
    game: normalizeGameView(raw.game),
  };
}

export async function getQuestSession(sessionId: string): Promise<QuestGameView> {
  const response = await authFetch(`/api/quests/sessions/${sessionId}`);
  if (!response.ok) {
    throw new Error(`Failed to load quest session (${response.status})`);
  }
  return normalizeGameView(await response.json());
}

export async function chooseQuestOption(sessionId: string, optionId: string): Promise<QuestGameView> {
  const response = await authFetch(`/api/quests/sessions/${sessionId}/choose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to choose option (${response.status})`);
  }
  return normalizeGameView(await response.json());
}

export async function goBackQuest(sessionId: string): Promise<QuestGameView> {
  const response = await authFetch(`/api/quests/sessions/${sessionId}/back`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to go back (${response.status})`);
  }
  return normalizeGameView(await response.json());
}

export async function getQuestMap(sessionId: string): Promise<QuestMapView> {
  const response = await authFetch(`/api/quests/sessions/${sessionId}/map`);
  if (!response.ok) {
    throw new Error(`Failed to load quest map (${response.status})`);
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return {
    currentNodeId: String(raw.currentNodeId ?? ''),
    visited: (Array.isArray(raw.visited) ? raw.visited : []).map((value) => String(value)),
    available: (Array.isArray(raw.available) ? raw.available : []).map((value) => String(value)),
  };
}

export async function uploadQuestFile(file: File): Promise<UploadQuestResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await authFetch('/api/quests', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let details = `Failed to upload quest (${response.status})`;
    try {
      const errorBody = (await response.json()) as Record<string, unknown>;
      if (typeof errorBody.message === 'string' && errorBody.message.trim().length > 0) {
        details = errorBody.message;
      }
    } catch {
      // ignore invalid error payloads
    }
    throw new Error(details);
  }

  const raw = (await response.json()) as Record<string, unknown>;
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
  };
}

function normalizeQuestSummary(value: unknown): QuestSummary {
  const raw = (value ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
  };
}

function normalizeGameView(value: unknown): QuestGameView {
  const raw = (value ?? {}) as Record<string, unknown>;
  const optionsRaw = Array.isArray(raw.options) ? raw.options : [];
  const inventoryRaw = Array.isArray(raw.inventory) ? raw.inventory : [];
  const variablesRaw = raw.variables && typeof raw.variables === 'object'
    ? (raw.variables as Record<string, unknown>)
    : {};
  return {
    title: String(raw.title ?? ''),
    nodeId: String(raw.nodeId ?? ''),
    nodeTitle: String(raw.nodeTitle ?? ''),
    text: String(raw.text ?? ''),
    options: optionsRaw.map((option) => {
      const optionRaw = (option ?? {}) as Record<string, unknown>;
      return {
        id: String(optionRaw.id ?? ''),
        text: String(optionRaw.text ?? ''),
      };
    }),
    inventory: inventoryRaw.map((item) => String(item)),
    variables: Object.fromEntries(
      Object.entries(variablesRaw).map(([key, value]) => [key, String(value)]),
    ),
    visitedNodes: (Array.isArray(raw.visitedNodes) ? raw.visitedNodes : []).map((value) => String(value)),
    canGoBack: Boolean(raw.canGoBack),
    finished: Boolean(raw.finished),
  };
}
