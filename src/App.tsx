import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { ConceptPage } from './pages/ConceptPage';
import { GoalsPage } from './pages/GoalsPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { HomePage } from './pages/HomePage';
import { LearningPage } from './pages/LearningPage';
import { LoginPage } from './pages/LoginPage';
import { NodeGeneratorPage } from './pages/NodeGeneratorPage';
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
        <Route path="/" element={<Navigate to="/quests" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/programs/concepts/:conceptId" element={<ConceptPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/quests" element={<QuestsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/generator" element={<GeneratorPage />} />
        <Route path="/node-generator" element={<NodeGeneratorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/quests" replace />} />
      </Routes>
    </AppLayout>
  );
}
