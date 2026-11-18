import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Gift, CalendarDays, LockKeyhole, LogOut, RefreshCw, Plus, CheckCircle2, Clock3 } from 'lucide-react';
import './style.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const money = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(n || 0));
const monthName = value => new Date(`${value}T12:00:00`).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

function App() {
  const [settings, setSettings] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ipcMonth, setIpcMonth] = useState('');
  const [effectiveMonth, setEffectiveMonth] = useState('');
  const [variation, setVariation] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadData() {
    if (!supabase) { setLoading(false); setError('Falta configurar la conexión con Supabase.'); return; }
    setLoading(true); setError('');
    const [s, u, b, a] = await Promise.all([
      supabase.from('app_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('ipc_updates').select('*').order('effective_month', { ascending: false }),
      supabase.from('birthdays').select('*').order('birthday_month').order('birthday_day'),
      supabase.from('gift_assignments').select('*').order('birthday_month').order('birthday_day')
    ]);
    const firstError = [s,u,b,a].find(x => x.error)?.error;
    if (firstError) setError(firstError.message);
    setSettings(s.data); setUpdates(u.data || []); setBirthdays(b.data || []); setAssignments(a.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  const todayMonth = new Date().toISOString().slice(0,7);
  const current = useMemo(() => {
    if (!settings) return null;
    const applicable = updates.filter(x => x.effective_month <= `${todayMonth}-01`).sort((a,b) => b.effective_month.localeCompare(a.effective_month))[0];
    return applicable ? Number(applicable.value_after) : Number(settings.base_value);
  }, [settings, updates, todayMonth]);

  async function login(e) {
    e.preventDefault(); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message); else { setPassword(''); setAdminOpen(true); }
  }
  async function logout() { await supabase.auth.signOut(); setAdminOpen(false); }
  async function addIpc(e) {
    e.preventDefault(); if (!settings || !variation || !effectiveMonth || !ipcMonth) return;
    setSaving(true); setError('');
    const previous = updates.filter(x => x.effective_month < `${effectiveMonth}-01`).sort((a,b) => b.effective_month.localeCompare(a.effective_month))[0];
    const base = previous ? Number(previous.value_after) : Number(settings.base_value);
    const valueAfter = Math.round(base * (1 + Number(variation) / 100));
    const { error } = await supabase.from('ipc_updates').insert({ ipc_month: `${ipcMonth}-01`, effective_month: `${effectiveMonth}-01`, variation_pct: Number(variation), value_after: valueAfter });
    if (error) setError(error.message); else { setVariation(''); await loadData(); }
    setSaving(false);
  }

  const upcoming = [...assignments].sort((a,b) => `${a.birthday_month}-${String(a.birthday_day).padStart(2,'0')}`.localeCompare(`${b.birthday_month}-${String(b.birthday_day).padStart(2,'0')}`));

  return <div className="page">
    <header className="topbar"><div className="brand"><div className="brand-icon"><Gift size={22}/></div><div><div className="brand-title">Regalos 4to grado</div><div className="brand-subtitle">LA ESCUELITA · ORGANIZACIÓN DEL GRADO</div></div></div><button className="admin-toggle" onClick={() => setAdminOpen(v => !v)}>{session ? <><LockKeyhole size={16}/> Administración</> : <><LockKeyhole size={16}/> Acceso familias</>}</button></header>
    <main>
      <section className="hero"><div className="eyebrow">CUMPLEAÑOS · CICLO 2027</div><h1>Un regalo compartido,<br/><em>una misma referencia.</em></h1><p>Un espacio común para consultar el valor de referencia y organizar los regalos de cumpleaños de 4to grado.</p></section>
      <section className="value-card"><div className="value-label">VALOR DE REFERENCIA DEL REGALO</div><div className="value-number">{settings ? money(current) : '—'}</div><div className="value-foot"><span><CalendarDays size={15}/> {settings ? `Base: ${monthName(settings.base_month.slice(0,7))}` : 'Configurando valor inicial'}</span><span className="status"><span className="dot"/> {updates.length ? 'Actualizado por IPC' : 'Valor inicial'}</span></div></section>
      <section className="how"><div className="section-heading"><span className="section-icon"><RefreshCw size={18}/></span><div><h2>¿Cómo se actualiza?</h2><p>Una regla simple y transparente para todas las familias.</p></div></div><div className="steps"><div><b>01</b><span>Se toma el valor vigente como base.</span></div><div><b>02</b><span>Se aplica la variación mensual del IPC nacional publicado por INDEC.</span></div><div><b>03</b><span>El nuevo valor rige desde el mes indicado en la actualización.</span></div></div></section>
      <section className="calendar"><div className="section-heading"><span className="section-icon"><Gift size={18}/></span><div><h2>Regalos del grado</h2><p>Cumpleaños, familias que regalan y regalos elegidos.</p></div></div>
        {upcoming.length ? <div className="birthday-list">{upcoming.map(item => <article className="birthday" key={item.id}><div className="date-chip"><b>{String(item.birthday_day).padStart(2,'0')}</b><span>{new Date(2000, item.birthday_month-1, 1).toLocaleDateString('es-AR',{month:'short'}).toUpperCase()}</span></div><div className="birthday-info"><h3>{item.child_name}</h3><p>Regala: {item.giver_family || 'A definir'}</p><p>Regalo: {item.gift_description || 'A confirmar'}</p></div><span className={`tag ${item.status === 'Entregado' ? 'done' : ''}`}>{item.status || 'Pendiente'}</span></article>)}</div> : <div className="empty"><CalendarDays size={25}/><b>El calendario se está preparando</b><span>Acá aparecerán los cumpleaños y las asignaciones de regalos del grado.</span></div>}
      </section>
      <section className="history"><div className="section-heading"><span className="section-icon"><Clock3 size={18}/></span><div><h2>Historial del valor</h2><p>Registro de las actualizaciones para mantener la referencia a la vista.</p></div></div>{updates.length ? <div className="history-list">{updates.map(x => <div className="history-row" key={x.id}><div><b>{monthName(x.effective_month.slice(0,7))}</b><small>IPC {monthName(x.ipc_month.slice(0,7))} · {Number(x.variation_pct).toLocaleString('es-AR')}%</small></div><strong>{money(x.value_after)}</strong></div>)}</div> : <div className="history-empty">El valor inicial será de {settings ? money(settings.base_value) : '$90.000'} a partir de marzo de 2027. Las actualizaciones se incorporarán a medida que se publique el IPC.</div>}</section>
      <div className="source-note">Índice de referencia: IPC nacional · INDEC. <a href="https://www.indec.gob.ar/" target="_blank" rel="noreferrer">Consultar fuente oficial ↗</a></div>
      {adminOpen && <section className="admin-panel"><div className="admin-head"><div><div className="eyebrow">PANEL PRIVADO</div><h2>Administración</h2></div>{session && <button className="text-button" onClick={logout}><LogOut size={15}/> Salir</button>}</div>
        {!session ? <form onSubmit={login} className="admin-form"><label>Email administrador<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="primary" type="submit">Ingresar</button><small>El acceso se habilita creando previamente el usuario administrador en Supabase.</small></form> : <><form onSubmit={addIpc} className="admin-form"><h3><Plus size={17}/> Cargar actualización de IPC</h3><label>Mes del IPC publicado<input type="month" value={ipcMonth} onChange={e=>setIpcMonth(e.target.value)} required/></label><label>Mes desde el que rige el nuevo valor<input type="month" value={effectiveMonth} onChange={e=>setEffectiveMonth(e.target.value)} required/></label><label>Variación mensual (%)<input type="number" step="0.01" min="-100" value={variation} onChange={e=>setVariation(e.target.value)} placeholder="Ej. 2,5" required/></label><button className="primary" disabled={saving}>{saving ? 'Guardando…' : 'Calcular y guardar nuevo valor'}</button></form><div className="admin-note"><CheckCircle2 size={16}/> El sistema calcula el nuevo valor sobre la última referencia vigente y conserva el historial.</div></>}
      </section>}
      {error && <div className="error">{error}</div>}
    </main>
    <footer>Regalos 4to grado – La Escuelita <span>Hecho para organizarnos mejor.</span></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
