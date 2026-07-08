import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotesListPage from './pages/NotesListPage';
import NoteDetailPage from './pages/NoteDetailPage';
import NoteEditorPage from './pages/NoteEditorPage';
import AlbumsListPage from './pages/AlbumsListPage';
import AlbumDetailPage from './pages/AlbumDetailPage';
import PlannerPage from './pages/PlannerPage';
import FinancePage from './pages/FinancePage';
import ResumePage from './pages/ResumePage';
import ResumePreviewPage from './pages/ResumePreviewPage';
import SupportPage from './pages/SupportPage';

function AppLayout() {
  return (
    <ProtectedRoute>
      <Navbar />
      <Outlet />
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
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/notes" element={<NotesListPage />} />
              <Route path="/notes/new" element={<NoteEditorPage />} />
              <Route path="/notes/:id" element={<NoteDetailPage />} />
              <Route path="/notes/:id/edit" element={<NoteEditorPage />} />
              <Route path="/albums" element={<AlbumsListPage />} />
              <Route path="/albums/:id" element={<AlbumDetailPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/resume" element={<ResumePage />} />
              <Route path="/resume/preview" element={<ResumePreviewPage />} />
              <Route path="/support" element={<SupportPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
