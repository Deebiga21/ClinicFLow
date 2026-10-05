import React from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../../components/shared/EmptyState';
import { User, RefreshCw } from 'lucide-react';

export default function PatientProfile() {
  const { data, loading } = useOutletContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-sky-500" />
        <p className="font-semibold text-sm tracking-wide">Loading your profile...</p>
      </div>
    );
  }

  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: data?.patient?.email || '',
    phone: data?.patient?.phone || '',
    age: data?.patient?.age || '',
    gender: data?.patient?.gender || ''
  });

  const patient = data?.patient;

  if (!patient) return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-[#0A2540] mb-6">Profile</h1>
      <div className="flex-1">
        <EmptyState title="Profile not found" message="We couldn't load your profile details." icon={User} />
      </div>
    </div>
  );

  const handleSave = () => {
    // In a real app, you would make an API call here.
    // For now, we will just simulate a save.
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-[#0A2540] mb-2">Your Profile</h1>
          <p className="text-slate-500">Manage your personal information and preferences.</p>
        </div>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      <div className="bg-white rounded-[18px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 bg-blue-50/50 border-b border-slate-100 flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <User size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{patient.name || 'Patient Name'}</h2>
            <p className="text-slate-500">ID: {patient.id || '123'}</p>
          </div>
        </div>
        
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email</label>
              {isEditing ? (
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
              ) : (
                <div className="text-slate-800 font-medium">{formData.email || 'Not provided'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone</label>
              {isEditing ? (
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
              ) : (
                <div className="text-slate-800 font-medium">{formData.phone || 'Not provided'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Age</label>
              {isEditing ? (
                <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
              ) : (
                <div className="text-slate-800 font-medium">{formData.age || 'Not provided'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Gender</label>
              {isEditing ? (
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <div className="text-slate-800 font-medium">{formData.gender || 'Not provided'}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
