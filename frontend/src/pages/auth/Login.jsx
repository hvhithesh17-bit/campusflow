import { useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from =
    location.state?.from?.pathname || "/dashboard";

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!form.password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setSubmitting(true);

      await login(form);

      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.message || "Unable to sign in."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-brand-panel">
        <div className="auth-brand-content">

          <div className="auth-logo">
            C
          </div>

          <h1>CampusFlow</h1>

          <p>
            Your academic life, organized in one place.
          </p>

          <div className="auth-feature-list">
            <div>
              <span>✓</span>
              Track attendance
            </div>

            <div>
              <span>✓</span>
              Manage assignments
            </div>

            <div>
              <span>✓</span>
              Plan your studies
            </div>

            <div>
              <span>✓</span>
              Calculate SGPA & CGPA
            </div>
          </div>

        </div>
      </div>

      <div className="auth-form-panel">

        <div className="auth-form-wrapper">

          <div className="auth-mobile-logo">
            <div className="auth-logo">
              C
            </div>

            <span>CampusFlow</span>
          </div>

          <div className="auth-heading">
            <h2>Welcome back</h2>

            <p>
              Sign in to continue to your dashboard.
            </p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >

            <div className="auth-field">

              <label htmlFor="email">
                Email address
              </label>

              <div className="auth-input-wrapper">

                <Mail
                  size={19}
                  className="auth-input-icon"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />

              </div>
            </div>

            <div className="auth-field">

              <label htmlFor="password">
                Password
              </label>

              <div className="auth-input-wrapper">

                <LockKeyhole
                  size={19}
                  className="auth-input-icon"
                />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="auth-password-button"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="auth-button-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>

          <div className="auth-divider">
            <span>New to CampusFlow?</span>
          </div>

          <Link
            to="/register"
            className="auth-secondary-button"
          >
            Create an account
          </Link>

          <div className="auth-footer">
            <GraduationCap size={16} />
            <span>Built for students</span>
          </div>

        </div>
      </div>

    </div>
  );
}