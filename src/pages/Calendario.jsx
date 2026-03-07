// pages/Calendario.jsx — com distinção clara entre aula PLANEJADA e DADA
import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { useOrg } from '../store/OrgContext.jsx';
import { CalendarCheck, ClockCountdown, CheckCircle } from '@phosphor-icons/react';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

// ── Feriados ──────────────────────────────────────────────────
function calcPascoa(year) {
  const a=year%19,b=Math.floor(year/100),c=year%100;
  const d=Math.floor(b/4),e=b%4,f2=Math.floor((b+8)/25);
  const g=Math.floor((b-f2+1)/3),h=(19*a+b-d-g+15)%30;
  const i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7;
  const m=Math.floor((a+11*h+22*l)/451);
  const month=Math.floor((h+l-7*m+114)/31);
  const day=((h+l-7*m+114)%31)+1;
  return new Date(year,month-1,day);
}
function getFeriados(year) {
  const list=[
    {data:`${year}-01-01`,nome:'Confraternização Universal'},
    {data:`${year}-04-21`,nome:'Tiradentes'},
    {data:`${year}-05-01`,nome:'Dia do Trabalho'},
    {data:`${year}-09-07`,nome:'Independência do Brasil'},
    {data:`${year}-10-12`,nome:'Nossa Sra. Aparecida'},
    {data:`${year}-11-02`,nome:'Finados'},
    {data:`${year}-11-15`,nome:'Proclamação da República'},
    {data:`${year}-11-20`,nome:'Consciência Negra'},
    {data:`${year}-12-25`,nome:'Natal'},
  ];
  const pascoa=calcPascoa(year);
  const add=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
  const toISO=(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  list.push({data:toISO(pascoa),nome:'Páscoa'});
  list.push({data:toISO(add(pascoa,-2)),nome:'Sexta-feira Santa'});
  list.push({data:toISO(add(pascoa,-48)),nome:'Carnaval'});
  list.push({data:toISO(add(pascoa,-47)),nome:'Carnaval'});
  list.push({data:toISO(add(pascoa,60)),nome:'Corpus Christi'});
  return list.sort((a,b)=>a.data.localeCompare(b.data));
}

function buildCalendar(year,month) {
  const first=new Date(year,month,1);
  const last=new Date(year,month+1,0);
  const days=[];
  for(let i=0;i<first.getDay();i++) days.push({date:new Date(year,month,-first.getDay()+i+1),cur:false});
  for(let i=1;i<=last.getDate();i++) days.push({date:new Date(year,month,i),cur:true});
  while(days.length%7!==0) days.push({date:new Date(year,month+1,days.length-last.getDate()-first.getDay()+1),cur:false});
  return days;
}

const fmt=(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtDisp=(iso)=>{ if(!iso) return ''; const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; };

function buildGCalLink(evt,dataISO) {
  const [y,m,d]=dataISO.split('-');
  const hora=evt.hora||'18:40';
  const [hh,mm]=hora.split(':').map(Number);
  const startDt=`${y}${m}${d}T${String(hh).padStart(2,'0')}${String(mm).padStart(2,'0')}00`;
  let endH=hh+2,endM=mm+40;
  if(endM>=60){endH++;endM-=60;}
  const endDt=`${y}${m}${d}T${String(endH).padStart(2,'0')}${String(endM).padStart(2,'0')}00`;
  const title=encodeURIComponent(`[Teachly] ${evt.titulo}`);
  const details=encodeURIComponent(`Criado via Teachly · ETE Cícero Dias${evt.obs?'\n\n'+evt.obs:''}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDt}/${endDt}&details=${details}&location=${encodeURIComponent('ETE Cícero Dias, Recife - PE')}`;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={wide?{maxWidth:580,width:'95vw'}:{}} onClick={e=>e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}

// ── Modal: Planejar Aula ──────────────────────────────────────
function ModalPlanejarAula({ dataInicial, turmas, onSalvar, onClose }) {
  const [turmaId,    setTurmaId]    = useState(turmas[0]?.id || '');
  const [discId,     setDiscId]     = useState('');
  const [aulaId,     setAulaId]     = useState('');
  const [data,       setData]       = useState(dataInicial);
  const [hora,       setHora]       = useState('18:40');
  const [obs,        setObs]        = useState('');
  const [saving,     setSaving]     = useState(false);

  const turma = turmas.find(t => t.id === turmaId);
  const discs = (turma?.disciplinas || []).filter(d => d.ativa);
  const disc  = discs.find(d => d.id === discId);

  const aulasDisc = useMemo(() => {
    if (!disc) return [];
    const result = [];
    (disc.blocos || []).forEach(b => {
      (b.aulas || []).forEach(a => {
        if (a.id !== 'NOTA') result.push({ id: a.id, titulo: a.titulo?.split('\n')[0] || a.id });
      });
    });
    return result;
  }, [disc]);

  useEffect(() => { setDiscId(''); setAulaId(''); }, [turmaId]);
  useEffect(() => { setAulaId(''); }, [discId]);

  const aulaObj = aulasDisc.find(a => a.id === aulaId);

  const salvar = async () => {
    if (!turmaId || !discId || !aulaId || !data) return;
    setSaving(true);
    await onSalvar({
      turma_id: turmaId,
      disciplina_id: discId,
      aula_id: aulaId,
      aula_titulo: aulaObj?.titulo || aulaId,
      data_planejada: data,
      hora, obs,
      status: 'planejada',
    });
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="📅 Planejar aula" onClose={onClose} wide>
      <div className="modal-field">
        <div className="modal-label">1. Turma</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {turmas.map(t => (
            <button key={t.id} onClick={() => setTurmaId(t.id)}
              style={{ padding:'6px 14px', borderRadius:99, border:`2px solid ${turmaId===t.id ? t.cor : 'var(--border)'}`, background: turmaId===t.id ? t.cor+'18' : 'transparent', color: turmaId===t.id ? t.cor : 'var(--text2)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.83rem', fontWeight: turmaId===t.id ? 700 : 400, transition:'all 0.15s' }}>
              <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:t.cor, marginRight:6 }} />
              {t.modulo} · {t.label}
            </button>
          ))}
        </div>
      </div>

      {turmaId && (
        <div className="modal-field">
          <div className="modal-label">2. Disciplina</div>
          {discs.length === 0
            ? <div style={{ color:'var(--text3)', fontSize:'0.83rem' }}>Nenhuma disciplina ativa nesta turma.</div>
            : <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {discs.map(d => (
                  <button key={d.id} onClick={() => setDiscId(d.id)}
                    style={{ padding:'6px 14px', borderRadius:99, border:`2px solid ${discId===d.id ? d.cor : 'var(--border)'}`, background: discId===d.id ? d.cor+'18' : 'transparent', color: discId===d.id ? d.cor : 'var(--text2)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.83rem', fontWeight: discId===d.id ? 700 : 400, transition:'all 0.15s' }}>
                    {d.label}
                  </button>
                ))}
              </div>
          }
        </div>
      )}

      {discId && (
        <div className="modal-field">
          <div className="modal-label">3. Aula</div>
          <select className="modal-input" value={aulaId} onChange={e => setAulaId(e.target.value)}>
            <option value="">Selecione a aula…</option>
            {aulasDisc.map(a => (
              <option key={a.id} value={a.id}>{a.titulo}</option>
            ))}
          </select>
        </div>
      )}

      {aulaId && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div className="modal-field">
            <div className="modal-label">4. Data planejada</div>
            <input type="date" className="modal-input" value={data} onChange={e => setData(e.target.value)} />
          </div>
          <div className="modal-field">
            <div className="modal-label">Hora</div>
            <input type="time" className="modal-input" value={hora} onChange={e => setHora(e.target.value)} />
          </div>
        </div>
      )}

      {aulaId && (
        <div className="modal-field">
          <div className="modal-label">Observações (opcional)</div>
          <textarea className="modal-textarea" rows={2} value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex: semana de provas, sala alternativa…" />
        </div>
      )}

      <div style={{ fontSize:'0.75rem', color:'var(--teal)', padding:'4px 0', display:'flex', alignItems:'center', gap:5 }}>
        <ClockCountdown size={13} /> Esta aula aparecerá no calendário como <strong>planejada</strong>. Marque como "dada" quando a aula acontecer.
      </div>
      <div className="modal-footer">
        <button className="btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={salvar} disabled={!turmaId||!discId||!aulaId||!data||saving}>
          {saving ? 'Salvando…' : 'Planejar aula'}
        </button>
      </div>
    </Modal>
  );
}

// ── Página principal ──────────────────────────────────────────
export function Calendario() {
  const { turmas } = useOrg();
  const today = new Date();

  const [year,    setYear]    = useState(today.getFullYear());
  const [month,   setMonth]   = useState(today.getMonth());
  const [selected, setSelected] = useState(fmt(today));
  const [eventos, setEventos] = useState([]);
  const [planejadas, setPlanejadas] = useState([]);  // inclui status: 'planejada' | 'dada'
  const [filtro, setFiltro] = useState('tudo'); // tudo | planejadas | dadas | eventos
  const [showModalEvt, setShowModalEvt] = useState(false);
  const [showModalPlan, setShowModalPlan] = useState(false);
  const [showFeriados, setShowFeriados] = useState(false);
  const [marcando, setMarcando] = useState(null); // id sendo marcado
  const [form, setForm] = useState({ titulo:'', hora:'18:40', turmaId:'', tipo:'aula', obs:'' });

  useEffect(() => {
    supabase.from('eventos_calendario').select('*').order('data').then(({ data }) => setEventos(data || []));
    supabase.from('aulas_planejadas').select('*').order('data_planejada').then(({ data }) => setPlanejadas(data || []));
  }, []);

  const days = buildCalendar(year, month);
  const feriados = useMemo(() => getFeriados(year), [year]);
  const feriadosMap = useMemo(() => { const m={}; feriados.forEach(f=>{m[f.data]=f;}); return m; }, [feriados]);
  const aulasAfetadas = useMemo(() => feriados.filter(f => { const d=new Date(f.data+'T12:00:00'); return d.getDay()>=1&&d.getDay()<=5; }), [feriados]);

  const prevMonth = () => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

  // ── Marcar aula como dada (ou voltar para planejada) ──────────
  const toggleStatus = async (item) => {
    const novoStatus = item.status === 'dada' ? 'planejada' : 'dada';
    const dataDada = novoStatus === 'dada' ? fmt(today) : null;
    setMarcando(item.id);
    const { error } = await supabase
      .from('aulas_planejadas')
      .update({ status: novoStatus, data_dada: dataDada })
      .eq('id', item.id);
    if (!error) {
      setPlanejadas(p => p.map(x => x.id === item.id ? { ...x, status: novoStatus, data_dada: dataDada } : x));
    }
    setMarcando(null);
  };

  // Por dia: eventos + planejadas (como itens unificados)
  const itemsOnDay = (d) => {
    const evts = eventos.filter(e => e.data === d).map(e => ({ ...e, _tipo:'evento' }));
    const plans = planejadas.filter(p => p.data_planejada === d).map(p => ({
      ...p,
      _tipo: p.status === 'dada' ? 'dada' : 'planejada',
      titulo: p.aula_titulo,
      turmaLabel: turmas.find(t => t.id === p.turma_id)?.label || '',
      turma: turmas.find(t => t.id === p.turma_id),
    }));
    return [...evts, ...plans];
  };

  // Filtra itens do dia selecionado
  const todosItens = itemsOnDay(selected);
  const itensFiltrados = todosItens.filter(it => {
    if (filtro === 'tudo') return true;
    if (filtro === 'planejadas') return it._tipo === 'planejada';
    if (filtro === 'dadas')     return it._tipo === 'dada';
    if (filtro === 'eventos')   return it._tipo === 'evento';
    return true;
  });

  // Dots no calendário
  const hasPlanejadaDay = (d) => planejadas.some(p => p.data_planejada === d && p.status !== 'dada');
  const hasDadaDay      = (d) => planejadas.some(p => p.data_planejada === d && p.status === 'dada');
  const hasEventoDay    = (d) => eventos.some(e => e.data === d);

  const salvarEvento = async () => {
    if (!form.titulo.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('eventos_calendario')
      .insert({ titulo: form.titulo.trim(), hora: form.hora, tipo: form.tipo, obs: form.obs, data: selected, professor_id: user.id })
      .select().single();
    if (data) setEventos(ev => [...ev, data]);
    setShowModalEvt(false);
    setForm({ titulo:'', hora:'18:40', turmaId:'', tipo:'aula', obs:'' });
  };

  const salvarPlanejada = async (payload) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('aulas_planejadas')
      .insert({ ...payload, professor_id: user.id }).select().single();
    if (data) setPlanejadas(p => [...p, data]);
  };

  const excluirEvento = async (id) => {
    await supabase.from('eventos_calendario').delete().eq('id', id);
    setEventos(ev => ev.filter(e => e.id !== id));
  };

  const excluirPlanejada = async (id) => {
    await supabase.from('aulas_planejadas').delete().eq('id', id);
    setPlanejadas(p => p.filter(x => x.id !== id));
  };

  const TIPOS = { aula:'Aula', avaliacao:'Avaliação', evento:'Evento', feriado:'Feriado', outro:'Outro' };
  const dayName = () => DIAS_SEMANA[new Date(selected+'T12:00:00').getDay()];
  const feriadoSel = feriadosMap[selected];

  // Contagem geral para o mês visível
  const aulasDoMes = planejadas.filter(p => {
    const [y, m] = p.data_planejada.split('-').map(Number);
    return y === year && m === month + 1;
  });
  const dadasDoMes     = aulasDoMes.filter(p => p.status === 'dada').length;
  const planejDoMes    = aulasDoMes.filter(p => p.status !== 'dada').length;

  return (
    <div className="anim-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Calendário</div>
          <div className="page-subtitle">Eventos, aulas planejadas e aulas dadas</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          {/* Filtro visual */}
          <div style={{ display:'flex', background:'var(--surface2)', borderRadius:10, border:'1px solid var(--border)', overflow:'hidden' }}>
            {[
              { val:'tudo',       label:'Tudo',       icon:'📅' },
              { val:'planejadas', label:'Planejadas',  icon:'🕐' },
              { val:'dadas',      label:'Dadas',       icon:'✅' },
              { val:'eventos',    label:'Eventos',     icon:'📌' },
            ].map(f => (
              <button key={f.val} onClick={() => setFiltro(f.val)}
                style={{ padding:'6px 12px', border:'none', background: filtro===f.val ? 'var(--accent)' : 'transparent', color: filtro===f.val ? 'white' : 'var(--text2)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.78rem', fontWeight: filtro===f.val ? 700 : 400, transition:'all 0.15s' }}>
                {f.icon} {f.label}
              </button>
            ))}
          </div>
          <button className="btn-ghost" onClick={() => setShowFeriados(true)}>🎉 Feriados</button>
          <button className="btn-ghost" onClick={() => setShowModalPlan(true)}>📚 Planejar aula</button>
          <button className="btn-primary" onClick={() => setShowModalEvt(true)}>+ Evento</button>
        </div>
      </div>

      {/* Resumo do mês */}
      {(dadasDoMes > 0 || planejDoMes > 0) && (
        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:10, padding:'8px 14px' }}>
            <CheckCircle size={16} color="var(--green)" weight="fill" />
            <span style={{ fontSize:'0.82rem', color:'var(--text2)' }}>
              <strong style={{ color:'var(--green)' }}>{dadasDoMes}</strong> aula{dadasDoMes !== 1 ? 's' : ''} dada{dadasDoMes !== 1 ? 's' : ''} em {MESES[month]}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(20,184,166,0.08)', border:'1px solid rgba(20,184,166,0.25)', borderRadius:10, padding:'8px 14px' }}>
            <ClockCountdown size={16} color="var(--teal)" />
            <span style={{ fontSize:'0.82rem', color:'var(--text2)' }}>
              <strong style={{ color:'var(--teal)' }}>{planejDoMes}</strong> planejada{planejDoMes !== 1 ? 's' : ''} pendente{planejDoMes !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Alerta feriados */}
      {aulasAfetadas.length > 0 && (
        <div style={{ background:'rgba(251,191,36,0.07)', border:'1px solid var(--amber-border)', borderRadius:'var(--r-md)', padding:'12px 16px', marginBottom:20 }}>
          <div style={{ fontWeight:700, color:'var(--amber)', marginBottom:6, fontSize:'0.875rem' }}>
            ⚠ {aulasAfetadas.length} feriado{aulasAfetadas.length>1?'s':''} em dias úteis em {year}
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {aulasAfetadas.slice(0,5).map(f => {
              const d=new Date(f.data+'T12:00:00');
              return <span key={f.data} style={{ background:'var(--amber-bg)', color:'var(--amber)', border:'1px solid var(--amber-border)', borderRadius:99, padding:'2px 10px', fontSize:'0.72rem' }}>{fmtDisp(f.data)} ({DIAS_SEMANA[d.getDay()]}) · {f.nome}</span>;
            })}
            {aulasAfetadas.length>5&&<span style={{color:'var(--text3)',fontSize:'0.72rem',alignSelf:'center'}}>+{aulasAfetadas.length-5} mais</span>}
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:32, alignItems:'start' }}>
        {/* Calendário */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:20 }}>
          <div className="cal-header">
            <button className="cal-nav-btn" onClick={prevMonth}>◀</button>
            <div className="cal-month">{MESES[month]} {year}</div>
            <button className="cal-nav-btn" onClick={nextMonth}>▶</button>
          </div>
          <div className="cal-grid">
            {DIAS_SEMANA.map(d => <div key={d} className="cal-day-header">{d}</div>)}
            {days.map((d, i) => {
              const key = fmt(d.date);
              const hasEvt  = hasEventoDay(key);
              const hasPlan = hasPlanejadaDay(key);
              const hasDada = hasDadaDay(key);
              const isFeriado = !!feriadosMap[key];
              const isToday = key === fmt(today);
              const isSel = key === selected;
              return (
                <div key={i}
                  className={`cal-day${!d.cur?' other-month':''}${isToday?' today':''}${isSel&&!isToday?' selected':''}${hasEvt?' has-event':''}`}
                  onClick={() => setSelected(key)}
                  style={{ position:'relative' }}
                  title={isFeriado ? feriadosMap[key].nome : undefined}
                >
                  {d.date.getDate()}
                  {d.cur && (
                    <div style={{ position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)', display:'flex', gap:2 }}>
                      {hasEvt  && <span style={{ width:4, height:4, borderRadius:'50%', background:'var(--accent-light)', display:'block' }} />}
                      {hasPlan && <span style={{ width:4, height:4, borderRadius:'50%', background:'var(--teal)', display:'block' }} />}
                      {hasDada && <span style={{ width:4, height:4, borderRadius:'50%', background:'var(--green)', display:'block' }} />}
                      {isFeriado && <span style={{ width:4, height:4, borderRadius:'50%', background:'var(--amber)', display:'block' }} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Legenda */}
          <div style={{ marginTop:12, display:'flex', gap:14, fontSize:'0.7rem', color:'var(--text3)', flexWrap:'wrap' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8,height:8,borderRadius:'50%',background:'var(--accent-light)',display:'inline-block' }} /> Evento</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8,height:8,borderRadius:'50%',background:'var(--teal)',display:'inline-block' }} /> Planejada</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8,height:8,borderRadius:'50%',background:'var(--green)',display:'inline-block' }} /> Dada ✓</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8,height:8,borderRadius:'50%',background:'var(--amber)',display:'inline-block' }} /> Feriado</span>
          </div>
        </div>

        {/* Painel direito */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:20, minHeight:200 }}>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.9375rem', marginBottom:16, color:'var(--text)', paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
            {dayName()}, {fmtDisp(selected)}
          </div>

          {feriadoSel && (
            <div style={{ background:'var(--amber-bg)', border:'1px solid var(--amber-border)', borderRadius:'var(--r-sm)', padding:'8px 12px', marginBottom:12, fontSize:'0.8rem', color:'var(--amber)', fontWeight:600 }}>
              🎉 {feriadoSel.nome}
              <div style={{ fontWeight:400, color:'var(--text3)', fontSize:'0.72rem', marginTop:2 }}>Feriado nacional</div>
            </div>
          )}

          {itensFiltrados.length === 0 ? (
            <div style={{ color:'var(--text3)', fontSize:'0.85rem', padding:'20px 0', textAlign:'center' }}>
              {filtro==='planejadas' ? 'Nenhuma aula planejada neste dia.' : filtro==='dadas' ? 'Nenhuma aula dada neste dia.' : filtro==='eventos' ? 'Nenhum evento.' : 'Nenhum item neste dia.'}
            </div>
          ) : (
            <div className="cal-events">
              {itensFiltrados.map((it, idx) => {
                if (it._tipo === 'planejada' || it._tipo === 'dada') {
                  const isDada = it._tipo === 'dada';
                  const cor = isDada ? 'var(--green)' : (it.turma?.cor || 'var(--teal)');
                  const corHex = isDada ? '#22c55e' : (it.turma?.cor || '#14b8a6');
                  const isMarcando = marcando === it.id;
                  return (
                    <div key={it.id || idx} style={{ background:`${corHex}10`, border:`1px solid ${corHex}35`, borderLeft:`3px solid ${corHex}`, borderRadius:10, padding:'10px 12px' }}>
                      {/* Cabeçalho do card */}
                      <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                        {isDada
                          ? <CheckCircle size={15} color="var(--green)" weight="fill" style={{ flexShrink:0, marginTop:1 }} />
                          : <ClockCountdown size={15} color="var(--teal)" weight="fill" style={{ flexShrink:0, marginTop:1 }} />
                        }
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:'0.85rem', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {it.titulo}
                          </div>
                          <div style={{ fontSize:'0.72rem', color:'var(--text3)', marginTop:2 }}>
                            {it.turmaLabel} · {it.hora || '18:40'}
                            {it.obs && <span> · {it.obs}</span>}
                          </div>
                          {/* Badge de status */}
                          <div style={{ marginTop:5 }}>
                            <span style={{
                              display:'inline-block', fontSize:'0.65rem', fontWeight:700,
                              padding:'2px 8px', borderRadius:99,
                              background: isDada ? 'rgba(34,197,94,0.12)' : 'rgba(20,184,166,0.12)',
                              color: isDada ? 'var(--green)' : 'var(--teal)',
                              border: `1px solid ${isDada ? 'rgba(34,197,94,0.3)' : 'rgba(20,184,166,0.3)'}`,
                            }}>
                              {isDada ? '✓ Dada' : '⏳ Planejada'}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => excluirPlanejada(it.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:'0 3px', fontSize:14, flexShrink:0 }} onMouseEnter={e=>e.currentTarget.style.color='var(--red)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text3)'}>×</button>
                      </div>

                      {/* Botão: marcar como dada / voltar para planejada */}
                      <button
                        onClick={() => toggleStatus(it)}
                        disabled={isMarcando}
                        style={{
                          marginTop:8, width:'100%', padding:'5px 0',
                          border:`1px solid ${isDada ? 'rgba(20,184,166,0.35)' : 'rgba(34,197,94,0.35)'}`,
                          borderRadius:7, cursor: isMarcando ? 'wait' : 'pointer',
                          background: isDada ? 'rgba(20,184,166,0.07)' : 'rgba(34,197,94,0.07)',
                          color: isDada ? 'var(--teal)' : 'var(--green)',
                          fontSize:'0.73rem', fontWeight:600, fontFamily:'inherit',
                          transition:'all 0.15s',
                        }}
                        onMouseEnter={e=>{ if(!isMarcando) e.currentTarget.style.opacity='0.75'; }}
                        onMouseLeave={e=>{ e.currentTarget.style.opacity='1'; }}
                      >
                        {isMarcando ? '…' : isDada ? '↩ Voltar para planejada' : '✓ Marcar como dada'}
                      </button>
                    </div>
                  );
                }
                // Evento normal
                return (
                  <div key={it.id || idx} className={`cal-event turma-${it.turmaEvt}`}>
                    <div className="cal-event-title">{it.titulo}</div>
                    {it.hora && <span className="cal-event-time">{it.hora}</span>}
                    <a href={buildGCalLink(it, selected)} target="_blank" rel="noreferrer" title="Adicionar ao Google Calendar"
                      style={{ display:'inline-flex', alignItems:'center', textDecoration:'none', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:5, padding:'3px 6px', flexShrink:0, opacity:0.85, transition:'opacity 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0.85'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="18" height="18" rx="2" fill="white" stroke="#dadce0"/>
                        <rect x="3" y="3" width="18" height="5" rx="2" fill="#4285F4"/>
                        <rect x="3" y="6" width="18" height="2" fill="#4285F4"/>
                        <text x="12" y="17.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="#4285F4" fontFamily="Arial,sans-serif">{selected?new Date(selected+'T00:00:00').getDate():''}</text>
                      </svg>
                    </a>
                    <button onClick={() => excluirEvento(it.id)} style={{ color:'var(--text3)', fontSize:15, padding:'0 4px', lineHeight:1, background:'transparent', border:'none', cursor:'pointer', flexShrink:0 }} onMouseEnter={e=>e.target.style.color='var(--red)'} onMouseLeave={e=>e.target.style.color='var(--text3)'}>×</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Novo Evento */}
      {showModalEvt && (
        <Modal title="Novo evento" onClose={() => setShowModalEvt(false)}>
          <div className="modal-field">
            <div className="modal-label">Título</div>
            <input className="modal-input" placeholder="ex: Avaliação DCU – Bloco 2" value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} autoFocus />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div className="modal-field">
              <div className="modal-label">Data</div>
              <input type="date" className="modal-input" value={selected} onChange={e=>setSelected(e.target.value)} />
            </div>
            <div className="modal-field">
              <div className="modal-label">Hora</div>
              <input type="time" className="modal-input" value={form.hora} onChange={e=>setForm(f=>({...f,hora:e.target.value}))} />
            </div>
          </div>
          <div className="modal-field">
            <div className="modal-label">Tipo</div>
            <select className="modal-input" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
              {Object.entries(TIPOS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="modal-field">
            <div className="modal-label">Observações</div>
            <textarea className="modal-textarea" rows={2} value={form.obs} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} />
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setShowModalEvt(false)}>Cancelar</button>
            <button className="btn-primary" onClick={salvarEvento}>Salvar evento</button>
          </div>
        </Modal>
      )}

      {/* Modal: Planejar Aula */}
      {showModalPlan && (
        <ModalPlanejarAula
          dataInicial={selected}
          turmas={turmas}
          onSalvar={salvarPlanejada}
          onClose={() => setShowModalPlan(false)}
        />
      )}

      {/* Modal: Feriados */}
      {showFeriados && (
        <Modal title={`Feriados Nacionais ${year}`} onClose={() => setShowFeriados(false)} wide>
          <div style={{ fontSize:'0.8rem', color:'var(--text3)', marginBottom:14 }}>Feriados em <strong style={{color:'var(--amber)'}}>laranja</strong> caem em dias úteis.</div>
          <div style={{ display:'flex', flexDirection:'column', gap:7, maxHeight:400, overflowY:'auto' }}>
            {feriados.map(f => {
              const d=new Date(f.data+'T12:00:00');
              const isWeekday=d.getDay()>=1&&d.getDay()<=5;
              return (
                <div key={f.data} style={{ display:'flex', alignItems:'center', gap:12, background: isWeekday?'var(--amber-bg)':'var(--surface2)', border:`1px solid ${isWeekday?'var(--amber-border)':'var(--border)'}`, borderRadius:'var(--r-sm)', padding:'8px 12px' }}>
                  <div style={{ textAlign:'center', minWidth:54 }}>
                    <div style={{ fontSize:'0.9rem', fontWeight:700, color: isWeekday?'var(--amber)':'var(--text2)' }}>{fmtDisp(f.data).slice(0,5)}</div>
                    <div style={{ fontSize:'0.65rem', color:'var(--text3)' }}>{DIAS_SEMANA[d.getDay()]}</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, color:'var(--text)', fontSize:'0.875rem' }}>{f.nome}</div>
                    {isWeekday && <div style={{ fontSize:'0.7rem', color:'var(--amber)', marginTop:2 }}>⚠ Dia de semana</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="modal-footer">
            <button className="btn-primary" onClick={() => setShowFeriados(false)}>Fechar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
