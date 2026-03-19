import { useState, useEffect } from "react";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    fetch("/api/auth/user", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setState({
          isAuthenticated: !!data.user,
          isLoading: false,
          user: data.user ?? null,
        });
      })
      .catch(() => {
        setState({ isAuthenticated: false, isLoading: false, user: null });
      });
  }, []);

  return state;
}

export function login() {
  window.location.href = "/api/auth/google";
}

export function logout() {
  window.location.href = "/api/auth/logout";
}
