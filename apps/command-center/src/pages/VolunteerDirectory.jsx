import { useEffect, useState, useMemo } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Users, MapPin, Search, AlertTriangle, UserX, X, FileText, CheckCircle2, XCircle, RotateCcw, BrainCircuit } from 'lucide-react';
import { api } from '../services/api';
import Button from '../components/UI/Button';
import Skeleton from '../components/UI/Skeleton';
import EmptyState from '../components/UI/EmptyState';
import Badge from '../components/UI/Badge';

function CertBadge({ certificate }) {
  if (!certificate || !certificate.uploaded) return null;
  
  const status = certificate.verification?.status;
  const confidence = certificate.verification?.confidence || 0;
  
  if (status === 'Coordinator Approved') {
    return <Badge color="accent">✅ Approved</Badge>;
  }
  if (status === 'Rejected') {
    return <Badge color="danger">🔴 Rejected</Badge>;
  }
  if (status === 'AI Verified' && confidence >= 70) {
    return <Badge color="primary">🟢 AI Verified</Badge>;
  }
  if (status === 'Verification Failed' || confidence < 50) {
    return <Badge color="danger">🔴 Failed</Badge>;
  }
  return <Badge color="warning">🟡 Pending Review</Badge>;
}

export default function VolunteerDirectory() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVol, setSelectedVol] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const data = await api.getVolunteers();
      setVolunteers(data);
    } catch (err) {
      setError(err.message || 'Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVolunteers(); }, []);

  const filteredVolunteers = useMemo(() => {
    return volunteers.filter(v => 
      v.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [volunteers, searchTerm]);

  const handleReview = async (volunteerId, action) => {
    setReviewLoading(true);
    try {
      await api.reviewCertificate(volunteerId, action);
      await fetchVolunteers();
      // Refresh selected volunteer
      const updated = await api.getVolunteers();
      setVolunteers(updated);
      const refreshed = updated.find(v => v.id === volunteerId);
      if (refreshed) setSelectedVol(refreshed);
    } catch (err) {
      alert(err.message || 'Review action failed.');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-48 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-56 w-full rounded-2xl" />)}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center px-4">
        <EmptyState 
          icon={AlertTriangle} 
          title="Directory Sync Failed" 
          description={error} 
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Volunteer Directory</h1>
            <p className="mt-2 text-secondary-500">Manage registered community responders and their capabilities.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary-100 transition-shadow">
            <Search className="h-4 w-4 text-secondary-400" />
            <input 
              type="text" 
              placeholder="Search volunteers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none bg-transparent focus:outline-none text-sm w-48 text-secondary-900 placeholder:text-secondary-400"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVolunteers.length === 0 ? (
            <div className="col-span-full">
              <EmptyState 
                icon={UserX}
                title="No Responders Found"
                description="No volunteers match your search criteria."
              />
            </div>
          ) : (
            filteredVolunteers.map((volunteer) => (
              <article 
                key={volunteer.id} 
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated hover:border-primary-200 cursor-pointer"
                onClick={() => setSelectedVol(volunteer)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 text-secondary-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900">{volunteer.fullName}</h3>
                      <p className="text-xs font-mono text-secondary-400">ID: {volunteer.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <Badge color={volunteer.status === 'active' ? 'accent' : volunteer.status === 'busy' ? 'warning' : 'secondary'}>
                    {volunteer.status}
                  </Badge>
                </div>
                
                {/* Certificate Badge */}
                {volunteer.certificate?.uploaded && (
                  <div className="mb-4 flex items-center gap-2">
                    <CertBadge certificate={volunteer.certificate} />
                    {volunteer.certificate.verification?.skillCategory && (
                      <span className="text-xs font-medium text-secondary-500">{volunteer.certificate.verification.skillCategory}</span>
                    )}
                    {volunteer.certificate.verification?.confidence > 0 && (
                      <span className="ml-auto text-xs font-bold text-primary-600">{volunteer.certificate.verification.confidence}%</span>
                    )}
                  </div>
                )}

                <div className="mb-4 flex items-center gap-2 text-sm text-secondary-500">
                  <MapPin className="h-4 w-4 text-secondary-400" />
                  <span>Lat {volunteer.location?.lat?.toFixed(4)}, Lng {volunteer.location?.lng?.toFixed(4) || volunteer.location?.lon?.toFixed(4)}</span>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  {volunteer.skills?.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-400">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {volunteer.skills.map(skill => (
                          <span key={skill} className="rounded-md border border-primary-100 bg-primary-50 px-2 py-1 text-[10px] font-semibold uppercase text-primary-700">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {volunteer.assets?.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-400">Assets</p>
                      <div className="flex flex-wrap gap-1.5">
                        {volunteer.assets.map(asset => (
                          <span key={asset} className="rounded-md border border-border bg-secondary-50 px-2 py-1 text-[10px] font-semibold uppercase text-secondary-700">
                            {asset}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      {/* Detail Panel / Modal */}
      {selectedVol && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm" onClick={() => setSelectedVol(null)}>
          <div 
            className="h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-secondary-900">{selectedVol.fullName}</h2>
              <button onClick={() => setSelectedVol(null)} className="rounded-xl p-2 hover:bg-secondary-100 transition-colors">
                <X className="h-5 w-5 text-secondary-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="rounded-2xl border border-border p-5 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-400">Volunteer Info</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-secondary-500">Status</span><p className="font-medium text-secondary-900 capitalize">{selectedVol.status}</p></div>
                  <div><span className="text-secondary-500">Availability</span><p className="font-medium text-secondary-900">{selectedVol.availability}</p></div>
                  <div><span className="text-secondary-500">Phone</span><p className="font-medium text-secondary-900">{selectedVol.phone}</p></div>
                  <div><span className="text-secondary-500">Email</span><p className="font-medium text-secondary-900 truncate">{selectedVol.email}</p></div>
                </div>
                {selectedVol.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {selectedVol.skills.map(s => (
                      <span key={s} className="rounded-md border border-primary-100 bg-primary-50 px-2 py-1 text-[10px] font-semibold uppercase text-primary-700">{s}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Certificate Section */}
              {selectedVol.certificate?.uploaded ? (
                <div className="rounded-2xl border border-primary-200 bg-primary-50/30 p-5 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary-100 p-2 text-primary-600">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-secondary-900">Certificate Verification</h3>
                      <p className="text-xs text-secondary-500">AI-assisted analysis result</p>
                    </div>
                    <div className="ml-auto"><CertBadge certificate={selectedVol.certificate} /></div>
                  </div>

                  {/* Certificate Preview */}
                  {selectedVol.certificate.fileUrl && (
                    <div className="rounded-xl overflow-hidden border border-border bg-white">
                      {selectedVol.certificate.fileUrl.startsWith('data:image') ? (
                        <img src={selectedVol.certificate.fileUrl} alt="Certificate" className="w-full max-h-48 object-contain bg-slate-50" />
                      ) : (
                        <div className="flex items-center justify-center gap-2 p-6 bg-slate-50">
                          <FileText className="h-8 w-8 text-secondary-400" />
                          <span className="text-sm text-secondary-500">PDF Document</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Extracted Fields */}
                  {selectedVol.certificate.verification && (
                    <div className="rounded-2xl bg-white border border-border p-5 space-y-3">
                      {[
                        ['Holder Name', selectedVol.certificate.verification.holderName],
                        ['Certificate Title', selectedVol.certificate.verification.certificateTitle],
                        ['Issuer', selectedVol.certificate.verification.issuer],
                        ['Issue Date', selectedVol.certificate.verification.issueDate],
                        ['Expiry Date', selectedVol.certificate.verification.expiryDate || 'N/A'],
                        ['Certificate No.', selectedVol.certificate.verification.certificateNumber || 'N/A'],
                        ['Recognized Skill', selectedVol.certificate.verification.skillCategory],
                      ].filter(([, val]) => val).map(([label, val]) => (
                        <div key={label} className="flex justify-between text-sm">
                          <span className="text-secondary-500">{label}</span>
                          <span className="font-medium text-secondary-900 text-right max-w-[60%]">{val}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Confidence Bar */}
                  {selectedVol.certificate.verification?.confidence > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-secondary-500">AI Confidence</span>
                        <span className="font-bold text-primary-600">{selectedVol.certificate.verification.confidence}%</span>
                      </div>
                      <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            selectedVol.certificate.verification.confidence >= 70 ? 'bg-green-500' :
                            selectedVol.certificate.verification.confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${selectedVol.certificate.verification.confidence}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* AI Summary */}
                  {selectedVol.certificate.verification?.summary && (
                    <div className="rounded-xl bg-white border border-border p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-secondary-400 mb-2">AI Summary</p>
                      <p className="text-sm text-secondary-700 leading-relaxed">{selectedVol.certificate.verification.summary}</p>
                    </div>
                  )}

                  {/* Possible Issues */}
                  {selectedVol.certificate.verification?.possibleIssues?.length > 0 && (
                    <div className="rounded-xl bg-warning-50 border border-warning-100 p-4">
                      <p className="text-xs font-bold text-warning mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Possible Issues
                      </p>
                      <ul className="text-xs text-warning/80 space-y-1">
                        {selectedVol.certificate.verification.possibleIssues.map((issue, i) => (
                          <li key={i}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Coordinator Approval Status */}
                  <div className="rounded-xl bg-white border border-border p-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-secondary-500">Coordinator Decision</span>
                    <span className={`text-sm font-bold ${
                      selectedVol.certificate.coordinatorApproved === true ? 'text-green-600' :
                      selectedVol.certificate.coordinatorApproved === false ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {selectedVol.certificate.coordinatorApproved === true ? 'Approved' :
                       selectedVol.certificate.coordinatorApproved === false ? 'Rejected / Re-upload' : 'Pending'}
                    </span>
                  </div>

                  {/* Coordinator Actions */}
                  <div className="flex gap-3">
                    <Button 
                      size="sm" 
                      className="flex-1 justify-center gap-1"
                      onClick={() => handleReview(selectedVol.id, 'approve')}
                      disabled={reviewLoading}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger"
                      className="flex-1 justify-center gap-1"
                      onClick={() => handleReview(selectedVol.id, 'reject')}
                      disabled={reviewLoading}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="flex-1 justify-center gap-1"
                      onClick={() => handleReview(selectedVol.id, 'request_reupload')}
                      disabled={reviewLoading}
                    >
                      <RotateCcw className="h-4 w-4" /> Re-upload
                    </Button>
                  </div>

                  <p className="text-[11px] text-secondary-400 text-center">
                    AI analysis is advisory only. The coordinator makes the final verification decision.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                  <Shield className="h-8 w-8 text-secondary-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-secondary-500">No certificate uploaded</p>
                  <p className="text-xs text-secondary-400 mt-1">This volunteer has not submitted any certificates for verification.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
