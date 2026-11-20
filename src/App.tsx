import { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Equipos from './pages/Equipos';
import Mantenimientos from './pages/Mantenimientos';
import Fallas from './pages/Fallas';
import Layout from './components/Layout';
import { getToken } from './api';

// Revisa el token en cada render, así funciona justo después del login
function Protegida({ children }: { children: ReactElement }) {
  return getToken() ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Protegida><Layout /></Protegida>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/equipos" element={<Equipos />} />
        <Route path="/mantenimientos" element={<Mantenimientos />} />
        <Route path="/fallas" element={<Fallas />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}