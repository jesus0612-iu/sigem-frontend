import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getUsuario } from '../api';
import { Icono } from '../icons';

interface Datos {
  anio: number;
  pendientes: number;
  vencidos: number;
  mes_actual: number;
  mes_anterior: number;
  gasto_total: number;
  gasto_mes: number;
  equipos_total: number;
  equipos_operativos: number;
  requieren_atencion: number;
  historial: { preventivo: number[]; correctivo: number[] };
  salud: { estado: string; n: number }[];
  eficiencia: number | null;
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const ESTADOS: Record<string, { t: string; c: string }> = {
  operativo: { t: 'Operativo', c: '#10b981' },
  en_mantenimiento: { t: 'En Mantenimiento', c: '#0a84d0' },
  fuera_de_servicio: { t: 'Fuera de Servicio', c: '#f43f5e' },
};
const cop = (n: number) => '$ ' + n.toLocaleString('es-CO');

function Barras({ prev, corr }: { prev: number[]; corr: number[] }) {
  const max = Math.max(4, Math.ceil(Math.max(...prev, ...corr) / 4) * 4);
  const W = 700, H = 250, L = 28, B = 26, T = 10;
  const paso = (W - L) / 12, alto = H - B - T;
  const y = (v: number) => T + alto - (v / max) * alto;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="grafico" role="img" aria-label="Historial mensual de intervenciones">
      {[0, 1, 2, 3, 4].map((i) => {
        const v = (max / 4) * i;
        return (
          <g key={i}>
            <line x1={L} x2={W} y1={y(v)} y2={y(v)} stroke="#e5e7eb" />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{Math.round(v)}</text>
          </g>
        );
      })}
      {MESES.map((m, i) => {
        const x0 = L + i * paso + paso / 2;
        return (
          <g key={m}>
            <rect x={x0 - 17} y={y(prev[i])} width="15" height={T + alto - y(prev[i])} rx="3" fill="#0a84d0" />
            <rect x={x0 + 2} y={y(corr[i])} width="15" height={T + alto - y(corr[i])} rx="3" fill="#f43f5e" />
            <text x={x0} y={H - 8} textAnchor="middle" fontSize="11" fill="#64748b">{m}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Dona({ salud }: { salud: Datos['salud'] }) {
  const total = salud.reduce((a, s) => a + s.n, 0);
  const R = 62, C = 2 * Math.PI * R;
  let acum = 0;
  return (
    <div className="dona">
      <svg viewBox="0 0 180 180" role="img" aria-label="Salud del parque de equipos">
        <circle cx="90" cy="90" r={R} fill="none" stroke="#e5e7eb" strokeWidth="26" />
        {salud.map((s) => {
          const len = total ? (s.n / total) * C : 0;
          const el = (
            <circle key={s.estado} cx="90" cy="90" r={R} fill="none" stroke={ESTADOS[s.estado]?.c ?? '#94a3b8'} strokeWidth="26"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acum} transform="rotate(-90 90 90)" />
          );
          acum += len;
          return el;
        })}
        <text x="90" y="88" textAnchor="middle" fontSize="26" fontWeight="800" fill="#0f172a">{total}</text>
        <text x="90" y="106" textAnchor="middle" fontSize="11" fill="#64748b">equipos</text>
      </svg>
      <ul>
        {salud.map((s) => (
          <li key={s.estado}><i style={{ background: ESTADOS[s.estado]?.c }} /> {ESTADOS[s.estado]?.t ?? s.estado} <b>{s.n}</b></li>
        ))}
      </ul>
    </div>
  );
}

// RF-12: panel de indicadores clave
export default function Dashboard() {
  const u = getUsuario();
  const nav = useNavigate();
  const [d, setD] = useState<Datos | null>(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    api<Datos>('/dashboard').then(setD).catch((e) => setError((e as Error).message));
  }, []);

  const avisar = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(''), 3500);
  };
  const programar = () =>
    u?.rol === 'administrador' || u?.rol === 'tecnico'
      ? nav('/mantenimientos?nuevo=1')
      : avisar('Solo el administrador o el técnico pueden programar mantenimientos.');
  const proximamente = () => avisar('El registro de fallas aún está en desarrollo (ver tablero).');

  if (error) return <div className="alerta-error">{error}</div>;
  if (!d) return <p className="cargando">Cargando indicadores...</p>;

  const variacion = d.mes_anterior > 0 ? Math.round(((d.mes_actual - d.mes_anterior) / d.mes_anterior) * 100) : null;

  return (
    <>
      <section className="banner">
        <div>
          <span className="banner-chip"><Icono n="shield" size={13} /> Panel de Control & Indicadores Clave</span>
          <h2>Bienvenido, {u?.nombre}</h2>
          <p>Monitoreo en tiempo real del estado de activos, órdenes de mantenimiento preventivo/correctivo y costos acumulados.</p>
        </div>
        <div className="banner-acc">
          <button className="btn-azul" onClick={programar}><Icono n="wrench" size={14} /> Programar Mantenimiento</button>
          <button className="btn-oscuro" onClick={proximamente}><Icono n="alertCircle" size={14} /> Reportar Falla</button>
        </div>
      </section>
      {aviso && <div className="aviso-info">{aviso}</div>}

      <section className="kpis">
        <article className="kpi">
          <header><span>MANTENIMIENTOS PENDIENTES</span><i className="k-rojo"><Icono n="clock" /></i></header>
          <strong>{d.pendientes}</strong>
          <small>{d.vencidos} vencidos / urgente</small>
        </article>
        <article className="kpi">
          <header><span>MANTENIMIENTOS DEL MES</span><i className="k-azul"><Icono n="calendar" /></i></header>
          <strong>{d.mes_actual}</strong>
          <small>
            {variacion !== null && <em className={variacion >= 0 ? 'sube' : 'baja'}>{variacion >= 0 ? '+' : ''}{variacion}% vs mes ant.</em>}
            {variacion === null && 'Sin datos del mes anterior'}
          </small>
        </article>
        <article className="kpi">
          <header><span>GASTO ACUMULADO (RF-10)</span><i className="k-morado"><Icono n="dollar" /></i></header>
          <strong>{cop(d.gasto_total)}</strong>
          <small>Mes actual: {cop(d.gasto_mes)}</small>
        </article>
        <article className="kpi">
          <header><span>INVENTARIO ACTIVO</span><i className="k-verde"><Icono n="cpu" /></i></header>
          <strong>{d.equipos_operativos} / {d.equipos_total}</strong>
          <small>{d.requieren_atencion} requieren atención</small>
        </article>
      </section>

      <section className="graficos">
        <article className="panel">
          <header>
            <div>
              <h3>Historial Mensual de Intervenciones</h3>
              <small>Mantenimientos Preventivos vs Correctivos (Año {d.anio})</small>
            </div>
            {d.eficiencia !== null && <span className="chip-efi"><Icono n="trend" size={13} /> Eficiencia Operativa: {d.eficiencia}%</span>}
          </header>
          <Barras prev={d.historial.preventivo} corr={d.historial.correctivo} />
          <div className="leyenda"><span><i style={{ background: '#0a84d0' }} /> Preventivo</span><span><i style={{ background: '#f43f5e' }} /> Correctivo</span></div>
        </article>
        <article className="panel">
          <header><div><h3>Salud del Parque de Equipos</h3><small>Distribución por estado de operatividad</small></div></header>
          <Dona salud={d.salud} />
        </article>
      </section>
    </>
  );
}
