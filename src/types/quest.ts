export type QuestSummary = {
  id: string;
  title: string;
};

export type QuestOption = {
  id: string;
  text: string;
};

export type QuestGameView = {
  title: string;
  nodeId: string;
  nodeTitle: string;
  text: string;
  options: QuestOption[];
  inventory: string[];
  variables: Record<string, string>;
  visitedNodes: string[];
  canGoBack: boolean;
  finished: boolean;
};

export type StartQuestResponse = {
  sessionId: string;
  game: QuestGameView;
};

export type QuestSessionState = {
  currentNodeId: string;
  facts: string[];
  variables: Record<string, string>;
  inventory: string[];
  visitedNodes: string[];
  navigationHistory: string[];
};

export type QuestSessionSnapshot = {
  sessionId: string;
  questId: string;
  questTitle: string;
  status: string;
  gameState: QuestSessionState;
};

export type UploadQuestResponse = {
  id: string;
  title: string;
};
