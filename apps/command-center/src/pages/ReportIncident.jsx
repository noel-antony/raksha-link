import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import Button from '../components/UI/Button';
import { useToast } from '../hooks/useToast';
import { api } from '../services/api';

export default function ReportIncident() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'high',
    imageUrl: '',
    location: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
        }));
        setErrors(prev => ({ ...prev, location: null }));
        showToast('Location captured successfully', 'success');
      },
      () => {
        showToast('Unable to capture location. Please allow permissions.', 'error');
      }
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image must be less than 2MB', 'error');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setForm(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Title is required';
    if (!form.description.trim()) nextErrors.description = 'Description is required';
    if (!form.location) nextErrors.location = 'Location is required to route responders';
    
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        severity: form.severity,
        imageUrl: form.imageUrl,
        location: form.location,
      };
      
      const newIncident = await api.createIncident(payload);
      showToast('Incident reported successfully. AI analysis complete.', 'success');
      navigate(`/incidents/${newIncident.id || newIncident.incidentId || newIncident._id}`);
    } catch (error) {
      showToast(error.message || 'Failed to submit incident', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-secondary-900">Report an Incident</h1>
        <p className="mt-2 text-secondary-500">
          Submit details about the emergency. RakshaLink's AI will immediately analyze the situation and coordinate a response.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-secondary-700">Incident Title</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-2xl border border-border px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200"
              placeholder="e.g., Flash flood on Main St"
              disabled={loading}
            />
            {errors.title && <p className="mt-2 text-sm text-danger">{errors.title}</p>}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-secondary-700">Detailed Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-2xl border border-border px-4 py-3 min-h-[120px] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200"
              placeholder="Describe the situation, how many people are affected, and what kind of help is needed..."
              disabled={loading}
            />
            {errors.description && <p className="mt-2 text-sm text-danger">{errors.description}</p>}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-secondary-700">Perceived Severity</span>
              <div className="relative">
                <AlertTriangle className="absolute left-3 top-3 h-5 w-5 text-secondary-400" />
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="w-full appearance-none rounded-2xl border border-border bg-background pl-10 pr-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 cursor-pointer"
                  disabled={loading}
                >
                  <option value="low">Low - Non-life threatening</option>
                  <option value="medium">Medium - Urgent assistance needed</option>
                  <option value="high">High - Severe property damage/injuries</option>
                  <option value="critical">Critical - Immediate life threat</option>
                </select>
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-secondary-700">Incident Image (Optional)</span>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-3 h-5 w-5 text-secondary-400" />
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleImageChange}
                  className="w-full rounded-2xl border border-border bg-white pl-10 pr-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  disabled={loading}
                />
              </div>
              {form.imageUrl && (
                <div className="mt-3 overflow-hidden rounded-xl border border-border bg-background">
                  <img src={form.imageUrl} alt="Preview" className="h-24 w-full object-cover" />
                </div>
              )}
            </label>
          </div>

          <div className="rounded-xl border border-dashed border-border bg-background p-5">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-secondary-900">Incident Location</p>
                <p className="text-sm text-secondary-500">Required for matching nearby volunteers</p>
              </div>
            </div>
            
            <Button type="button" variant="secondary" onClick={handleLocation} disabled={loading || form.location}>
              {form.location ? 'Location Captured' : 'Share Current Location'}
            </Button>
            
            {form.location && (
              <p className="mt-3 text-sm text-primary-700 font-medium bg-primary-50 px-3 py-2 rounded-lg inline-block">
                Lat: {form.location.lat.toFixed(6)}, Lng: {form.location.lng.toFixed(6)}
              </p>
            )}
            {errors.location && <p className="mt-2 text-sm text-danger">{errors.location}</p>}
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <Button type="submit" loading={loading} className="w-full justify-center">
            Submit Report & Run AI Analysis
          </Button>
          <p className="mt-3 text-center text-xs text-secondary-500">
            By submitting, you confirm this is a real emergency. False reports delay response to true crises.
          </p>
        </div>
      </form>
    </main>
  );
}
