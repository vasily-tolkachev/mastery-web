import { authFetch } from './http';
import type { QuestGameView, QuestSessionSnapshot, QuestSummary, StartQuestResponse, UploadQuestResponse } from '../types/quest';

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
  const response = await authFetch(`/api/quests/${questId}/play`, {
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

export async function proceedQuestSession(sessionId: string): Promise<StartQuestResponse> {
  const response = await authFetch(`/api/quests/sessions/${sessionId}/proceed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to proceed quest session (${response.status})`);
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return {
    sessionId: String(raw.sessionId ?? ''),
    game: normalizeGameView(raw.game),
  };
}

export async function getMyQuestSessions(): Promise<QuestSessionSnapshot[]> {
  const response = await authFetch('/api/quests/sessions');
  if (!response.ok) {
    throw new Error(`Failed to load quest sessions (${response.status})`);
  }
  const raw = await response.json();
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeSessionSnapshot);
}

export async function chooseQuestOption(sessionId: string, optionId: string): Promise<QuestGameView> {
  const response = await authFetch(`/api/quests/sessions/${sessionId}/options/${optionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to choose option (${response.status})`);
  }
  return normalizeGameView(await response.json());
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

function normalizeSessionSnapshot(value: unknown): QuestSessionSnapshot {
  const raw = (value ?? {}) as Record<string, unknown>;
  const stateRaw = (raw.gameState ?? {}) as Record<string, unknown>;
  const varsRaw = stateRaw.variables && typeof stateRaw.variables === 'object'
    ? (stateRaw.variables as Record<string, unknown>)
    : {};

  return {
    sessionId: String(raw.sessionId ?? ''),
    questId: String(raw.questId ?? ''),
    questTitle: String(raw.questTitle ?? ''),
    status: String(raw.status ?? ''),
    gameState: {
      currentNodeId: String(stateRaw.currentNodeId ?? ''),
      facts: (Array.isArray(stateRaw.facts) ? stateRaw.facts : []).map((value) => String(value)),
      variables: Object.fromEntries(Object.entries(varsRaw).map(([k, v]) => [k, String(v)])),
      inventory: (Array.isArray(stateRaw.inventory) ? stateRaw.inventory : []).map((value) => String(value)),
      visitedNodes: (Array.isArray(stateRaw.visitedNodes) ? stateRaw.visitedNodes : []).map((value) => String(value)),
      navigationHistory: (Array.isArray(stateRaw.navigationHistory) ? stateRaw.navigationHistory : []).map((value) => String(value)),
    },
  };
}
