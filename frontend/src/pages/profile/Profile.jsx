import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Building2,
  GraduationCap,
  BookOpen,
  Pencil,
  Save,
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { authAPI } from "../../services/api";

import "./Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    college: "",
    branch: "",
    semester: "",
  });

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await authAPI.me();

      console.log("PROFILE RESPONSE:", response);

      const profileUser =
        response?.user ||
        response?.data ||
        response;

      setUser(profileUser);

      setForm({
        name: profileUser?.name || "",
        email: profileUser?.email || "",
        college: profileUser?.college || "",
        branch: profileUser?.branch || "",
        semester: profileUser?.semester || "",
      });
    } catch (err) {
      console.error("Profile loading error:", err);

      setError(
        err?.message ||
          "Unable to load profile."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  function startEditing() {
    setEditing(true);
    setSuccess("");
    setError("");
  }

  function cancelEditing() {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      college: user?.college || "",
      branch: user?.branch || "",
      semester: user?.semester || "",
    });

    setEditing(false);
    setError("");
  }

  async function saveProfile(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      /*
       TEMPORARY:
       We will connect the update API
       in the next backend step.
      */

      const updatedUser = {
        ...user,
        ...form,
        semester: Number(form.semester),
      };

      setUser(updatedUser);

      /*
       Update localStorage so changes
       are immediately visible in app
      */

      const possibleKeys = [
        "campusflow_user",
        "user",
        "campusflowUser",
      ];

      possibleKeys.forEach((key) => {
        const stored =
          localStorage.getItem(key);

        if (stored) {
          try {
            const parsed =
              JSON.parse(stored);

            localStorage.setItem(
              key,
              JSON.stringify({
                ...parsed,
                ...updatedUser,
              })
            );
          } catch {
            // Ignore invalid localStorage data
          }
        }
      });

      setEditing(false);

      setSuccess(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(
        "Profile save error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  function getInitials() {
    if (!user?.name) {
      return "CF";
    }

    return user.name
      .split(" ")
      .slice(0, 2)
      .map((part) =>
        part.charAt(0).toUpperCase()
      )
      .join("");
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <Loader2
            size={28}
            className="profile-spin"
          />

          <span>
            Loading your profile...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">

      {/* HEADER */}

      <section className="profile-header">

        <div>
          <div className="profile-eyebrow">
            <User size={16} />

            Account
          </div>

          <h1>
            My Profile
          </h1>

          <p>
            Manage your personal and
            academic information.
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            className="profile-edit-button"
            onClick={startEditing}
          >
            <Pencil size={17} />

            Edit Profile
          </button>
        )}

      </section>

      {/* ALERTS */}

      {error && (
        <div className="profile-alert error">

          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={17} />
          </button>

        </div>
      )}

      {success && (
        <div className="profile-alert success">

          <CheckCircle2 size={18} />

          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
          >
            <X size={17} />
          </button>

        </div>
      )}

      <div className="profile-layout">

        {/* PROFILE CARD */}

        <aside className="profile-card">

          <div className="profile-avatar-wrapper">

            <div className="profile-avatar">
              {getInitials()}
            </div>

            <button
              type="button"
              className="profile-camera"
              title="Profile photo"
            >
              <Camera size={16} />
            </button>

          </div>

          <h2>
            {user?.name || "CampusFlow User"}
          </h2>

          <p>
            {user?.email || "No email available"}
          </p>

          <div className="profile-status">

            <CheckCircle2 size={15} />

            Active Account

          </div>

          <div className="profile-mini-info">

            <div>
              <GraduationCap size={18} />

              <span>
                Semester
              </span>

              <strong>
                {user?.semester || "--"}
              </strong>
            </div>

            <div>
              <BookOpen size={18} />

              <span>
                Branch
              </span>

              <strong>
                {user?.branch || "--"}
              </strong>
            </div>

          </div>

        </aside>

        {/* PROFILE DETAILS */}

        <section className="profile-details">

          <div className="profile-details-header">

            <div>

              <h2>
                Personal Information
              </h2>

              <p>
                Keep your information
                up to date.
              </p>

            </div>

          </div>

          <form onSubmit={saveProfile}>

            <div className="profile-form-grid">

              {/* NAME */}

              <div className="profile-form-group">

                <label htmlFor="name">
                  <User size={16} />

                  Full Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter your name"
                  required
                />

              </div>

              {/* EMAIL */}

              <div className="profile-form-group">

                <label htmlFor="email">
                  <Mail size={16} />

                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter your email"
                  required
                />

              </div>

              {/* COLLEGE */}

              <div className="profile-form-group">

                <label htmlFor="college">
                  <Building2 size={16} />

                  College
                </label>

                <input
                  id="college"
                  name="college"
                  type="text"
                  value={form.college}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter your college"
                />

              </div>

              {/* BRANCH */}

              <div className="profile-form-group">

                <label htmlFor="branch">
                  <BookOpen size={16} />

                  Branch
                </label>

                <input
                  id="branch"
                  name="branch"
                  type="text"
                  value={form.branch}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Example: Data Science"
                />

              </div>

              {/* SEMESTER */}

              <div className="profile-form-group full-width">

                <label htmlFor="semester">
                  <GraduationCap size={16} />

                  Current Semester
                </label>

                {editing ? (
                  <select
                    id="semester"
                    name="semester"
                    value={form.semester}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select Semester
                    </option>

                    {[1, 2, 3, 4, 5, 6, 7, 8].map(
                      (semester) => (
                        <option
                          key={semester}
                          value={semester}
                        >
                          Semester {semester}
                        </option>
                      )
                    )}

                  </select>
                ) : (
                  <input
                    value={
                      form.semester
                        ? `Semester ${form.semester}`
                        : "Not set"
                    }
                    disabled
                  />
                )}

              </div>

            </div>

            {/* ACTIONS */}

            {editing && (
              <div className="profile-actions">

                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <X size={17} />

                  Cancel
                </button>

                <button
                  type="submit"
                  className="profile-save-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="profile-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />

                      Save Changes
                    </>
                  )}

                </button>

              </div>
            )}

          </form>

        </section>

      </div>

      {/* ACCOUNT INFORMATION */}

      <section className="profile-account-info">

        <div className="profile-account-icon">
          <User size={20} />
        </div>

        <div>

          <h3>
            CampusFlow Account
          </h3>

          <p>
            Your academic information is
            used to personalize your
            CampusFlow experience.
          </p>

        </div>

      </section>

    </div>
  );
}