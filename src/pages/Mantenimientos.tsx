import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Icono } from '../icons';

interface Orden {
  id: number;
  codigo: string;
  tipo: 'preventivo' | 'correctivo';
  estado: 'programado' | 'en_proceso' | 'completado';
  fecha: string;
  fecha_real: string | null;
  descripcion: string;
  costo: number;
  equipo_id: number;
  equipo: string;
  tecnico_id: number;
  tecnico: string;
}
interface Tecnico { id: number; nombre: string }
interface EquipoMin { id: number; nombre: string }

const ESTADOS: Record<string, string> = { programado: 'Programado', en_proceso: 'En Proceso', completado: 'Completado' };
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const fecha = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MES[m - 1]} ${y}`;
};
const cop = (n: number) => '$ ' + Number(n).toLocaleString('es-CO');
const vacio = { equipo_id: '', tecnico_id: '', tipo: 'preventivo', fecha: '', descripcion: '', costo: '' };

// RF-06, RF-07 y RF-08: gestión de órdenes de mantenimiento
export default function Mantenimientos() {
  const [params, setParams] = useSearchParams();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [equipos, setEquipos] = useState<EquipoMin[]>([]);
  const [q, setQ] = useState('');
  const [fTipo, setFTipo] = useState('');
  const [fEstado, setFEstado] = useState('');
  const [fTec, setFTec] = useState('');
  const [modal, setModal] = useState(params.get('nuevo') === '1');
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState('');
  const [errorForm, setErrorForm] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [o, t, e] = await Promise.all([
        api<Orden[]>('/mantenimientos'),
        api<Tecnico[]>('/mantenimientos/tecnicos'),
        api<EquipoMin[]>('/equipos'),
      ]);
      setOrdenes(o);
      setTecnicos(t);
      setEquipos(e);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const filtradas = useMemo(
    () => ordenes.filter((o) => {
      const texto = `${o.codigo} ${o.equipo} ${o.tecnico} ${o.descripcion}`.toLowerCase();
      return (!q || texto.includes(q.toLowerCase())) && (!fTipo || o.tipo === fTipo) &&
        (!fEstado || o.estado === fEstado) && (!fTec || String(o.tecnico_id) === fTec);
    }),
    [ordenes, q, fTipo, fEstado, fTec]
  );

  const abrirNuevo = () => { setEditId(null); setForm(vacio); setErrorForm(''); setModal(true); };
  const abrirEditar = (o: Orden) => {
    setEditId(o.id);
    setForm({ equipo_id: String(o.equipo_id), tecnico_id: String(o.tecnico_id), tipo: o.tipo, fecha: o.fecha, descripcion: o.descripcion, costo: String(o.costo) });
    setErrorForm('');
    setModal(true);
  };
  const cerrar = () => { setModal(false); setParams({}); };

  // Si llegan desde el Dashboard con ?nuevo=1, el formulario ya queda abierto
  useEffect(() => { if (params.get('nuevo') === '1') abrirNuevo(); }, []); // eslint-disable-line

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm('');
    try {
      const body = JSON.stringify({ ...form, equipo_id: Number(form.equipo_id), tecnico_id: Number(form.tecnico_id), costo: Number(form.costo || 0) });
      if (editId) await api(`/mantenimientos/${editId}`, { method: 'PUT', body });
      else await api('/mantenimientos', { method: 'POST', body });
      cerrar();
      cargar();
    } catch (err) {
      setErrorForm((err as Error).message);
    }
  };

  const avanzar = async (o: Orden) => {
    try {
      await api(`/mantenimientos/${o.id}/estado`, { method: 'PATCH' });
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const exportarExcel = () => {
    const filas = [['Orden', 'Tipo', 'Equipo', 'Técnico', 'Fecha programada', 'Fecha real', 'Estado', 'Costo total'],
      ...filtradas.map((o) => [o.codigo, o.tipo, o.equipo, o.tecnico, o.fecha, o.fecha_real ?? '', ESTADOS[o.estado], String(o.costo)])];
    const csv = '\ufeff' + filas.map((f) => f.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'mantenimientos.csv';
    a.click();
  };

  return (
    <>
      <div className="pag-cab">
        <div>
          <h2>Gestión de Mantenimientos (RF-06, RF-07, RF-08)</h2>
          <p>Planificación de mantenimientos preventivos y correctivos con asignación de técnicos</p>
        </div>
        <div className="pag-acc">
          <button className="btn-claro" onClick={() => window.print()}><span className="ic-rojo"><Icono n="download" size={14} /></span> Exportar PDF</button>
          <button className="btn-claro" onClick={exportarExcel}><span className="ic-verde"><Icono n="download" size={14} /></span> Exportar Excel</button>
          <button className="btn-azul" onClick={abrirNuevo}><Icono n="plus" size={14} /> Programar Mantenimiento</button>
        </div>
      </div>

      {error && <div className="alerta-error">{error}</div>}

      <section className="panel">
        <div className="filtros">
          <label className="buscar"><Icono n="search" size={15} />
            <input placeholder="Buscar por código, equipo, técnico..." value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
            <option value="">Todos los Tipos</option>
            <option value="preventivo">Preventivo</option>
            <option value="correctivo">Correctivo</option>
          </select>
          <select value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
            <option value="">Todos los Estados</option>
            {Object.entries(ESTADOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
          <select value={fTec} onChange={(e) => setFTec(e.target.value)}>
            <option value="">Todos los Técnicos</option>
            {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>
        <p className="conteo izq">Total de órdenes: <b>{filtradas.length}</b></p>
      </section>

      <section className="panel sin-pad">
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr><th>ORDEN & TIPO</th><th>EQUIPO INTERVENIDO</th><th>TÉCNICO ASIGNADO</th><th>FECHA PROG. / REAL</th><th>ESTADO</th><th>COSTO TOTAL</th><th>ACCIONES</th></tr>
            </thead>
            <tbody>
              {filtradas.map((o) => (
                <tr key={o.id}>
                  <td><span className="orden-cod">{o.codigo}</span><span className={`chip-tipo ${o.tipo}`}>{o.tipo === 'preventivo' ? 'Preventivo' : 'Correctivo'}</span></td>
                  <td><strong>{o.equipo}</strong><small className="desc" title={o.descripcion}>{o.descripcion}</small></td>
                  <td><span className="tec"><Icono n="user" size={13} /> {o.tecnico}</span></td>
                  <td>
                    <span className="fch">Prog: {fecha(o.fecha)}</span>
                    {o.fecha_real && <small className="real">Real: {fecha(o.fecha_real)}</small>}
                  </td>
                  <td><span className={`est-o ${o.estado}`}><i /> {ESTADOS[o.estado]}</span></td>
                  <td><strong>{cop(o.costo)}</strong></td>
                  <td>
                    <div className="acc">
                      {o.estado !== 'completado' && (
                        <button className="ic-ok" onClick={() => avanzar(o)} aria-label="Avanzar estado"
                          title={o.estado === 'programado' ? 'Iniciar (pasar a En Proceso)' : 'Marcar como Completado'}><Icono n="checkCircle" size={17} /></button>
                      )}
                      <button className="ic-edit" onClick={() => abrirEditar(o)} aria-label="Editar orden" title="Editar orden"><Icono n="edit" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && <tr><td colSpan={7} className="vacio">No hay órdenes de mantenimiento</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <div className="modal-fondo" onClick={cerrar}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
            <header>
              <h3>{editId ? 'Editar Orden de Mantenimiento' : 'Programar Mantenimiento'}</h3>
              <button type="button" className="icono-btn" onClick={cerrar} aria-label="Cerrar"><Icono n="x" size={18} /></button>
            </header>
            <label>Equipo
              <select value={form.equipo_id} onChange={(e) => setForm({ ...form, equipo_id: e.target.value })} required>
                <option value="">Seleccione un equipo</option>
                {equipos.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
              </select>
            </label>
            <div className="dos">
              <label>Tipo
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  <option value="preventivo">Preventivo</option>
                  <option value="correctivo">Correctivo</option>
                </select>
              </label>
              <label>Técnico asignado
                <select value={form.tecnico_id} onChange={(e) => setForm({ ...form, tecnico_id: e.target.value })} required>
                  <option value="">Seleccione</option>
                  {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </label>
            </div>
            <div className="dos">
              <label>Fecha programada
                <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
              </label>
              <label>Costo estimado (COP)
                <input type="number" min="0" value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} placeholder="0" />
              </label>
            </div>
            <label>Descripción del trabajo
              <textarea rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required />
            </label>
            {errorForm && <div className="alerta-error">{errorForm}</div>}
            <div className="modal-acc">
              <button type="button" className="btn-claro" onClick={cerrar}>Cancelar</button>
              <button className="btn-azul">{editId ? 'Guardar cambios' : 'Programar'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
