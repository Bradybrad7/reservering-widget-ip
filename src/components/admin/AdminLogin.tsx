/**
 * Admin Login Component
 * Firebase Authentication with admin claim checking
 */

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, AlertCircle, Loader } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      // Redirect happens automatically via auth state change
    } catch (err: any) {
      setError(err.message || 'Login mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/20 mb-4">
            <Lock className="w-8 h-8 text-gold-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Login
          </h1>
          <p className="text-gray-400">
            Dinner Theater Booking System
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                  placeholder="admin@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Wachtwoord
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-gold-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Inloggen...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Inloggen</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Beveiligd met Firebase Authentication
            </p>
          </div>
        </div>

        {/* Development Info */}
        <div className="mt-6 p-4 bg-dark-800/50 border border-dark-700 rounded-lg">
          <p className="text-xs text-gray-500 text-center">
            💡 <strong>Dev Tip:</strong> Gebruik <code className="text-gold-400">setAdminClaim</code> Cloud Function om admin rechten toe te kennen
          </p>
        </div>
      </div>
    </div>
  );
};
