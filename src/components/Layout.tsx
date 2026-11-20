import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cerrarSesion, getUsuario } from '../api';
import { Icono } from '../icons';

const ROL: Record<string, string> = {
  administrador: 'Administrador',
  tecnico: 'Técnico Especialista',
  responsable: 'Responsable de Área',
};

// Módulos del menú; los que aún no están construidos se marcan "Pronto" (ver tablero)
const MODULOS = [
  { to: '/dashboard', t: 'Dashboard Indicadores', i: 'dashboard', roles: ['administrador', 'tecnico', 'responsable'], listo: true },
  { to: '/equipos', t: 'Inventario Equipos', i: 'box', roles: ['administrador', 'responsable'], listo: true },
  { to: '/mantenimientos', t: 'Mantenimientos', i: 'wrench', roles: ['administrador', 'tecnico'], listo: true },
  { to: '/fallas', t: 'Registro de Fallas', i: 'alert', roles: ['administrador', 'tecnico'], listo: true },
];

// Marco general del sistema: menú lateral + encabezado (RNF-01: el menú depende del rol)
export default function Layout() {
  const nav = useNavigate();
  const u = getUsuario();
  const rol = u?.rol ?? '';
  const iniciales = (u?.nombre ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const salir = () => {
    cerrarSesion();
    nav('/');
  };

  return (
    <div className="app">
      <aside className="side">
        <div className="side-marca">
          <span className="side-logo"><Icono n="shield" size={18} /></span>
          <div><strong>SIGEM</strong><small>MaintPRO v1.0</small></div>
        </div>
        <p className="side-tit">MÓDULOS DEL SISTEMA</p>
        <nav>
          {MODULOS.filter((m) => m.roles.includes(rol)).map((m) =>
            m.listo ? (
              <NavLink key={m.to} to={m.to} className={({ isActive }) => `side-item ${isActive ? 'on' : ''}`}>
                <Icono n={m.i} size={16} /> {m.t}
              </NavLink>
            ) : (
              <span key={m.to} className="side-item off" title="Se construye en el sprint S6">
                <Icono n={m.i} size={16} /> {m.t} <em>Pronto</em>
              </span>
            )
          )}
        </nav>
        <div className="side-seg">
          <strong><span className="punto" /> Conexión Segura (RNF-01)</strong>
          <small>Cifrado RBAC activo | Ley 1581 de 2012</small>
        </div>
      </aside>

      <div className="main">
        <header className="top">
          <div className="top-izq">
            <span className="top-logo"><Icono n="shield" size={16} /></span>
            <div><strong>SIGEM</strong><small>GESTIÓN DE MANTENIMIENTO</small></div>
          </div>
          <div className="top-der">
            <span className="rol-activo"><Icono n="userCheck" size={14} /> Rol Activo: <b>{ROL[rol] ?? rol}</b></span>
            <button className="icono-btn" aria-label="Notificaciones"><Icono n="bell" size={17} /></button>
            <div className="usuario">
              <span className="avatar">{iniciales}</span>
              <div><strong>{u?.nombre}</strong><small>{ROL[rol] ?? rol}</small></div>
            </div>
            <button className="icono-btn" onClick={salir} aria-label="Cerrar sesión" title="Cerrar sesión"><Icono n="logout" size={17} /></button>
          </div>
        </header>
        <main className="contenido"><Outlet /></main>
      </div>
    </div>
  );
}