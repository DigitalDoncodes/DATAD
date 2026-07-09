import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotesListPage from './pages/NotesListPage';
import NoteDetailPage from './pages/NoteDetailPage';
import NoteEditorPage from './pages/NoteEditorPage';
import AlbumsListPage from './pages/AlbumsListPage';
import PlannerPage from './pages/PlannerPage';
import FinancePage from './pages/FinancePage';
import IntelligencePage from './pages/IntelligencePage';
import ResumePage from './pages/ResumePage';
import ResumePreviewPage from './pages/ResumePreviewPage';
import SupportPage from './pages/SupportPage';
import ComingSoonPage from './pages/ComingSoonPage';
import AdminPage from './pages/AdminPage';
import CreatorPage from './pages/CreatorPage';
import JournalPage from './pages/JournalPage';
import SettingsPage from './pages/SettingsPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import { UPCOMING_FEATURES } from './utils/upcomingFeatures';
import { useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppLayout() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-center" />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/creator" element={<CreatorPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/notes" element={<NotesListPage />} />
              <Route path="/notes/new" element={<NoteEditorPage />} />
              <Route path="/notes/:id" element={<NoteDetailPage />} />
              <Route path="/notes/:id/edit" element={<NoteEditorPage />} />
              <Route path="/albums" element={<AlbumsListPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/news" element={<IntelligencePage />} />
              <Route path="/resume" element={<ResumePage />} />
              <Route path="/resume/preview" element={<ResumePreviewPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
              <Route path="/journal" element={<AdminRoute><JournalPage /></AdminRoute>} />
              {UPCOMING_FEATURES.map((f) => (
                <Route key={f.slug} path={`/${f.slug}`} element={<ComingSoonPage feature={f} />} />
              ))}
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
