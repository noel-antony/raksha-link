import { CheckCircle2, KeyRound, MapPin, Shield, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import Button from '../components/UI/Button';
import { useToast } from '../hooks/useToast';
import { encryptData, deriveEncryptionKey } from '../services/encryptionService';
import { saveVolunteer, registerUser } from '../services/firebaseService';

const skillOptions = ['Doctor', 'Nurse', 'Electrician', 'Swimmer', 'Driver', 'Translator', 'First Aid', 'Construction'];
const assetOptions = ['Boat', 'Generator', '4x4 Vehicle', 'First Aid Kit', 'Chainsaw', 'Rope & Rescue Gear'];
const languageOptions = ['Malayalam', 'Tamil', 'English', 'Hindi', 'Kannada'];

const initialForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  livesInKerala: true,
  skills: [],
  assets: [],
  languages: [],
  privacyEnabled: true,
  location: null,
};

function ToggleChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium ${
        active
          ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-700'
      }`}
    >
      {label}
    </button>
  );
}

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [volunteerId, setVolunteerId] = useState('');
  const { showToast } = useToast();

  const maskedVolunteerId = useMemo(() => {
    if (!volunteerId) {
      return '';
    }
    return `V-${volunteerId.slice(-8, -4).toUpperCase()}-${volunteerId.slice(-4).toUpperCase()}`;
  }, [volunteerId]);

  const updateArrayField = (field, value) => {
    setForm((current) => {
      const exists = current[field].includes(value);
      return {
        ...current,
        [field]: exists ? current[field].filter((item) => item !== value) : [...current[field], value],
      };
    });
  };

  const validateStep = (targetStep) => {
    const nextErrors = {};

    if (targetStep === 1) {
      if (!form.name.trim()) {
        nextErrors.name = 'Name is required.';
      }
      if (!form.email.trim() || !form.email.includes('@')) {
        nextErrors.email = 'Valid email is required.';
      }
      if (form.password.length < 6) {
        nextErrors.password = 'Password must be at least 6 characters.';
      }
      if (!/^[6-9]\d{9}$/.test(form.phone)) {
        nextErrors.phone = 'Enter a valid 10-digit Indian mobile number.';
      }
      if (!form.livesInKerala) {
        nextErrors.livesInKerala = 'SentinelOS currently serves Kerala only.';
      }
    }

    if (targetStep === 2) {
      if (form.skills.length === 0) {
        nextErrors.skills = 'Select at least one skill.';
      }
      if (form.languages.length === 0) {
        nextErrors.languages = 'Select at least one language.';
      }
    }

    if (targetStep === 3) {
      if (!form.location) {
        nextErrors.location = 'Location access is required for responder matching.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((current) => Math.min(current + 1, 4));
    }
  };

  const handleLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported in this browser.', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        }));
        setErrors((current) => ({ ...current, location: '' }));
        showToast('Location captured successfully.', 'success');
      },
      () => {
        showToast('Unable to access location. Please allow location permission and try again.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async () => {
    const personalValid = validateStep(1);
    if (!personalValid) {
      setStep(1);
      return;
    }

    const skillsValid = validateStep(2);
    if (!skillsValid) {
      setStep(2);
      return;
    }

    const privacyValid = validateStep(3);
    if (!privacyValid) {
      setStep(3);
      return;
    }

    setSubmitting(true);
    try {
      const authUser = await registerUser(form.email, form.password, 'volunteer', {
        name: form.name.trim(),
        phone: form.phone,
      });

      const generatedId = authUser.uid;
      const phoneWithCode = `+91${form.phone}`;
      const key = deriveEncryptionKey(phoneWithCode);
      const profile = {
        id: generatedId,
        name: form.name.trim(),
        phone: phoneWithCode,
        skills: form.skills,
        assets: form.assets,
        languages: form.languages,
        lat: form.location.lat,
        lng: form.location.lng,
        available: true,
        breakGlassLocked: form.privacyEnabled,
        registeredAt: new Date().toISOString().split('T')[0],
      };
      const encryptedPayload = encryptData(profile, key);

      if (!encryptedPayload) {
        throw new Error('Unable to secure your registration data.');
      }

      await saveVolunteer({
        id: generatedId,
        encryptedPayload,
        profile: {
          id: generatedId,
          name: profile.name,
          skills: profile.skills,
          assets: profile.assets,
          languages: profile.languages,
          lat: profile.lat,
          lng: profile.lng,
          available: true,
          breakGlassLocked: form.privacyEnabled,
          registeredAt: profile.registeredAt,
        },
        phone: phoneWithCode,
        breakGlassLocked: form.privacyEnabled,
        createdAt: new Date().toISOString(),
      });

      setVolunteerId(generatedId);
      setStep(4);
      showToast('Responder registration completed successfully.', 'success');
    } catch (error) {
      showToast(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[28px] bg-gradient-to-br from-navy via-slate to-primary-700 p-8 text-white shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary-100">Responder Onboarding</p>
          <h1 className="mt-4 text-4xl font-bold">Register to protect your neighborhood.</h1>
          <p className="mt-4 max-w-md text-white/80">
            Add your skills, assets, and languages so SentinelOS can match you quickly when floods or emergencies hit your area.
          </p>
          <div className="mt-8 space-y-4">
            {[
              { icon: UserRound, title: 'Personal details', done: step > 1 },
              { icon: Shield, title: 'Skills and capabilities', done: step > 2 },
              { icon: KeyRound, title: 'Break-Glass privacy', done: step > 3 },
              { icon: CheckCircle2, title: 'Confirmation', done: step > 4 || step === 4 },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      item.done ? 'bg-white text-primary-600' : step === index + 1 ? 'bg-primary-100 text-primary-700' : 'bg-white/15 text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-white/70">Step {index + 1} of 4</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-card sm:p-8">
          {step !== 4 && (
            <div className="mb-6">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary-500" style={{ width: `${(step / 4) * 100}%` }} />
              </div>
              <p className="mt-3 text-sm text-slate-500">Step {step} of 4</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-navy">Personal Info</h2>
                <p className="mt-2 text-slate-500">Tell us how to identify you as a local community responder.</p>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-primary-300 focus:outline-none"
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-primary-300 focus:outline-none"
                  placeholder="Enter your email"
                />
                {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-primary-300 focus:outline-none"
                  placeholder="••••••••"
                />
                {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Phone</span>
                <div className="flex overflow-hidden rounded-2xl border border-slate-200">
                  <span className="flex items-center bg-slate-50 px-4 text-slate-500">+91</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value.replace(/\D/g, '') }))}
                    className="w-full px-4 py-3 focus:outline-none"
                    placeholder="9876543210"
                    maxLength={10}
                  />
                </div>
                {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone}</p>}
              </label>
              <div>
                <span className="mb-3 block text-sm font-medium text-slate-700">Live in Kerala?</span>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={form.livesInKerala ? 'primary' : 'secondary'}
                    onClick={() => setForm((current) => ({ ...current, livesInKerala: true }))}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={!form.livesInKerala ? 'danger' : 'secondary'}
                    onClick={() => setForm((current) => ({ ...current, livesInKerala: false }))}
                  >
                    No
                  </Button>
                </div>
                {!form.livesInKerala && <p className="mt-3 text-sm text-red-600">SentinelOS currently serves Kerala only.</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-navy">Skills & Assets</h2>
                <p className="mt-2 text-slate-500">Pick every capability that could help your community during an emergency.</p>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-slate-700">Skills</p>
                <div className="flex flex-wrap gap-3">
                  {skillOptions.map((skill) => (
                    <ToggleChip key={skill} label={skill} active={form.skills.includes(skill)} onClick={() => updateArrayField('skills', skill)} />
                  ))}
                </div>
                {errors.skills && <p className="mt-2 text-sm text-red-600">{errors.skills}</p>}
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-slate-700">Assets</p>
                <div className="flex flex-wrap gap-3">
                  {assetOptions.map((asset) => (
                    <ToggleChip key={asset} label={asset} active={form.assets.includes(asset)} onClick={() => updateArrayField('assets', asset)} />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-slate-700">Languages spoken</p>
                <div className="flex flex-wrap gap-3">
                  {languageOptions.map((language) => (
                    <ToggleChip
                      key={language}
                      label={language}
                      active={form.languages.includes(language)}
                      onClick={() => updateArrayField('languages', language)}
                    />
                  ))}
                </div>
                {errors.languages && <p className="mt-2 text-sm text-red-600">{errors.languages}</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-navy">Break-Glass Privacy</h2>
                <p className="mt-2 text-slate-500">Your data remains private until a formal emergency requires minimum necessary access.</p>
              </div>
              <div className="rounded-3xl border border-primary-100 bg-primary-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-white p-3 text-primary-600 shadow-sm">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-navy">Protected by default</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Your data stays encrypted at all times. It will only be accessed — with your consent — when a government official
                      declares a formal emergency. Only your relevant skill will be shared. Your name and phone number will NEVER be shown
                      to other volunteers.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <div>
                  <p className="font-medium text-slate-800">Privacy lock</p>
                  <p className="text-sm text-slate-500">Keep Break-Glass protection enabled</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, privacyEnabled: !current.privacyEnabled }))}
                  className={`relative h-8 w-14 rounded-full ${form.privacyEnabled ? 'bg-primary-500' : 'bg-slate-300'}`}
                >
                  <span
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${
                      form.privacyEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 p-5">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary-600" />
                  <div>
                    <p className="font-medium text-slate-800">Location permission</p>
                    <p className="text-sm text-slate-500">Needed for responder matching within your local radius.</p>
                  </div>
                </div>
                <Button type="button" className="mt-4" variant="secondary" onClick={handleLocation}>
                  {form.location ? 'Location captured' : 'Allow location access'}
                </Button>
                {form.location && (
                  <p className="mt-3 text-sm text-green-700">
                    Latitude {form.location.lat.toFixed(4)}, Longitude {form.location.lng.toFixed(4)}
                  </p>
                )}
                {errors.location && <p className="mt-2 text-sm text-red-600">{errors.location}</p>}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-700">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="mt-6 text-3xl font-bold text-navy">Your community thanks you</h2>
              <p className="mt-3 max-w-md text-slate-600">
                You are now registered as a protected SentinelOS responder. Your profile is encrypted and ready for crisis matching.
              </p>
              <div className="mt-8 w-full max-w-md rounded-3xl border border-slate-100 bg-slate-50 p-6 shadow-sm">
                <p className="text-sm text-slate-500">Volunteer ID</p>
                <p className="mt-2 font-heading text-2xl font-bold text-primary-700">{maskedVolunteerId}</p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Privacy guarantee: Only minimum necessary responder data is revealed during a declared emergency, and every access is
                  logged for audit.
                </p>
              </div>
              <Button type="button" className="mt-8" onClick={() => navigator.share?.({ title: 'SentinelOS', text: 'Join SentinelOS and strengthen local crisis response in Kerala.', url: window.location.origin })}>
                Share SentinelOS
              </Button>
            </div>
          )}

          {step !== 4 && (
            <div className="mt-8 flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1}>
                Back
              </Button>
              {step < 3 && <Button type="button" onClick={handleNext}>Continue</Button>}
              {step === 3 && (
                <Button type="button" onClick={handleSubmit} loading={submitting}>
                  Complete registration
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
