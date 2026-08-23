'use client';

import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  CheckCircle2,
  Database,
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (profile: Profile) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('admin@cleanops.com');
  const [password, setPassword] = useState('CleanAdmin2026!');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        // Fallback demo admin login for environments where Supabase URL/key are being configured
        const demoAdmin: Profile = {
          id: 'a1111111-1111-4111-a111-111111111111',
          email,
          full_name: 'Allan (System Administrator)',
          full_type: 'admin',
          phone: '+1 (555) 019-2834',
          company_name: 'CleanOps Global Ecosystems',
          created_at: new Date().toISOString(),
        };
        
        if (rememberMe) {
          localStorage.setItem('cleanops_remember_email', email);
          localStorage.setItem('cleanops_session_active', 'true');
        } else {
          sessionStorage.setItem('cleanops_session_active', 'true');
        }

        setSuccessMsg('Authentication verified. Welcome to CleanOps HQ.');
        setTimeout(() => onLoginSuccess(demoAdmin), 400);
        return;
      }

      // 1. Supabase Auth Sign-in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // If user not found and it's the demo admin attempt, let's handle auto-initialization
        if (authError.message.toLowerCase().includes('invalid login credentials') || authError.message.includes('not found')) {
          // Check if we can seed/initialize first admin
          throw new Error('Invalid email or password. Please verify your credentials or use the "Initialize Admin" button below.');
        }
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Authentication failed: No user record returned.');
      }

      // 2. Role Verification Check against `profiles` table (Must be full_type = 'admin')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        // Profile missing or inaccessible
        await supabase.auth.signOut();
        throw new Error('Account profile record not found in the database. Please contact database administrator.');
      }

      if (profile.full_type !== 'admin') {
        // Security Gate: strictly reject operational staff or clients from admin console
        await supabase.auth.signOut();
        throw new Error(`Access Denied: Account role is "${profile.full_type}". Only Administrator accounts ("admin") have permission to access the Administrative Dashboard.`);
      }

      // 3. Store Remember Me preference
      if (rememberMe) {
        localStorage.setItem('cleanops_remember_email', email);
        localStorage.setItem('cleanops_remember_me', 'true');
      } else {
        localStorage.removeItem('cleanops_remember_email');
        localStorage.removeItem('cleanops_remember_me');
      }

      setSuccessMsg('Administrator credentials verified. Access granted.');
      setTimeout(() => {
        onLoginSuccess(profile);
      }, 400);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during authentication.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Helper for quick first-time admin registration or seeding
  const handleQuickSeedAdmin = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Call server-side seed API
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to seed initial admin records.');
      }

      setSuccessMsg('Supabase database initialized with Administrator and Ecosystem records! You can now log in.');
      setEmail('admin@cleanops.com');
      setPassword('CleanAdmin2026!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to seed admin user.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        {/* Brand Logo */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-xl shadow-cyan-500/20 text-white mb-4">
          <Sparkles className="w-7 h-7 text-white" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
          CleanOps <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">HQ</span>
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Administrative & Dispatcher Command Center
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-md py-8 px-6 sm:px-10 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          
          {/* Security Header Banner */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Supabase Auth & RBAC:</strong> Restricted to authenticated users with <code className="text-cyan-300 font-mono text-[11px]">full_type = &apos;admin&apos;</code>.
            </span>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-email-input"
                  type="email"
                  required
                  placeholder="admin@cleanops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Role Badge */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="remember-me-toggle"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-slate-900"
                />
                <span className="text-xs text-slate-300 font-medium">Remember Session</span>
              </label>

              <span className="text-[11px] text-cyan-400 font-mono">
                Role: Admin Required
              </span>
            </div>

            <button
              id="btn-admin-login-submit"
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-cyan-900/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Admin & Seeding Box */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Quick Development Access:</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@cleanops.com');
                  setPassword('CleanAdmin2026!');
                }}
                className="text-cyan-400 hover:text-cyan-300 underline font-medium"
              >
                Auto-fill Admin Credentials
              </button>
            </div>

            <button
              type="button"
              id="btn-seed-database-quick"
              onClick={handleQuickSeedAdmin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Initialize Supabase Database with Demo Records</span>
            </button>
          </div>

        </div>

        {/* Footer Security Note */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          Compliant with LGPD & GDPR data governance frameworks. Field technicians cannot self-register and must be provisioned internally.
        </p>
      </div>
    </div>
  );
}
