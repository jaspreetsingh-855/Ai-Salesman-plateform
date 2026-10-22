import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { clearToken, getErrorMessage, saveToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveSession = (token, nextUser) => {
    saveToken(token);
    setUser(nextUser);
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    saveSession(res.data.token, res.data.user);
    return res.data.user;
  };

  const signup = async (formData) => {
    const res = await api.post("/auth/signup", formData);
    saveSession(res.data.token, res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    clearToken();
    setUser(null);
  };

  const logoutAll = async () => {
    await api.post("/auth/logout-all");
    clearToken();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, logoutAll, getErrorMessage }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

export function portalHome(role) {
  return role === "admin" ? "/admin" : "/salesman";
}
