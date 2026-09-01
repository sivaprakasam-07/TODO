import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, KeyRound, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, loading, isConfigured, authError, clearAuthError } = useAuth();

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4 bg-[#141414] text-[#F5F5F5] select-none">
      {/* Central Login Card */}
      <div className="w-full max-w-sm bg-[#1A1A1A] border border-[#262626] rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl overflow-hidden mb-1 shadow-md border border-[#2E2E2E]">
            <img src="/focus1.jpeg" alt="FocusFlow" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-lg font-bold tracking-wider uppercase text-[#F5F5F5]">
            FocusFlow
          </h1>
          <p className="text-xs text-[#8A8A8A] leading-relaxed">
            Minimal dark task management for focused execution.
          </p>
        </div>

        {/* Auth Error Notice */}
        {authError && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="leading-snug">{authError}</p>
            </div>
            <button
              type="button"
              onClick={clearAuthError}
              className="text-rose-400 hover:text-rose-200 text-xs font-semibold px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Configuration Check */}
        {!isConfigured ? (
          <div className="p-4 rounded-lg bg-[#202020] border border-[#2E2E2E] space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <KeyRound className="w-4 h-4" />
              <span>Firebase Setup Required</span>
            </div>
            <p className="text-[#A0A0A0] leading-relaxed">
              Add your Firebase credentials to <code className="font-mono text-white bg-black/40 px-1 py-0.5 rounded">client/.env</code> to enable Google Sign-In.
            </p>
            <div className="font-mono text-[11px] text-[#7A7A7A] bg-black/40 p-2 rounded border border-[#2A2A2A] space-y-0.5 overflow-x-auto">
              <div>VITE_FIREBASE_API_KEY=...</div>
              <div>VITE_FIREBASE_AUTH_DOMAIN=...</div>
              <div>VITE_FIREBASE_PROJECT_ID=...</div>
              <div>VITE_FIREBASE_APP_ID=...</div>
            </div>
          </div>
        ) : (
          /* Google Sign In Action */
          <div className="space-y-3">
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-neutral-100 disabled:bg-neutral-300 text-neutral-900 font-medium text-xs rounded-lg transition-colors cursor-pointer shadow-sm disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-700" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  {/* Google G SVG */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-[#222222] text-center">
          <p className="text-[11px] text-[#555555]">
            FocusFlow • Personal Productivity
          </p>
        </div>
      </div>
    </div>
  );
};
