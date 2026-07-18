import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/firebaseService';
import { useToast } from '../hooks/useToast';
import Button from '../components/UI/Button';

export default function AdminSetup() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSetup = async () => {
    setLoading(true);
    try {
      await registerUser('admin@example.com', 'password', 'admin', {
        name: 'Main Admin',
      });
      showToast('Admin setup successfully! Email: admin@example.com, Password: password', 'success');
      navigate('/login');
    } catch (error) {
      showToast(error.message || 'Setup failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-card text-center">
        <h1 className="text-2xl font-bold text-navy">Initialize System Admin</h1>
        <p className="mt-4 text-slate-600 text-sm">
          Click the button below to create the main admin account with the requested credentials.
          This route should be removed in production.
        </p>
        <Button onClick={handleSetup} loading={loading} className="mt-8 w-full">
          Create Admin Account
        </Button>
      </div>
    </main>
  );
}
