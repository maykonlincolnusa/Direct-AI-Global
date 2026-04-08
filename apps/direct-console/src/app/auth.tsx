import { createContext, useContext, useState, ReactNode } from "react";
import { Navigate } from "react-router-dom";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  plan: "starter" | "pro" | "enterprise";
  avatarInitials: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        login: (u) => setUser(u),
        logout: () => setUser(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
