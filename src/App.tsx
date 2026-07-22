import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { ConceptPage } from './pages/ConceptPage';
import { GoalsPage } from './pages/GoalsPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { HomePage } from './pages/HomePage';
import { LearningPage } from './pages/LearningPage';
import { LoginPage } from './pages/LoginPage';
import { NodeGeneratorProjectsPage } from './pages/NodeGeneratorProjectsPage';
import { NodeGeneratorProjectHomePage } from './pages/NodeGeneratorProjectHomePage';
import { NodeGeneratorScenePage } from './pages/NodeGeneratorScenePage';
import { NodeGeneratorSceneFlowPage } from './pages/NodeGeneratorSceneFlowPage';
import { NodeGeneratorKnowledgePage } from './pages/NodeGeneratorKnowledgePage';
import { NodeGeneratorExpansionReviewPage } from './pages/NodeGeneratorExpansionReviewPage';
import { ProgramsPage } from './pages/ProgramsPage';
import { ProgressPage } from './pages/ProgressPage';
import { QuestsPage } from './pages/QuestsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/node-generator" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/programs/concepts/:conceptId" element={<ConceptPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/quests" element={<QuestsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/generator" element={<GeneratorPage />} />
        <Route path="/node-generator" element={<NodeGeneratorProjectsPage />} />
        <Route path="/node-generator/projects/:projectId" element={<NodeGeneratorProjectHomePage />} />
        <Route path="/node-generator/projects/:projectId/scenes/:sceneId" element={<NodeGeneratorScenePage />} />
        <Route path="/node-generator/projects/:projectId/scenes/:sceneId/generate" element={<NodeGeneratorSceneFlowPage />} />
        <Route path="/node-generator/projects/:projectId/knowledge" element={<NodeGeneratorKnowledgePage />} />
        <Route path="/node-generator/projects/:projectId/expansion" element={<NodeGeneratorExpansionReviewPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/node-generator" replace />} />
      </Routes>
    </AppLayout>
  );
}
