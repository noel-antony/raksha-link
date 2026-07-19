import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import IncidentDetails from './pages/IncidentDetails';
import ReportIncident from './pages/ReportIncident';
import About from './pages/About';
import VolunteerDirectory from './pages/VolunteerDirectory';
import MissionManagement from './pages/MissionManagement';
import { ToastProvider } from './hooks/useToast';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen bg-background text-secondary-900">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/report" element={<ReportIncident />} />
              <Route path="/incidents/:id" element={<IncidentDetails />} />
              <Route path="/volunteers" element={<VolunteerDirectory />} />
              <Route path="/register" element={<Register />} />
              <Route path="/missions" element={<MissionManagement />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
