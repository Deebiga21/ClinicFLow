import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope } from 'lucide-react';
const API_BASE = 'http://localhost:8000/api';

export default function Register() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { name, email, phone, password };
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      
      login(data.user);
      nav('/patient');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600 mb-4">
          <Stethoscope size={48} />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Create Patient Account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>}
          
          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" value={name} onChange={e => setName(e.target.value)} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input required type="email" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
              <input required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input required type="password" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Register'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Already have an account? Sign in.
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
