
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, guardarSesion } from '../api';
import { Icono } from '../icons';
import '../login.css';

interface LoginResp {
  token: string;
  usuario: {
    id: number;
    nombre: string;
    rol: string;
  };
}

interface RecuperacionResp {
  mensaje: string;
}

// Cuentas de demostración por rol
const ROLES = [
  {
    id: 'admin',
    titulo: 'Admin',
    sub: 'Control Total',
    icono: 'shield',
    color: '#7c3aed',
    email: 'admin@sigem.com',
    password: 'Admin12345',
  },
  {
    id: 'tecnico',
    titulo: 'Técnico',
    sub: 'Órdenes / OT',
    icono: 'wrench',
    color: '#2563eb',
    email: 'tecnico@sigem.com',
    password: 'Tecnico12345',
  },
  {
    id: 'responsable',
    titulo: 'Responsable',
    sub: 'Área / Fallas',
    icono: 'cpu',
    color: '#0d9488',
    email: 'responsable@sigem.com',
    password: 'Responsable12345',
  },
];

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

  // RF-03: recuperación de contraseña
  const [recuperando, setRecuperando] = useState(false);
  const [enviandoRecuperacion, setEnviandoRecuperacion] =
    useState(false);

  const elegirRol = (r: (typeof ROLES)[number]) => {
    setRol(r.id);
    setEmail(r.email);
    setPassword(r.password);
    setError('');
    setAviso('');
    setRecuperando(false);
  };

  // RF-02: inicio de sesión
  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError('');
    setAviso('');
    setCargando(true);

    try {
      const respuesta = await api<LoginResp>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      guardarSesion(
        respuesta.token,
        respuesta.usuario,
        recordar
      );

      nav('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible iniciar sesión'
      );
    } finally {
      setCargando(false);
    }
  };

  // RF-03: solicitar recuperación
  const solicitarRecuperacion = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError('');
    setAviso('');
    setEnviandoRecuperacion(true);

    try {
      const respuesta = await api<RecuperacionResp>(
        '/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      setAviso(respuesta.mensaje);
      setRecuperando(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo solicitar la recuperación'
      );
    } finally {
      setEnviandoRecuperacion(false);
    }
  };

  return (
    <div className="lg-page">
      <div className="lg-logo">
        <Icono n="shield" size={30} />
      </div>

      <h1 className="lg-titulo">SIGEM MaintPRO</h1>

      <p className="lg-sub">
        Sistema de Gestión y Control de Mantenimiento de Equipos
      </p>

      <div className="lg-card">
        {/* Acceso rápido por rol */}
        <div className="lg-rapido">
          <div className="lg-rapido-cab">
            <span className="lg-rapido-tit">
              <Icono n="userCheck" size={15} />
              {' '}ACCESO RÁPIDO POR ROL (DEMO)
            </span>

            <span className="lg-badge">1 Clic</span>
          </div>

          <div className="lg-roles">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.id}
                className={`lg-rol ${
                  rol === r.id ? 'activo' : ''
                }`}
                onClick={() => elegirRol(r)}
              >
                <span style={{ color: r.color }}>
                  <Icono n={r.icono} size={18} />
                </span>

                <strong>{r.titulo}</strong>
                <small>{r.sub}</small>
              </button>
            ))}
          </div>
        </div>

        {recuperando ? (
          /* Formulario de recuperación */
          <form onSubmit={solicitarRecuperacion}>
            <h2>Recuperar contraseña</h2>

            <p>
              Escribe tu correo electrónico para solicitar
              un enlace de recuperación.
            </p>

            <label className="lg-label" htmlFor="rec-email">
              Correo Electrónico
            </label>

            <div className="lg-campo">
              <span className="lg-ico">
                <Icono n="mail" />
              </span>

              <input
                id="rec-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                required
              />
            </div>

            {error && (
              <div className="lg-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="lg-entrar"
              type="submit"
              disabled={enviandoRecuperacion}
            >
              {enviandoRecuperacion
                ? 'Enviando solicitud...'
                : 'Solicitar recuperación'}
            </button>

            <button
              type="button"
              className="lg-link"
              onClick={() => {
                setRecuperando(false);
                setError('');
                setAviso('');
              }}
              style={{
                display: 'block',
                margin: '20px auto 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Volver al inicio de sesión
            </button>
          </form>
        ) : (
          /* Formulario de inicio de sesión */
          <form onSubmit={enviar}>
            <label className="lg-label" htmlFor="login-email">
              Correo Electrónico
            </label>

            <div className="lg-campo">
              <span className="lg-ico">
                <Icono n="mail" />
              </span>

              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="lg-fila">
              <label className="lg-label" htmlFor="login-password">
                Contraseña
              </label>

              <button
                type="button"
                className="lg-link"
                onClick={() => {
                  setError('');
                  setAviso('');
                  setRecuperando(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ¿Olvidó su clave? (RF-03)
              </button>
            </div>

            <div className="lg-campo">
              <span className="lg-ico">
                <Icono n="lock" />
              </span>

              <input
                id="login-password"
                type={verClave ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="lg-ojo"
                onClick={() => setVerClave(!verClave)}
                aria-label="Mostrar u ocultar contraseña"
              >
                <Icono n={verClave ? 'eyeOff' : 'eye'} />
              </button>
            </div>

            <div className="lg-fila lg-opciones">
              <label className="lg-check">
                <input
                  type="checkbox"
                  checked={recordar}
                  onChange={(e) =>
                    setRecordar(e.target.checked)
                  }
                />
                Recordar sesión activa
              </label>

              <span className="lg-ssl">
                <Icono n="shield" size={14} />
                {' '}SSL / TLS Activo
              </span>
            </div>

            {error && (
              <div className="lg-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="lg-entrar"
              type="submit"
              disabled={cargando}
            >
              <Icono n="login" size={17} />
              {' '}
              {cargando
                ? 'Ingresando...'
                : 'Iniciar Sesión en el Sistema'}
            </button>
          </form>
        )}

        {aviso && (
          <div className="lg-aviso" role="status">
            {aviso}
          </div>
        )}

        <p className="lg-pie">
          Cumplimiento de estándares de seguridad y
          protección de datos personales
          <br />
          <strong>Ley 1581 de 2012</strong>
          {' '}| Cifrado bcrypt (RNF-01)
        </p>
      </div>
    </div>
  );
}
