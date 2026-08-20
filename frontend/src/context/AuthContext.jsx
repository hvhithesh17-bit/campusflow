import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { authAPI } from "../services/api";

const AuthContext = createContext(null);

const USER_KEY = "campusflow_user";
const TOKEN_KEY = "campusflow_token";

/* =========================================================
   AUTH PROVIDER
========================================================= */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser =
        localStorage.getItem(USER_KEY);

      return savedUser
        ? JSON.parse(savedUser)
        : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] =
    useState(true);

  /* =======================================================
     INITIALIZE
  ======================================================= */

  useEffect(() => {
    const initializeAuth = async () => {
      const token =
        localStorage.getItem(TOKEN_KEY);

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response =
          await authAPI.me();

        if (
          response?.success &&
          response?.user
        ) {
          localStorage.setItem(
            USER_KEY,
            JSON.stringify(
              response.user
            )
          );

          setUser(response.user);
        }
      } catch (error) {
        console.error(
          "Session validation failed:",
          error
        );

        localStorage.removeItem(
          USER_KEY
        );

        localStorage.removeItem(
          TOKEN_KEY
        );

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /* =======================================================
     LOGIN
  ======================================================= */

  const login = async ({
    email,
    password,
  }) => {
    try {
      const response =
        await authAPI.login({
          email:
            email.trim().toLowerCase(),
          password,
        });

      console.log(
        "LOGIN RESPONSE:",
        response
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Login failed."
        );
      }

      if (!response?.token) {
        throw new Error(
          "Login succeeded but authentication token was not received."
        );
      }

      if (!response?.user) {
        throw new Error(
          "Login succeeded but user information was not received."
        );
      }

      /* Save JWT */

      localStorage.setItem(
        TOKEN_KEY,
        response.token
      );

      /* Save user */

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(
          response.user
        )
      );

      setUser(
        response.user
      );

      return response.user;
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      throw new Error(
        error?.response?.data
          ?.message ||
          error?.message ||
          "Unable to sign in."
      );
    }
  };

  /* =======================================================
     REGISTER
  ======================================================= */

  const register = async ({
    name,
    email,
    password,
    college,
    branch,
    semester,
  }) => {
    try {
      const response =
        await authAPI.register({
          name: name.trim(),

          email:
            email.trim().toLowerCase(),

          password,

          college:
            college?.trim() || "",

          branch:
            branch?.trim() || "",

          semester:
            Number(semester) || 1,
        });

      console.log(
        "REGISTER RESPONSE:",
        response
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Registration failed."
        );
      }

      if (!response?.token) {
        throw new Error(
          "Registration succeeded but authentication token was not received."
        );
      }

      if (!response?.user) {
        throw new Error(
          "Registration succeeded but user information was not received."
        );
      }

      /* Save JWT */

      localStorage.setItem(
        TOKEN_KEY,
        response.token
      );

      /* Save user */

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(
          response.user
        )
      );

      setUser(
        response.user
      );

      return response.user;
    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error
      );

      throw new Error(
        error?.response?.data
          ?.message ||
          error?.message ||
          "Unable to create account."
      );
    }
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout = () => {
    localStorage.removeItem(
      USER_KEY
    );

    localStorage.removeItem(
      TOKEN_KEY
    );

    setUser(null);
  };

  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated:
        Boolean(user),
      login,
      register,
      logout,
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =========================================================
   USE AUTH
========================================================= */

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}