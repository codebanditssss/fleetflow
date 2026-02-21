"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/theme-toggle";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function LoginInner() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isRejected = searchParams.get("error") === "rejected";

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (tab === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) { setError(error.message); setLoading(false); return; }
      setSuccess("Check your email to confirm your account, then sign in.");
      setTab("signin");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setGoogleLoad(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setGoogleLoad(false); }
  }

  return (
    <div style={s.page}>
      <div style={{ position: "fixed", top: "20px", right: "20px" }}>
        <ThemeToggle />
      </div>
      <div style={s.card}>

        {/* Logo */}
        <div style={s.logoRow}>
          <div style={s.logoBox}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
              <rect x="1" y="3" width="15" height="13" />
              <path d="M16 8h4l3 5v4h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <span style={s.logoText}>FleetFlow</span>
        </div>

        <h1 style={s.heading}>
          {tab === "signin" ? "Welcome back" : "Create account"}
        </h1>
        <p style={s.subtext}>
          {tab === "signin"
            ? "Sign in to access the fleet management hub."
            : "Sign up and complete onboarding to get started."}
        </p>

        {/* Rejected notice */}
        {isRejected && (
          <div style={{ ...s.notice, ...s.noticeRed }}>
            Your access request was not approved. Contact your administrator.
          </div>
        )}

        {/* Error / Success */}
        {error && <div style={{ ...s.notice, ...s.noticeRed }}>{error}</div>}
        {success && <div style={{ ...s.notice, ...s.noticeGreen }}>{success}</div>}

        {/* Tab toggle */}
        <div style={s.tabs}>
          <button
            style={{ ...s.tabBtn, ...(tab === "signin" ? s.tabActive : {}) }}
            onClick={() => { setTab("signin"); setError(""); setSuccess(""); }}
          >
            Sign In
          </button>
          <button
            style={{ ...s.tabBtn, ...(tab === "signup" ? s.tabActive : {}) }}
            onClick={() => { setTab("signup"); setError(""); setSuccess(""); }}
          >
            Sign Up
          </button>
        </div>

        {/* Google */}
        <button
          id="btn-google"
          style={s.googleBtn}
          onClick={handleGoogle}
          disabled={googleLoad}
        >
          {googleLoad ? <span style={s.spinner} /> : <GoogleIcon />}
          <span>{tab === "signin" ? "Continue with Google" : "Sign up with Google"}</span>
        </button>

        {/* Divider */}
        <div style={s.divider}>
          <div style={s.divLine} />
          <span style={s.divText}>or</span>
          <div style={s.divLine} />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} style={s.form}>
          <div style={s.field}>
            <label style={s.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={s.input}
              onFocus={(e) => Object.assign(e.target.style, s.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, { borderColor: "var(--border)", boxShadow: "none" })}
            />
          </div>

          <div style={s.field}>
            <label style={s.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
              placeholder={tab === "signup" ? "Min. 8 characters" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={s.input}
              onFocus={(e) => Object.assign(e.target.style, s.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, { borderColor: "var(--border)", boxShadow: "none" })}
            />
          </div>

          <button
            id="btn-email-auth"
            type="submit"
            style={s.submitBtn}
            disabled={loading}
          >
            {loading
              ? <span style={s.spinner} />
              : tab === "signin" ? "Sign In" : "Create Account"
            }
          </button>
        </form>


      </div>
    </div>
  );
}

/* ─── Inline styles using CSS vars ─── */
const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--background)",
    padding: "24px",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "36px 32px",
    boxShadow: "var(--shadow-md)",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "24px",
  },
  logoBox: {
    width: "36px", height: "36px",
    backgroundColor: "var(--primary)",
    color: "var(--primary-foreground)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius)",
    flexShrink: 0,
  },
  logoText: {
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--foreground)",
    letterSpacing: "0.5px",
  },
  heading: {
    fontSize: "20px",
    fontWeight: 600,
    color: "var(--foreground)",
    marginBottom: "6px",
  },
  subtext: {
    fontSize: "13px",
    color: "var(--muted-foreground)",
    marginBottom: "20px",
    lineHeight: "1.5",
  },
  notice: {
    padding: "10px 14px",
    borderRadius: "var(--radius)",
    fontSize: "13px",
    marginBottom: "16px",
    lineHeight: "1.5",
  },
  noticeRed: {
    backgroundColor: "oklch(0.6168 0.2086 25.8088 / 0.1)",
    border: "1px solid oklch(0.6168 0.2086 25.8088 / 0.3)",
    color: "var(--destructive)",
  },
  noticeGreen: {
    backgroundColor: "oklch(0.8 0.17 150 / 0.1)",
    border: "1px solid oklch(0.8 0.17 150 / 0.3)",
    color: "oklch(0.7 0.17 150)",
  },
  tabs: {
    display: "flex",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
    marginBottom: "20px",
  },
  tabBtn: {
    flex: 1,
    padding: "9px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--muted-foreground)",
    fontFamily: "inherit",
    transition: "backgroundColor 0.15s, color 0.15s",
  },
  tabActive: {
    backgroundColor: "var(--secondary)",
    color: "var(--foreground)",
  },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "10px",
    backgroundColor: "var(--secondary)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--foreground)",
    fontFamily: "inherit",
    marginBottom: "16px",
    transition: "background 0.15s",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
  },
  divLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "var(--border)",
  },
  divText: {
    fontSize: "12px",
    color: "var(--muted-foreground)",
    flexShrink: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 500,
    color: "var(--foreground)",
    letterSpacing: "0.3px",
  },
  input: {
    padding: "9px 12px",
    backgroundColor: "var(--input)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    fontSize: "14px",
    color: "var(--foreground)",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    width: "100%",
  },
  inputFocus: {
    borderColor: "var(--ring)",
    boxShadow: "0 0 0 2px oklch(0.8520 0.1269 195.0354 / 0.15)",
  },
  submitBtn: {
    width: "100%",
    padding: "10px",
    backgroundColor: "var(--primary)",
    color: "var(--primary-foreground)",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "40px",
    transition: "opacity 0.15s",
  },
  spinner: {
    display: "inline-block",
    width: "16px", height: "16px",
    border: "2px solid currentColor",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  footer: {
    marginTop: "20px",
    fontSize: "11px",
    color: "var(--muted-foreground)",
    textAlign: "center",
    opacity: 0.7,
  },
};

export default function LoginPage() {
  return <Suspense><LoginInner /></Suspense>;
}
