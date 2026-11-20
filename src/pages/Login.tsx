import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, guardarSesion } from '../api';
import { Icono } from '../icons';
import '../login.css';

interface LoginResp {
  token: string;
  usuario: { id: number; nombre: string; rol: string };
}

// Cuentas de demostración por rol (RNF-01: control de acceso por roles)
const ROLES = [
  { id: 'admin', titulo: 'Admin', sub: 'Control Total', icono: 'shield', color: '#7c3aed', email: 'admin@sigem.com', password: 'Admin12345' },
  { id: 'tecnico', titulo: 'Técnico', sub: 'Órdenes / OT', icono: 'wrench', color: '#2563eb', email: 'tecnico@sigem.com', password: 'Tecnico12345' },
  { id: 'responsable', titulo: 'Responsable', sub: 'Área / Fallas', icono: 'cpu', color: '#0d9488', email: 'responsable@sigem.com', password: 'Responsable12345' },
];

// Pantalla de inicio de sesión (RF-02)
export default function Login() {
  const nav = useNavigate();
  const [rol, setRol] = useState('admin');
  const [email, setEmail] = useState(ROLES[0].email);
  const [password, setPassword] = useState(ROLES[0].password);
  const [verClave, setVerClave] = useState(false);
  const [recordar, setRecordar] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(false);

  const elegirRol = (r: (typeof ROLES)[number]) => {
    setRol(r.id);
    setEmail(r.email);
    setPassword(r.password);
    setError('');
    setAviso('');
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAviso('');
    setCargando(true);
    try {
      const r = await api<LoginResp>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      guardarSesion(r.token, r.usuario, recordar);
      nav('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="lg-page">
      <div className="lg-logo"><Icono n="shield" size={30} /></div>
      <h1 className="lg-titulo">SIGEM MaintPRO</h1>
      <p className="lg-sub">Sistema de Gestión y Control de Mantenimiento de Equipos</p>

      <form className="lg-card" onSubmit={enviar}>
        <div className="lg-rapido">
          <div className="lg-rapido-cab">
            <span className="lg-rapido-tit"><Icono n="userCheck" size={15} /> ACCESO RÁPIDO POR ROL (DEMO)</span>
            <span className="lg-badge">1 Clic</span>
          </div>
          <div className="lg-roles">
            {ROLES.map((r) => (
              <button type="button" key={r.id} className={`lg-rol ${rol === r.id ? 'activo' : ''}`} onClick={() => elegirRol(r)}>
                <span style={{ color: r.color }}><Icono n={r.icono} size={18} /></span>
                <strong>{r.titulo}</strong>
                <small>{r.sub}</small>
              </button>
            ))}
          </div>
        </div>

        <label className="lg-label">Correo Electrónico</label>
        <div className="lg-campo">
          <span className="lg-ico"><Icono n="mail" /></span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="lg-fila">
          <label className="lg-label">Contraseña</label>
          <a href="#recuperar" className="lg-link" onClick={(e) => { e.preventDefault(); setAviso('La recuperación de contraseña (RF-03) está en desarrollo.'); }}>
            ¿Olvidó su clave? (RF-03)
          </a>
        </div>
        <div className="lg-campo">
          <span className="lg-ico"><Icono n="lock" /></span>
          <input type={verClave ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="button" className="lg-ojo" onClick={() => setVerClave(!verClave)} aria-label="Mostrar u ocultar contraseña">
            <Icono n={verClave ? 'eyeOff' : 'eye'} />
          </button>
        </div>

        <div className="lg-fila lg-opciones">
          <label className="lg-check">
            <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
            Recordar sesión activa
          </label>
          <span className="lg-ssl"><Icono n="shield" size={14} /> SSL / TLS Activo</span>
        </div>

        {aviso && <div className="lg-aviso">{aviso}</div>}
        {error && <div className="lg-error">{error}</div>}

        <button className="lg-entrar" disabled={cargando}>
          <Icono n="login" size={17} /> {cargando ? 'Ingresando...' : 'Iniciar Sesión en el Sistema'}
        </button>

        <p className="lg-pie">
          Cumplimiento de estándares de seguridad y protección de datos personales<br />
          <strong>Ley 1581 de 2012</strong> | Cifrado bcrypt (RNF-01)
        </p>
      </form>
    </div>
  );
}
