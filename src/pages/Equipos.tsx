import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, getUsuario } from '../api';
import { Icono } from '../icons';

interface Equipo {
  id: number;
  nombre: string;
  tipo: string;
  ubicacion: string;
  estado: 'operativo' | 'en_mantenimiento' | 'fuera_de_servicio';
  proximo_mantenimiento: string | null;
  costo_acumulado: number;
}

const ESTADOS: Record<string, string> = {
  operativo: 'Operativo',
  en_mantenimiento: 'En Mantenimiento',
  fuera_de_servicio: 'Fuera de Servicio',
};
const vacio = { nombre: '', tipo: '', ubicacion: '', estado: 'operativo', proximo_mantenimiento: '' };

const cop = (n: number) => '$ ' + Number(n).toLocaleString('es-CO');
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const fecha = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return `${d} ${MES[m - 1]} ${y}`;
};
// Días que faltan para el próximo mantenimiento (negativo = vencido)
const diasPara = (s: string | null) => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  const hoy = new Date();
  const h0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
  return Math.round((new Date(y, m - 1, d).getTime() - h0) / 86400000);
};
const alerta = (s: string | null) => {
  const d = diasPara(s);
  if (d === null) return null;
  if (d < 0) return { tipo: 'vencido', t: `Vencido(${-d}d)` };
  if (d <= 7) return { tipo: 'pronto', t: d === 0 ? 'Hoy' : `En ${d} días` };
  return null;
};

// RF-04, RF-05 y RF-10: inventario de equipos con filtros, costo acumulado y alertas
export default function Equipos() {
  const usuario = getUsuario();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [q, setQ] = useState('');
  const [fEstado, setFEstado] = useState('');
  const [fTipo, setFTipo] = useState('');
  const [fAlerta, setFAlerta] = useState('');
  const [verForm, setVerForm] = useState(false);
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      setEquipos(await api<Equipo[]>('/equipos'));
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const tipos = useMemo(() => [...new Set(equipos.map((e) => e.tipo))].sort(), [equipos]);
  const filtrados = equipos.filter((e) => {
    const texto = `${e.nombre} ${e.tipo} ${e.ubicacion} EQ-${e.id}`.toLowerCase();
    const a = alerta(e.proximo_mantenimiento);
    return (!q || texto.includes(q.toLowerCase())) && (!fEstado || e.estado === fEstado) && (!fTipo || e.tipo === fTipo) &&
      (!fAlerta || (fAlerta === 'ninguna' ? !a : a?.tipo === fAlerta));
  });

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api('/equipos', { method: 'POST', body: JSON.stringify({ ...form, proximo_mantenimiento: form.proximo_mantenimiento || null }) });
      setForm(vacio);
      setVerForm(false);
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este equipo?')) return;
    try {
      await api(`/equipos/${id}`, { method: 'DELETE' });
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Exporta lo filtrado en CSV (se abre directamente en Excel)
  const exportar = () => {
    const filas = [['Código', 'Equipo', 'Tipo', 'Ubicación', 'Estado', 'Próximo mantenimiento', 'Costo reparaciones'],
      ...filtrados.map((e) => [`EQ-${String(e.id).padStart(3, '0')}`, e.nombre, e.tipo, e.ubicacion, ESTADOS[e.estado], e.proximo_mantenimiento ?? '', String(e.costo_acumulado)])];
    const csv = '\ufeff' + filas.map((f) => f.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'inventario-equipos.csv';
    a.click();
  };

  const puedeEditar = usuario?.rol === 'administrador' || usuario?.rol === 'tecnico';

  return (
    <>
      <div className="pag-cab">
        <div>
          <h2>Inventario de Equipos y Activos</h2>
          <p>Registro centralizado, filtros por estado/ubicación y cálculo de costo acumulado</p>
        </div>
        <div className="pag-acc">
          {puedeEditar && <button className="btn-azul" onClick={() => setVerForm(!verForm)}><Icono n="plus" size={14} /> Registrar equipo</button>}
          <button className="btn-claro" onClick={exportar}><Icono n="download" size={14} /> Exportar Excel</button>
        </div>
      </div>

      {error && <div className="alerta-error">{error}</div>}

      {verForm && (
        <form className="panel form-eq" onSubmit={crear}>
          <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <input placeholder="Tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} required />
          <input placeholder="Ubicación" value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} required />
          <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
            {Object.entries(ESTADOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
          <input type="date" value={form.proximo_mantenimiento} onChange={(e) => setForm({ ...form, proximo_mantenimiento: e.target.value })} />
          <button className="btn-azul">Guardar</button>
        </form>
      )}

      <section className="panel">
        <div className="filtros">
          <label className="buscar"><Icono n="search" size={15} />
            <input placeholder="Buscar por código, nombre, tipo o ubicación..." value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
            <option value="">Todos los Estados</option>
            {Object.entries(ESTADOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
          <select value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
            <option value="">Todos los Tipos</option>
            {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={fAlerta} onChange={(e) => setFAlerta(e.target.value)}>
            <option value="">Cualquier Alerta</option>
            <option value="vencido">Vencido</option>
            <option value="pronto">Próximo (7 días)</option>
            <option value="ninguna">Sin alerta</option>
          </select>
        </div>
        <p className="conteo">Mostrando <b>{filtrados.length}</b> de {equipos.length} equipos</p>

        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr><th>EQUIPO & CÓDIGO</th><th>TIPO & UBICACIÓN</th><th>ESTADO</th><th>PRÓXIMO MANTENIMIENTO</th><th>COSTO REPARACIONES</th><th>ACCIONES</th></tr>
            </thead>
            <tbody>
              {filtrados.map((e) => {
                const a = alerta(e.proximo_mantenimiento);
                return (
                  <tr key={e.id}>
                    <td><small className="cod">EQ-{String(e.id).padStart(3, '0')}</small><strong>{e.nombre}</strong></td>
                    <td><span>{e.tipo}</span><small className="ubic"><Icono n="pin" size={11} /> {e.ubicacion}</small></td>
                    <td><span className={`estado ${e.estado}`}>{ESTADOS[e.estado]}</span></td>
                    <td>
                      <span className="fch">{e.proximo_mantenimiento ? fecha(e.proximo_mantenimiento) : '—'}</span>
                      {a && <small className={`alerta ${a.tipo}`}><Icono n={a.tipo === 'vencido' ? 'alertCircle' : 'clock'} size={11} /> {a.t}</small>}
                    </td>
                    <td><strong>{cop(e.costo_acumulado)}</strong></td>
                    <td>
                      {usuario?.rol === 'administrador' && (
                        <button className="icono-borrar" onClick={() => eliminar(e.id)} title="Eliminar equipo" aria-label="Eliminar equipo"><Icono n="trash" size={16} /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtrados.length === 0 && <tr><td colSpan={6} className="vacio">No hay equipos que coincidan</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
