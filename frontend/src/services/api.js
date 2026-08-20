const API_BASE_URL = "http://localhost:5000/api";

/* =========================================================
   COMMON REQUEST FUNCTION
========================================================= */

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("campusflow_token");

  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      config
    );

    let data = {};

    const contentType =
      response.headers.get("content-type");

    if (
      contentType &&
      contentType.includes("application/json")
    ) {
      data = await response.json();
    } else {
      const text = await response.text();

      data = text
        ? { message: text }
        : {};
    }

    if (!response.ok) {
      const error = new Error(
        data.message ||
          `Request failed with status code ${response.status}`
      );

      error.status = response.status;
      error.response = {
        status: response.status,
        data,
      };

      throw error;
    }

    return data;
  } catch (error) {
    console.error(
      `API ERROR [${endpoint}]:`,
      error
    );

    throw error;
  }
}

/* =========================================================
   AUTH
========================================================= */

export const authAPI = {
  login: (data) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () =>
    request("/auth/me"),

  changePassword: (data) =>
    request("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

/* =========================================================
   SUBJECTS
========================================================= */

export const subjectsAPI = {
  getAll: () =>
    request("/subjects"),

  getById: (id) =>
    request(`/subjects/${id}`),

  create: (data) =>
    request("/subjects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/subjects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/subjects/${id}`, {
      method: "DELETE",
    }),
};

/* =========================================================
   ATTENDANCE
========================================================= */

export const attendanceAPI = {
  getAll: () =>
    request("/attendance"),

  getBySubject: (subjectId) =>
    request(
      `/attendance/subject/${subjectId}`
    ),

  save: (data) =>
    request("/attendance", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/attendance/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/attendance/${id}`, {
      method: "DELETE",
    }),
};

/* =========================================================
   ASSIGNMENTS
========================================================= */

export const assignmentsAPI = {
  getAll: () =>
    request("/assignments"),

  getById: (id) =>
    request(`/assignments/${id}`),

  create: (data) =>
    request("/assignments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/assignments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/assignments/${id}`, {
      method: "DELETE",
    }),
};

/* =========================================================
   TIMETABLE
========================================================= */

export const timetableAPI = {
  getAll: () =>
    request("/timetable"),

  getById: (id) =>
    request(`/timetable/${id}`),

  create: (data) =>
    request("/timetable", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/timetable/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/timetable/${id}`, {
      method: "DELETE",
    }),
};

/* =========================================================
    STUDY TASKS                                 
========================================================= */

export const studyTasksAPI = {
  getAll: () =>
    request("/study-tasks"),

  create: (data) =>
    request("/study-tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/study-tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/study-tasks/${id}`, {
      method: "DELETE",
    }),
};

/* =========================================================
    GRADE PREDICTIONS                                 
========================================================= */

export const gradePredictionAPI = {
  getAll: (semester) =>
    request(
      semester
        ? `/grade-predictions?semester=${semester}`
        : "/grade-predictions"
    ),

  save: (data) =>
    request("/grade-predictions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(
      `/grade-predictions/${id}`,
      {
        method: "DELETE",
      }
    ),
};

/* =========================================================
    STUDY PLANNER                                 
========================================================= */
export const studyPlannerAPI = {
  getAll: () =>
    request("/study-planner"),

  create: (data) =>
    request("/study-planner", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/study-planner/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/study-planner/${id}`, {
      method: "DELETE",
    }),
};


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {
  authAPI,
  subjectsAPI,
  attendanceAPI,
  assignmentsAPI,
  timetableAPI,
};