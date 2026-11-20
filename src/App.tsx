
import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Equipos from './pages/Equipos';
import Mantenimientos from './pages/Mantenimientos';
import Fallas from './pages/Fallas';
import Layout from './components/Layout';
import { getToken } from './api';

// Protege las rutas privadas del sistema.
function Protegida({ children }: { children: ReactElement }) {
  return getToken()
    ? children
    : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Inicio de sesión */}
      <Route path="/" element={<Login />} />

      {/* RF-03: recuperación de contraseña.
          Esta ruta es pública porque el usuario no tiene sesión. */}
      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      {/* Rutas protegidas de SIGEM */}
      <Route
        element={
          <Protegida>
            <Layout />
          </Protegida>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/equipos" element={<Equipos />} />
        <Route
          path="/mantenimientos"
          element={<Mantenimientos />}
        />
        <Route path="/fallas" element={<Fallas />} />
      </Route>

      {/* Ruta desconocida */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
