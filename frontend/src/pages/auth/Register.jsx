import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  User,
  Building2,
  BookOpen,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();

  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    college: "",
    branch: "",
    semester: "2",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.college.trim() ||
      !form.branch.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (
      form.password !== form.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);

      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        college: form.college,
        branch: form.branch,
        semester: form.semester,
      });

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.message || "Unable to create account."
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

          <h1>Join CampusFlow</h1>

          <p>
            Organize your college life and stay on top
            of your academics.
          </p>

          <div className="auth-feature-list">

            <div>
              <span>✓</span>
              Personal academic dashboard
            </div>

            <div>
              <span>✓</span>
              Attendance tracking
            </div>

            <div>
              <span>✓</span>
              Assignment management
            </div>

            <div>
              <span>✓</span>
              SGPA & CGPA tools
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
            <h2>Create your account</h2>

            <p>
              Set up your student profile to get started.
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

              <label htmlFor="name">
                Full name
              </label>

              <div className="auth-input-wrapper">

                <User
                  size={19}
                  className="auth-input-icon"
                />

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                />

              </div>
            </div>

            <div className="auth-field">

              <label htmlFor="register-email">
                Email address
              </label>

              <div className="auth-input-wrapper">

                <Mail
                  size={19}
                  className="auth-input-icon"
                />

                <input
                  id="register-email"
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

              <label htmlFor="college">
                College
              </label>

              <div className="auth-input-wrapper">

                <Building2
                  size={19}
                  className="auth-input-icon"
                />

                <input
                  id="college"
                  name="college"
                  type="text"
                  placeholder="Your college"
                  value={form.college}
                  onChange={handleChange}
                />

              </div>
            </div>

            <div className="auth-two-column">

              <div className="auth-field">

                <label htmlFor="branch">
                  Branch
                </label>

                <div className="auth-input-wrapper">

                  <BookOpen
                    size={19}
                    className="auth-input-icon"
                  />

                  <input
                    id="branch"
                    name="branch"
                    type="text"
                    placeholder="Data Science"
                    value={form.branch}
                    onChange={handleChange}
                  />

                </div>
              </div>

              <div className="auth-field">

                <label htmlFor="semester">
                  Semester
                </label>

                <select
                  id="semester"
                  name="semester"
                  value={form.semester}
                  onChange={handleChange}
                  className="auth-select"
                >
                  {Array.from(
                    { length: 8 },
                    (_, index) => index + 1
                  ).map((semester) => (
                    <option
                      key={semester}
                      value={semester}
                    >
                      Semester {semester}
                    </option>
                  ))}
                </select>

              </div>

            </div>

            <div className="auth-field">

              <label htmlFor="register-password">
                Password
              </label>

              <div className="auth-input-wrapper">

                <LockKeyhole
                  size={19}
                  className="auth-input-icon"
                />

                <input
                  id="register-password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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

            <div className="auth-field">

              <label htmlFor="confirm-password">
                Confirm password
              </label>

              <div className="auth-input-wrapper">

                <LockKeyhole
                  size={19}
                  className="auth-input-icon"
                />

                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="auth-password-button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? (
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
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>

          <div className="auth-divider">
            <span>Already have an account?</span>
          </div>

          <Link
            to="/login"
            className="auth-secondary-button"
          >
            Sign in
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