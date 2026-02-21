"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

/* ─── tiny icon components ─── */
function TruckIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <path d="M16 8h4l3 5v4h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
    );
}

function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    );
}

/* ─── role badge data ─── */
const ROLES = [
    { label: "Fleet Manager", color: "#3b82f6", desc: "Full access" },
    { label: "Dispatcher", color: "#8b5cf6", desc: "Trips & vehicles" },
    { label: "Safety Officer", color: "#f59e0b", desc: "Driver compliance" },
    { label: "Finance", color: "#22c55e", desc: "Costs & reports" },
];

function LoginContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (searchParams.get("error")) {
            setError("Authentication failed. Please try again.");
        }
    }, [searchParams]);

    async function handleGoogle() {
        setLoading(true);
        setError("");
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    }

    return (
        <div className="login-root">
            {/* ── animated background blobs ── */}
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />

            {/* ── grid overlay ── */}
            <div className="grid-overlay" />

            {/* ── card ── */}
            <div className="login-card">

                {/* logo */}
                <div className="logo-wrap">
                    <div className="logo-icon">
                        <TruckIcon />
                    </div>
                    <span className="logo-text">FleetFlow</span>
                </div>

                {/* headline */}
                <h1 className="headline">Command your fleet.</h1>
                <p className="sub">
                    Sign in to access the logistics management hub.
                </p>

                {/* role badges */}
                <div className="roles-row">
                    {ROLES.map((r) => (
                        <div className="role-badge" key={r.label} style={{ "--clr": r.color } as React.CSSProperties}>
                            <span className="role-dot" />
                            <span className="role-label">{r.label}</span>
                        </div>
                    ))}
                </div>

                {/* divider */}
                <div className="divider">
                    <span>Continue with</span>
                </div>

                {/* error */}
                {error && (
                    <div className="error-box">{error}</div>
                )}

                {/* Google button */}
                <button
                    id="btn-google-login"
                    className="btn-google"
                    onClick={handleGoogle}
                    disabled={loading}
                >
                    {loading ? (
                        <span className="spinner" />
                    ) : (
                        <>
                            <GoogleIcon />
                            <span>Sign in with Google</span>
                        </>
                    )}
                </button>

                {/* footer */}
                <p className="login-footer">
                    <ShieldIcon />
                    Secured by Supabase Auth &middot; Role-based access control
                </p>
            </div>

            <style>{`
        /* ── Root ── */
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #07090f;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }

        /* ── Background blobs ── */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          animation: drift 12s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .blob-1 {
          width: 520px; height: 520px;
          background: radial-gradient(circle, #3b82f6, transparent 70%);
          top: -120px; left: -100px;
          animation-delay: 0s;
        }
        .blob-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #8b5cf6, transparent 70%);
          bottom: -80px; right: -60px;
          animation-delay: -4s;
        }
        .blob-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #06b6d4, transparent 70%);
          top: 50%; left: 60%;
          animation-delay: -8s;
          opacity: 0.1;
        }
        @keyframes drift {
          0%   { transform: translate(0,0) scale(1); }
          100% { transform: translate(30px, 20px) scale(1.08); }
        }

        /* ── Grid overlay ── */
        .grid-overlay {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* ── Card ── */
        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          background: rgba(17, 20, 30, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 44px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          box-shadow:
            0 0 0 1px rgba(59,130,246,0.08),
            0 32px 64px rgba(0,0,0,0.5),
            0 0 80px rgba(59,130,246,0.06);
          animation: card-in 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes card-in {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Logo ── */
        .logo-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }
        .logo-icon {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: 0 4px 16px rgba(59,130,246,0.35);
        }
        .logo-text {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #e0eaff, #93c5fd);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Headline ── */
        .headline {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.6px;
          color: #f0f4ff;
          text-align: center;
          margin-bottom: 8px;
        }
        .sub {
          font-size: 14px;
          color: #6b7494;
          text-align: center;
          margin-bottom: 24px;
          line-height: 1.5;
        }

        /* ── Role badges ── */
        .roles-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin-bottom: 28px;
        }
        .role-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 99px;
          font-size: 12px;
          font-weight: 500;
          color: #9ba3bf;
          transition: background 0.2s;
        }
        .role-badge:hover {
          background: rgba(255,255,255,0.07);
        }
        .role-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--clr);
          box-shadow: 0 0 6px var(--clr);
          flex-shrink: 0;
        }

        /* ── Divider ── */
        .divider {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .divider::before, .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.07);
        }
        .divider span {
          font-size: 12px;
          color: #4a5165;
          white-space: nowrap;
          letter-spacing: 0.5px;
        }

        /* ── Error ── */
        .error-box {
          width: 100%;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          color: #fca5a5;
          text-align: center;
          margin-bottom: 14px;
        }

        /* ── Google button ── */
        .btn-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 13px 20px;
          background: #fff;
          color: #1a1a1a;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
          box-shadow: 0 2px 12px rgba(0,0,0,0.4);
          letter-spacing: -0.2px;
          margin-bottom: 24px;
        }
        .btn-google:hover:not(:disabled) {
          background: #f5f5f5;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.5);
        }
        .btn-google:active:not(:disabled) {
          transform: translateY(0);
        }
        .btn-google:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ── Spinner ── */
        .spinner {
          width: 20px; height: 20px;
          border: 2px solid rgba(0,0,0,0.15);
          border-top-color: #1a1a1a;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Footer ── */
        .login-footer {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #3d4459;
        }
        .login-footer svg {
          color: #3b82f6;
          opacity: 0.7;
        }

        /* ── Responsive ── */
        @media (max-width: 480px) {
          .login-card { padding: 32px 24px; }
          .headline   { font-size: 22px; }
        }
      `}</style>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    );
}
