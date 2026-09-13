import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { t } from './lib/i18n';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route
          path="/courses"
          element={<PlaceholderPage title={t('placeholders.courses')} description={t('placeholders.description')} />}
        />
        <Route
          path="/tasks"
          element={<PlaceholderPage title={t('placeholders.tasks')} description={t('placeholders.description')} />}
        />
        <Route
          path="/profile"
          element={<PlaceholderPage title={t('placeholders.profile')} description={t('placeholders.description')} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
