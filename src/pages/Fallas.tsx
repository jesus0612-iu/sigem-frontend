import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { Icono } from '../icons';

interface Falla {
  id: number;
  fecha: string;
  descripcion: string;
  equipo_id: number;
  equipo: string;
  reportada_por: number;
  reportada: string;
}
interface EquipoMin { id: number; nombre: string }

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const fecha = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MES[m - 1]} ${y}`;
};
const hoy = () => new Date().toLocaleDateString('en-CA'); // AAAA-MM-DD en hora local
const vacio = () => ({ equipo_id: '', fecha: hoy(), descripcion: '' });

// RF-09: registro de los problemas o fallas presentadas por un equipo
export default function Fallas() {
  const [fallas, setFallas] = useState<Falla[]>([]);
  const [equipos, setEquipos] = useState<EquipoMin[]>([]);
  const [q, setQ] = useState('');
  const [fEquipo, setFEquipo] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(vacio());
  const [error, setError] = useState('');
  const [errorForm, setErrorForm] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [f, e] = await Promise.all([
        api<Falla[]>('/mantenimientos/fallas'),
        api<EquipoMin[]>('/equipos'),
      ]);
      setFallas(f);
      setEquipos(e);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const filtradas = useMemo(
    () => fallas.filter((f) => {
      const texto = `${f.equipo} ${f.descripcion} ${f.reportada}`.toLowerCase();
      return (!q || texto.includes(q.toLowerCase())) && (!fEquipo || String(f.equipo_id) === fEquipo);
    }),
    [fallas, q, fEquipo]
  );

  const abrirNuevo = () => { setForm(vacio()); setErrorForm(''); setModal(true); };
  const cerrar = () => setModal(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm('');
    try {
      const body = JSON.stringify({ ...form, equipo_id: Number(form.equipo_id) });
      await api('/mantenimientos/fallas', { method: 'POST', body });
      cerrar();
      cargar();
    } catch (err) {
      setErrorForm((err as Error).message);
    }
  };

  return (
    <>
      <div className="pag-cab">
        <div>
          <h2>Registro de Fallas (RF-09)</h2>
          <p>Problemas o fallas presentadas por los equipos</p>
        </div>
        <div className="pag-acc">
          <button className="btn-azul" onClick={abrirNuevo}><Icono n="plus" size={14} /> Registrar Falla</button>
        </div>
      </div>

      {error && <div className="alerta-error">{error}</div>}

      <section className="panel">
        <div className="filtros">
          <label className="buscar"><Icono n="search" size={15} />
            <input placeholder="Buscar por equipo, descripción o quien reportó..." value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select value={fEquipo} onChange={(e) => setFEquipo(e.target.value)}>
            <option value="">Todos los Equipos</option>
            {equipos.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </select>
        </div>
        <p className="conteo izq">Total de fallas: <b>{filtradas.length}</b></p>
      </section>

      <section className="panel sin-pad">
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr><th>FECHA</th><th>EQUIPO</th><th>DESCRIPCIÓN DE LA FALLA</th><th>REPORTADA POR</th></tr>
            </thead>
            <tbody>
              {filtradas.map((f) => (
                <tr key={f.id}>
                  <td><span className="fch">{fecha(f.fecha)}</span></td>
                  <td><strong>{f.equipo}</strong></td>
                  <td>{f.descripcion}</td>
                  <td><span className="tec"><Icono n="user" size={13} /> {f.reportada}</span></td>
                </tr>
              ))}
              {filtradas.length === 0 && <tr><td colSpan={4} className="vacio">No hay fallas registradas</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <div className="modal-fondo" onClick={cerrar}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
            <header>
              <h3>Registrar Falla</h3>
              <button type="button" className="icono-btn" onClick={cerrar} aria-label="Cerrar"><Icono n="x" size={18} /></button>
            </header>
            <label>Equipo
              <select value={form.equipo_id} onChange={(e) => setForm({ ...form, equipo_id: e.target.value })} required>
                <option value="">Seleccione un equipo</option>
                {equipos.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
              </select>
            </label>
            <label>Fecha de la falla
              <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
            </label>
            <label>Descripción del problema
              <textarea rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required />
            </label>
            {errorForm && <div className="alerta-error">{errorForm}</div>}
            <div className="modal-acc">
              <button type="button" className="btn-claro" onClick={cerrar}>Cancelar</button>
              <button className="btn-azul">Registrar</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}