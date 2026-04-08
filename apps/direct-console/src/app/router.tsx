import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./auth";
import App from "../App";
import { LoginPage } from "../pages/LoginPage";
import { CadastroPage } from "../pages/CadastroPage";
import { PlanosPage } from "../pages/PlanosPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route
        path="/planos"
        element={
          <ProtectedRoute>
            <PlanosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
