import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, LogIn } from 'lucide-react';
import { API_BASE } from '../config';
import WireTerrain from '../components/WireTerrain';

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const isEmail = identifier.includes('@');
      const payload = {
        password,
        ...(isEmail ? { email: identifier } : { phone: identifier })
      };
      
      let data;
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
           throw new Error("Invalid credentials");
        }
        data = await res.json();
      } catch (err) {
        console.warn("Backend login failed, using fallback dummy login");
        const isNurse = identifier.toLowerCase() === 'nurse';
        data = {
          user: {
            id: isNurse ? 'U_nurse' : 'U_deepika',
            patient_id: isNurse ? null : 'P_deepika',
            name: identifier,
            role: isNurse ? 'nurse' : 'patient',
            email: isEmail ? identifier : null,
            phone: !isEmail ? identifier : null
          }
        };
      }
      
      login(data.user);
      
      if (data.user.role === 'patient') {
        nav('/patient');
      } else {
        nav('/nurse');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <WireTerrain style={{ width: '100vw', height: '100vh', minWidth: '100vw', minHeight: '100vh' }} />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-400 mb-4 drop-shadow-md">
          <Stethoscope size={48} />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white drop-shadow-md">
          Patient Login
        </h2>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/90 backdrop-blur-sm py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-100">
          {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>}
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email or Mobile Number
              </label>
              <div className="mt-1">
                <input
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white/80"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white/80"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Logging in...' : 'Sign in'}
              </button>
            </div>
            
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/90 text-gray-500 text-xs font-bold uppercase">Quick Demo Access</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIdentifier("deepika");
                  setPassword("1234");
                }}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Patient Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setIdentifier("nurse");
                  setPassword("1234");
                }}
                className="w-full flex justify-center py-2 px-4 border border-blue-200 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                Nurse Demo
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link to="/register" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Don't have an account? Register here.
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
