import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Loader from './components/common/Loader';
import { UPCOMING_FEATURES } from './utils/upcomingFeatures';

// Route-level code splitting: each page loads on demand, keeping the initial
// bundle small. Vite emits one chunk per page.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const NotesListPage = lazy(() => import('./pages/NotesListPage'));
const NoteDetailPage = lazy(() => import('./pages/NoteDetailPage'));
const NoteEditorPage = lazy(() => import('./pages/NoteEditorPage'));
const AlbumsListPage = lazy(() => import('./pages/AlbumsListPage'));
const PlannerPage = lazy(() => import('./pages/PlannerPage'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
const IntelligencePage = lazy(() => import('./pages/IntelligencePage'));
const ResumePage = lazy(() => import('./pages/ResumePage'));
const ResumePreviewPage = lazy(() => import('./pages/ResumePreviewPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const ComingSoonPage = lazy(() => import('./pages/ComingSoonPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminStudentsPage = lazy(() => import('./pages/admin/AdminStudentsPage'));
const AdminAnnouncementsPage = lazy(() => import('./pages/admin/AdminAnnouncementsPage'));
const AdminLogsPage = lazy(() => import('./pages/admin/AdminLogsPage'));
const AdminReferralsPage = lazy(() => import('./pages/admin/AdminReferralsPage'));
const AdminArchivePage = lazy(() => import('./pages/admin/AdminArchivePage'));
const CreatorPage = lazy(() => import('./pages/CreatorPage'));
const JournalPage = lazy(() => import('./pages/JournalPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const EntertainmentPage = lazy(() => import('./pages/EntertainmentPage'));
const EntertainmentDetailPage = lazy(() => import('./pages/EntertainmentDetailPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

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
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
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
                <Route path="/admin/students" element={<AdminRoute><AdminStudentsPage /></AdminRoute>} />
                <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncementsPage /></AdminRoute>} />
                <Route path="/admin/logs" element={<AdminRoute><AdminLogsPage /></AdminRoute>} />
                <Route path="/admin/referrals" element={<AdminRoute><AdminReferralsPage /></AdminRoute>} />
                <Route path="/admin/archive" element={<AdminRoute><AdminArchivePage /></AdminRoute>} />
                <Route path="/journal" element={<AdminRoute><JournalPage /></AdminRoute>} />
                <Route path="/entertainment" element={<EntertainmentPage />} />
                <Route path="/entertainment/:category/:slug" element={<EntertainmentDetailPage />} />
                <Route path="/about" element={<AboutPage />} />
                {UPCOMING_FEATURES.map((f) => (
                  <Route key={f.slug} path={`/${f.slug}`} element={<ComingSoonPage feature={f} />} />
                ))}
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
