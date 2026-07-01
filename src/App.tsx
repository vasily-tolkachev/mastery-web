import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { ConceptPage } from './pages/ConceptPage';
import { GoalsPage } from './pages/GoalsPage';
import { HomePage } from './pages/HomePage';
import { LearningPage } from './pages/LearningPage';
import { ProgramsPage } from './pages/ProgramsPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/programs/concepts/:conceptId" element={<ConceptPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AppLayout>
  );
}
