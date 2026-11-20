const API = 'http://localhost:3000/api';

type Usuario = { id?: number; nombre: string; rol: string };

// "Recordar sesión activa": localStorage (persiste) o sessionStorage (se borra al cerrar el navegador)
export const getToken = () => localStorage.getItem('token') ?? sessionStorage.getItem('token');

export const getUsuario = (): Usuario | null => {
  const u = localStorage.getItem('usuario') ?? sessionStorage.getItem('usuario');
  return u ? JSON.parse(u) : null;
};

export function cerrarSesion() {
  ['token', 'usuario'].forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

export function guardarSesion(token: string, usuario: Usuario, recordar: boolean) {
  cerrarSesion();
  const store = recordar ? localStorage : sessionStorage;
  store.setItem('token', token);
  store.setItem('usuario', JSON.stringify(usuario));
}

// Cliente único para hablar con el backend; adjunta el token JWT (RF-02)
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/auth/login') {
    cerrarSesion();
    window.location.href = '/';
  }
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data as T;
}
