
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Icono } from '../icons';
import '../login.css';

interface ResetResp {
  mensaje: string;
}

export default function ResetPassword() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);

    try {
      await api<ResetResp>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });

      setExito(true);
      setPassword('');
      setConfirmar('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible cambiar la contraseña.'
      );
    } finally {
      setCargando(false);
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
        <h2>Restablecer contraseña</h2>

        {exito ? (
          <>
            <div className="lg-aviso" role="status">
              Tu contraseña se actualizó correctamente.
            </div>

            <button
              type="button"
              className="lg-entrar"
              onClick={() => nav('/login')}
            >
              Ir al inicio de sesión
            </button>
          </>
        ) : !token ? (
          <>
            <div className="lg-error" role="alert">
              El enlace de recuperación no contiene un token válido.
              Solicita uno nuevo desde el inicio de sesión.
            </div>

            <button
              type="button"
              className="lg-entrar"
              onClick={() => nav('/login')}
            >
              Volver al inicio de sesión
            </button>
          </>
        ) : (
          <form onSubmit={enviar}>
            <p>
              Escribe y confirma tu nueva contraseña.
            </p>

            <label className="lg-label" htmlFor="nueva-clave">
              Nueva contraseña
            </label>

            <div className="lg-campo">
              <span className="lg-ico">
                <Icono n="lock" />
              </span>

              <input
                id="nueva-clave"
                type={verClave ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
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

            <label className="lg-label" htmlFor="confirmar-clave">
              Confirmar contraseña
            </label>

            <div className="lg-campo">
              <span className="lg-ico">
                <Icono n="lock" />
              </span>

              <input
                id="confirmar-clave"
                type={verClave ? 'text' : 'password'}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <div className="lg-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="lg-entrar"
              disabled={cargando}
            >
              {cargando
                ? 'Actualizando contraseña...'
                : 'Guardar nueva contraseña'}
            </button>
          </form>
        )}

        <p className="lg-pie">
          SIGEM MaintPRO — Recuperación segura de contraseña
        </p>
      </div>
    </div>
  );
}
