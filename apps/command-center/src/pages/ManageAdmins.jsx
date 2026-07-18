import { useState } from 'react';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { registerUser } from '../services/firebaseService';
import { useToast } from '../hooks/useToast';
import Button from '../components/UI/Button';

const initialForm = {
  name: '',
  age: '',
  email: '',
  password: '',
  phone: '',
  place: '',
  district: '',
  address: '',
  designation: '',
};

export default function ManageAdmins() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.phone) {
      showToast('Please fill all required fields.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await registerUser(form.email, form.password, 'admin', {
        name: form.name.trim(),
        age: form.age,
        phone: form.phone,
        place: form.place,
        district: form.district,
        address: form.address,
        designation: form.designation,
        addedBy: 'Main Admin',
      });
      showToast('Local admin added successfully.', 'success');
      setForm(initialForm);
    } catch (error) {
      showToast(error.message || 'Failed to add admin.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary-300 focus:outline-none transition-colors';

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary-600" />
          Manage Admins
        </h1>
        <p className="mt-2 text-slate-500">Add local level administrators to manage their regions.</p>
      </div>

      <div className="rounded-[28px] bg-white p-8 shadow-card">
        <div className="flex items-center gap-3 mb-8">
          <div className="rounded-xl bg-primary-50 p-2 text-primary-600">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy">Add New Admin</h2>
            <p className="text-sm text-slate-500">Fill in the complete details for the new local administrator.</p>
          </div>
        </div>

        <form onSubmit={handleAddAdmin} className="space-y-8">
          {/* Account Credentials */}
          <fieldset>
            <legend className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Account Credentials
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Email <span className="text-red-500">*</span>
                </span>
                <input type="email" required value={form.email} onChange={update('email')} className={inputClass} placeholder="admin@ernakulam.gov" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Temporary Password <span className="text-red-500">*</span>
                </span>
                <input type="password" required value={form.password} onChange={update('password')} className={inputClass} placeholder="••••••••" minLength={6} />
              </label>
            </div>
          </fieldset>

          {/* Personal Information */}
          <fieldset>
            <legend className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Personal Information
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                </span>
                <input type="text" required value={form.name} onChange={update('name')} className={inputClass} placeholder="e.g. Rajan Menon" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Age</span>
                <input type="number" value={form.age} onChange={update('age')} className={inputClass} placeholder="e.g. 35" min={18} max={100} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Contact Number <span className="text-red-500">*</span>
                </span>
                <div className="flex overflow-hidden rounded-2xl border border-slate-200">
                  <span className="flex items-center bg-slate-50 px-4 text-sm text-slate-500">+91</span>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                    className="w-full px-4 py-3 text-sm focus:outline-none"
                    placeholder="9876543210"
                    maxLength={10}
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Designation / Role</span>
                <input type="text" value={form.designation} onChange={update('designation')} className={inputClass} placeholder="e.g. District Coordinator" />
              </label>
            </div>
          </fieldset>

          {/* Location Details */}
          <fieldset>
            <legend className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Location Details
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Place / Town</span>
                <input type="text" value={form.place} onChange={update('place')} className={inputClass} placeholder="e.g. Kothamangalam" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">District</span>
                <input type="text" value={form.district} onChange={update('district')} className={inputClass} placeholder="e.g. Ernakulam" />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Full Address</span>
              <textarea
                value={form.address}
                onChange={update('address')}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary-300 focus:outline-none transition-colors resize-none"
                placeholder="House name / number, street, PO, PIN code"
              />
            </label>
          </fieldset>

          <div className="flex justify-end border-t border-slate-100 pt-6">
            <Button type="submit" className="px-8" loading={loading}>
              Create Admin Account
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
