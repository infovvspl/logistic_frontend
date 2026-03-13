import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { demoLogin } from "../../features/auth/authSlice.js";
import { useAuth } from "../../hooks/useAuth.js";
import Img from "../../assets/tt.png";
import { FiGrid } from "react-icons/fi";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { login, status, error } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ defaultValues: { email: "", password: "" } });

  const onSubmit = async (values) => {
    try {
      await login(values);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err?.toLowerCase() || "";
      if (message.includes("email") || message.includes("user")) {
        setError("email", { type: "manual", message: err });
      } else if (message.includes("password")) {
        setError("password", { type: "manual", message: err });
      }
      console.error("Login failed:", err);
    }
  };

  const onDemo = () => {
    dispatch(
      demoLogin({ user: { email: "admin@example.com" }, token: "demo-token" }),
    );
    navigate("/dashboard", { replace: true });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .login-root {
          min-height: 70vh;
          display: flex;
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.1),
            0 1px 3px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        /* ── Decorative left panel ── */
        .login-panel {
          display: none;
          width: 44%;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(40px);
          position: relative;
          overflow: hidden;
          flex-direction: column;
          justify-content: space-between;
          padding: 52px 56px;
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 8px 32px rgba(0, 0, 0, 0.08);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }

        @media (min-width: 900px) {
          .login-panel { display: flex; }
        }

        .panel-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(59, 130, 246, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .panel-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.2;
        }
        .panel-orb-1 {
          width: 340px; height: 340px;
          background: rgba(59, 130, 246, 0.3);
          top: -80px; left: -80px;
        }
        .panel-orb-2 {
          width: 260px; height: 260px;
          background: rgba(16, 185, 129, 0.25);
          bottom: 60px; right: -60px;
        }

        .panel-brand {
          position: relative;
          z-index: 2;
        }

        .panel-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .panel-logo-mark {
          width: 44px; height: 44px;
          border-radius: 16px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
        }

        .panel-logo-mark svg {
          color: white;
          width: 20px;
          height: 20px;
        }

        .panel-logo-name {
          font-size: 18px;
          font-weight: 700;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        /* ── Right form area ── */
        .login-form-area {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
          position: relative;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(24px);
        }

        .login-form-area::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 70% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 60%),
            radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.06) 0%, transparent 50%);
          pointer-events: none;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 1;
        }

        .login-header {
          margin-bottom: 40px;
          text-align: center;
        }

        /* Mobile logo */
        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
          justify-content: center;
        }

        @media (min-width: 900px) {
          .mobile-logo { display: none; }
        }

        .mobile-logo-mark {
          width: 40px; height: 40px;
          border-radius: 14px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
        }

        .mobile-logo-mark svg {
          color: white;
          width: 18px;
          height: 18px;
        }

        .mobile-logo-name {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }

        .login-eyebrow {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 12px;
        }

        .login-title {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.2;
          margin: 0 0 12px;
        }

        .login-subtitle {
          font-size: 15px;
          color: #64748b;
          font-weight: 500;
          line-height: 1.6;
        }

        /* ── Form fields ── */
        .field-group {
          margin-bottom: 24px;
        }

        .field-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .field-input {
          width: 100%;
          box-sizing: border-box;
          padding: 16px 20px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: #1e293b;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .field-input::placeholder {
          color: #94a3b8;
        }

        .field-input:focus {
          border-color: #3b82f6;
          box-shadow: 
            0 0 0 4px rgba(59, 130, 246, 0.1),
            0 12px 32px rgba(59, 130, 246, 0.15);
          background: white;
          transform: translateY(-1px);
        }

        .field-input.has-error {
          border-color: #ef4444;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
        }

        .field-error {
          margin-top: 8px;
          font-size: 13px;
          color: #ef4444;
          font-weight: 500;
        }

        .form-error-bar {
          padding: 16px 20px;
          background: rgba(239, 68, 68, 0.1);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 16px;
          font-size: 14px;
          color: #dc2626;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .field-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .forgot-link {
          font-size: 13px;
          color: #64748b;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .forgot-link:hover { 
          color: #3b82f6;
          text-decoration: underline;
        }

        /* ── Buttons ── */
        .btn-primary {
          width: 100%;
          padding: 16px 20px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 16px;
          box-shadow: 
            0 8px 25px rgba(59, 130, 246, 0.3),
            0 4px 12px rgba(59, 130, 246, 0.2);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 16px 40px rgba(59, 130, 246, 0.4),
            0 8px 20px rgba(59, 130, 246, 0.3);
        }

        .btn-primary:active { transform: translateY(-1px); }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btn-demo {
          width: 100%;
          padding: 15px 20px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          color: #64748b;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 28px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }

        .btn-demo:hover {
          background: rgba(59, 130, 246, 0.08);
          color: #3b82f6;
          border-color: rgba(59, 130, 246, 0.2);
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
        }

        .or-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .or-line {
          flex: 1;
          height: 1px;
          background: rgba(0, 0, 0, 0.08);
        }

        .or-text {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
          letter-spacing: 0.05em;
        }

        /* ── Spinner ── */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* ── Image styling ── */
        .login-panel img {
          max-height: 60%;
          width: auto;
          border-radius: 20px;
          // box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          z-index: 2;
        }

        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .login-card { 
          animation: fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) both; 
        }

        /* ── Responsive tweaks ── */
        @media (max-width: 768px) {
          .login-root {
            flex-direction: column;
            border-radius: 20px;
            padding: 20px;
          }
          
          .login-form-area {
            padding: 32px 24px;
          }
          
          .login-panel {
            width: 100%;
            padding: 32px 24px;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            min-height: 200px;
          }
          
          .login-panel img {
            max-height: 120px;
          }
        }
      `}</style>

      <div className="login-root">
        {/* Left decorative panel */}
        <div className="login-panel">
          <div className="panel-grid" />
          <div className="panel-orb panel-orb-1" />
          <div className="panel-orb panel-orb-2" />

          <div className="panel-brand">
            <div className="panel-logo">
              <div className="panel-logo-mark">
                <FiGrid />
              </div>
              <span className="panel-logo-name">Workspace</span>
            </div>
          </div>

          <img
            src={Img}
            alt="Dashboard illustration"
          />
        </div>

        {/* Right form area */}
        <div className="login-form-area">
          <div className="login-card">
            <div className="login-header">
              <div className="mobile-logo">
                <div className="mobile-logo-mark">
                  <FiGrid />
                </div>
                <span className="mobile-logo-name">Workspace</span>
              </div>
              <p className="login-eyebrow">Welcome back</p>
              <h1 className="login-title">Sign in to your account</h1>
              <p className="login-subtitle">
                Enter your credentials to continue where you left off.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(onSubmit)(e);
              }}
            >
              {/* Email */}
              <div className="field-group">
                <label className="field-label" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  className={`field-input${errors.email ? " has-error" : ""}`}
                  type="email"
                  placeholder="admin@example.com"
                  autoComplete="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="field-error">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="field-group">
                <div className="field-row">
                  <label
                    className="field-label"
                    htmlFor="password"
                    style={{ marginBottom: 0 }}
                  >
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  className={`field-input${errors.password ? " has-error" : ""}`}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ marginTop: "8px" }}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                {errors.password && (
                  <p className="field-error">{errors.password.message}</p>
                )}
              </div>

              {error && <div className="form-error-bar">{error}</div>}

              <button
                className="btn-primary"
                type="submit"
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <>
                    <div className="spinner" /> Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="or-divider">
              <div className="or-line" />
              <span className="or-text">OR</span>
              <div className="or-line" />
            </div>

            <button className="btn-demo" type="button" onClick={onDemo}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Try demo (no API needed)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
