// pages/Anotacoes.jsx — Editor robusto com tags, filtros e arquivar
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useOrg } from '../store/OrgContext.jsx';
import {
  Plus, MagnifyingGlass, PushPin, Archive,
  ArrowUUpLeft, Trash, Tag, X, Check, ArrowLeft,
  Image, Link as LinkIcon, TextB, TextItalic, ListBullets,
} from '@phosphor-icons/react';

const CORES_NOTA = [
  { bg:'#7c3aed', label:'Roxo' }, { bg:'#2563eb', label:'Azul' },
  { bg:'#059669', label:'Verde' }, { bg:'#d97706', label:'Âmbar' },
  { bg:'#dc2626', label:'Vermelho' }, { bg:'#db2777', label:'Rosa' },
  { bg:'#0891b2', label:'Ciano' }, { bg:'#6b7280', label:'Cinza' },
];

const TAGS_PADRAO = [
  { id:'geral',          label:'Geral',           cor:'#6b7280' },
  { id:'administrativo', label:'Administrativo',  cor:'#2563eb' },
  { id:'aula',           label:'Aula',            cor:'#7c3aed' },
  { id:'ideia',          label:'Ideia',           cor:'#059669' },
  { id:'importante',     label:'Importante',      cor:'#dc2626' },
  { id:'turma',          label:'Turma',           cor:'#d97706' },
];

const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' }) : '';

function TagBadge({ tag, onRemove, small }) {
  const t = TAGS_PADRAO.find(x => x.id === tag) || { label: tag, cor: '#6b7280' };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:t.cor+'18', color:t.cor, border:`1px solid ${t.cor}35`, borderRadius:99, padding: small ? '1px 7px' : '2px 9px', fontSize: small ? '0.68rem' : '0.72rem', fontWeight:600 }}>
      {t.label}
      {onRemove && <button onClick={onRemove} style={{ background:'none', border:'none', cursor:'pointer', color:t.cor, padding:0, lineHeight:1, display:'flex' }}><X size={10} weight="bold" /></button>}
    </span>
  );
}

function CardNota({ nota, onOpen, onToggleFixar, onArquivar, onDelete }) {
  const cor = nota.cor || '#7c3aed';
  const tags = nota.tags || [];
  return (
    <div onClick={() => onOpen(nota)} style={{ background:`linear-gradient(145deg,${cor}12,${cor}05)`, border:`1px solid ${cor}30`, borderTop:`3px solid ${cor}`, borderRadius:14, padding:'14px 16px', cursor:'pointer', transition:'all 0.18s', display:'flex', flexDirection:'column', gap:8 }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${cor}20`; }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
        <div style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text)', lineHeight:1.3, flex:1 }}>
          {nota.titulo || <span style={{ color:'var(--text3)', fontStyle:'italic', fontWeight:400 }}>Sem título</span>}
        </div>
        {nota.fixada && <PushPin size={13} color={cor} weight="fill" style={{ flexShrink:0, marginTop:2 }} />}
      </div>
      {nota.conteudo && (
        <div style={{ fontSize:'0.82rem', color:'var(--text2)', lineHeight:1.55, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' }}>
          {nota.conteudo}
        </div>
      )}
      {(tags.length > 0 || nota.turma_label) && (
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:2 }}>
          {tags.map(t => <TagBadge key={t} tag={t} small />)}
          {nota.turma_label && <span style={{ fontSize:'0.68rem', color:'var(--text3)', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:99, padding:'1px 7px' }}>{nota.turma_label}</span>}
        </div>
      )}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:2 }}>
        <span style={{ fontSize:'0.68rem', color:'var(--text3)' }}>{fmt(nota.atualizado_em || nota.criado_em)}</span>
        <div style={{ display:'flex', gap:2 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onToggleFixar(nota)} title={nota.fixada ? 'Desafixar' : 'Fixar'} style={{ background:'none', border:'none', cursor:'pointer', padding:'3px 5px', borderRadius:5, color:nota.fixada ? cor : 'var(--text3)' }}>
            <PushPin size={13} weight={nota.fixada ? 'fill' : 'regular'} />
          </button>
          <button onClick={() => onArquivar(nota)} title="Arquivar" style={{ background:'none', border:'none', cursor:'pointer', padding:'3px 5px', borderRadius:5, color:'var(--text3)' }}>
            <Archive size={13} />
          </button>
          <button onClick={() => onDelete(nota.id)} title="Excluir" style={{ background:'none', border:'none', cursor:'pointer', padding:'3px 5px', borderRadius:5, color:'var(--text3)' }}
            onMouseEnter={e => e.currentTarget.style.color='var(--red)'} onMouseLeave={e => e.currentTarget.style.color='var(--text3)'}>
            <Trash size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function EditorFullscreen({ nota, turmas, onSave, onClose }) {
  const [titulo,   setTitulo]   = useState(nota.titulo || '');
  const [conteudo, setConteudo] = useState(nota.conteudo || '');
  const [cor,      setCor]      = useState(nota.cor || '#7c3aed');
  const [tags,     setTags]     = useState(nota.tags || []);
  const [turmaId,  setTurmaId]  = useState(nota.turma_id || '');
  const [showTags, setShowTags] = useState(false);
  const [saved,    setSaved]    = useState(false);
  const taRef = useRef();
  const autoSaveRef = useRef();

  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = 'auto';
      taRef.current.style.height = taRef.current.scrollHeight + 'px';
    }
  }, [conteudo]);

  const save = useCallback(() => {
    onSave({ ...nota, titulo, conteudo, cor, tags, turma_id: turmaId || null });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [nota, titulo, conteudo, cor, tags, turmaId, onSave]);

  useEffect(() => {
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(save, 1200);
    return () => clearTimeout(autoSaveRef.current);
  }, [titulo, conteudo, cor, tags, turmaId]);

  const toggleTag = (tagId) => setTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);

  const insertText = (before, after = '') => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = conteudo.slice(s, e);
    setConteudo(conteudo.slice(0, s) + before + sel + after + conteudo.slice(e));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + before.length, e + before.length); }, 0);
  };

  const btnStyle = { background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:'5px 7px', borderRadius:5, display:'flex', alignItems:'center' };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 20px', borderBottom:`2px solid ${cor}40`, background:`linear-gradient(90deg,${cor}0d,transparent)`, flexWrap:'wrap' }}>
        <button onClick={async () => { clearTimeout(autoSaveRef.current); try { await save(); } catch(e) { console.error(e); } finally { onClose(); } }}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'1px solid var(--border)', borderRadius:7, cursor:'pointer', color:'var(--text2)', padding:'5px 12px', fontSize:'0.83rem', fontFamily:'inherit', fontWeight:600 }}>
          <ArrowLeft size={15} /> Voltar
        </button>
        <div style={{ width:1, height:20, background:'var(--border)', margin:'0 2px' }} />
        <button onClick={() => insertText('**','**')} title="Negrito" style={btnStyle}><TextB size={15} weight="bold" /></button>
        <button onClick={() => insertText('_','_')} title="Itálico" style={btnStyle}><TextItalic size={15} /></button>
        <button onClick={() => insertText('\n- ')} title="Lista" style={btnStyle}><ListBullets size={15} /></button>
        <button onClick={() => insertText('![alt](',')')} title="Imagem" style={btnStyle}><Image size={15} /></button>
        <button onClick={() => insertText('[texto](',')')} title="Link" style={btnStyle}><LinkIcon size={15} /></button>
        <div style={{ width:1, height:20, background:'var(--border)', margin:'0 2px' }} />

        {/* Tags dropdown */}
        <div style={{ position:'relative' }}>
          <button onClick={() => setShowTags(p => !p)}
            style={{ display:'flex', alignItems:'center', gap:5, background: showTags ? 'var(--surface2)' : 'none', border:'1px solid var(--border)', borderRadius:7, cursor:'pointer', color:'var(--text2)', padding:'4px 10px', fontSize:'0.8rem', fontFamily:'inherit' }}>
            <Tag size={13} /> Tags {tags.length > 0 && <span style={{ background:cor, color:'white', borderRadius:99, width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700 }}>{tags.length}</span>}
          </button>
          {showTags && (
            <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:10, zIndex:10, minWidth:195, boxShadow:'0 8px 24px rgba(0,0,0,0.15)', display:'flex', flexDirection:'column', gap:4 }}>
              {TAGS_PADRAO.map(t => (
                <button key={t.id} onClick={() => toggleTag(t.id)}
                  style={{ display:'flex', alignItems:'center', gap:8, background: tags.includes(t.id) ? t.cor+'18' : 'transparent', border:'none', borderRadius:6, padding:'6px 10px', cursor:'pointer', color: tags.includes(t.id) ? t.cor : 'var(--text2)', fontFamily:'inherit', fontSize:'0.83rem', fontWeight: tags.includes(t.id) ? 600 : 400 }}>
                  {tags.includes(t.id) ? <Check size={12} weight="bold" /> : <span style={{ width:12 }} />}
                  <span style={{ width:8, height:8, borderRadius:'50%', background:t.cor, flexShrink:0 }} />
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Turma */}
        <select value={turmaId} onChange={e => setTurmaId(e.target.value)}
          style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:7, color:'var(--text2)', padding:'4px 8px', fontSize:'0.8rem', fontFamily:'inherit', cursor:'pointer' }}>
          <option value="">Sem turma</option>
          {turmas.map(t => <option key={t.id} value={t.id}>{t.modulo} · {t.label}</option>)}
        </select>

        <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center' }}>
          {CORES_NOTA.map(c => (
            <div key={c.bg} onClick={() => setCor(c.bg)} title={c.label} style={{ width:15, height:15, borderRadius:'50%', background:c.bg, cursor:'pointer', border: cor===c.bg ? '2px solid white' : '2px solid transparent', boxShadow: cor===c.bg ? `0 0 0 2px ${c.bg}` : 'none', transition:'all 0.12s' }} />
          ))}
          <span style={{ fontSize:'0.7rem', color: saved ? 'var(--green)' : 'var(--text3)', marginLeft:6 }}>
            {saved ? '✓ Salvo' : 'Autosalvando…'}
          </span>
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex:1, overflowY:'auto', padding:'40px 32px', maxWidth:820, width:'100%', margin:'0 auto' }}>
        <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título da anotação…"
          style={{ background:'transparent', border:'none', outline:'none', color:'var(--text)', fontFamily:'var(--font-display)', fontSize:'1.75rem', fontWeight:700, lineHeight:1.25, width:'100%', marginBottom:16 }} />
        {tags.length > 0 && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
            {tags.map(t => <TagBadge key={t} tag={t} onRemove={() => toggleTag(t)} />)}
          </div>
        )}
        <textarea ref={taRef} value={conteudo} onChange={e => setConteudo(e.target.value)}
          placeholder="Escreva aqui… Suporte a links [texto](url) e imagens ![](url)"
          style={{ background:'transparent', border:'none', outline:'none', color:'var(--text2)', fontFamily:'var(--font-body)', fontSize:'1rem', lineHeight:1.8, width:'100%', resize:'none', overflow:'hidden', minHeight:400 }} />
      </div>
    </div>
  );
}

export function Anotacoes() {
  const { turmas } = useOrg();
  const [notas,         setNotas]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [busca,         setBusca]         = useState('');
  const [filtroTag,     setFiltroTag]     = useState('todas');
  const [filtroTurma,   setFiltroTurma]   = useState('todas');
  const [verArquivadas, setVerArquivadas] = useState(false);
  const [editando,      setEditando]      = useState(null);

  useEffect(() => {
    supabase.from('anotacoes').select('*')
      .order('fixada', { ascending:false }).order('atualizado_em', { ascending:false })
      .then(({ data }) => { setNotas(data || []); setLoading(false); });
  }, []);

  const notasEnriquecidas = notas.map(n => ({
    ...n, turma_label: n.turma_id ? (turmas.find(t => t.id === n.turma_id)?.label || null) : null,
  }));

  const nova = async () => {
    const { data:{ user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('anotacoes')
      .insert({ professor_id: user.id, titulo:'', conteudo:'', cor:'#7c3aed', fixada:false, tags:[], arquivada:false })
      .select().single();
    if (data) { setNotas(n => [data, ...n]); setEditando(data); }
  };

  const salvar = async (nota) => {
    const { data } = await supabase.from('anotacoes')
      .update({ titulo:nota.titulo, conteudo:nota.conteudo, cor:nota.cor, tags:nota.tags, turma_id:nota.turma_id, atualizado_em:new Date().toISOString() })
      .eq('id', nota.id).select().single();
    if (data) setNotas(n => n.map(x => x.id===nota.id ? data : x));
  };

  const deletar = async (id) => {
    if (!confirm('Excluir esta anotação?')) return;
    await supabase.from('anotacoes').delete().eq('id', id);
    setNotas(n => n.filter(x => x.id!==id));
    if (editando?.id === id) setEditando(null);
  };

  const toggleFixar = async (nota) => {
    const { data } = await supabase.from('anotacoes').update({ fixada: !nota.fixada }).eq('id', nota.id).select().single();
    if (data) setNotas(n => [...n.map(x => x.id===nota.id ? data : x)].sort((a,b) => (b.fixada?1:0)-(a.fixada?1:0)));
  };

  const arquivar = async (nota) => {
    const { data } = await supabase.from('anotacoes').update({ arquivada: !nota.arquivada }).eq('id', nota.id).select().single();
    if (data) setNotas(n => n.map(x => x.id===nota.id ? data : x));
  };

  const visiveis = notasEnriquecidas.filter(n => {
    if (!!n.arquivada !== verArquivadas) return false;
    if (busca && !(n.titulo+n.conteudo).toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtroTag !== 'todas' && !(n.tags||[]).includes(filtroTag)) return false;
    if (filtroTurma === 'sem_turma' && n.turma_id) return false;
    if (filtroTurma !== 'todas' && filtroTurma !== 'sem_turma' && n.turma_id !== filtroTurma) return false;
    return true;
  });

  const fixadas = visiveis.filter(n => n.fixada && !n.arquivada);
  const normais = visiveis.filter(n => !n.fixada);
  const qtdArquivadas = notas.filter(n => n.arquivada).length;

  if (loading) return <div style={{ color:'var(--text3)', padding:32 }}>Carregando...</div>;

  if (editando) {
    return <EditorFullscreen nota={editando} turmas={turmas} onSave={async (nota) => { await salvar(nota); setEditando(p => ({...p,...nota})); }} onClose={() => setEditando(null)} />;
  }

  return (
    <div className="anim-up">
      <div className="page-header">
        <div>
          <div className="page-title">{verArquivadas ? 'Arquivadas' : 'Anotações'}</div>
          <div className="page-subtitle">{visiveis.length} nota{visiveis.length!==1?'s':''}</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {qtdArquivadas > 0 && (
            <button className="btn-ghost" onClick={() => setVerArquivadas(p => !p)}>
              {verArquivadas ? <><ArrowUUpLeft size={14} style={{marginRight:5}} />Ver ativas</> : <><Archive size={14} style={{marginRight:5}} />Arquivadas ({qtdArquivadas})</>}
            </button>
          )}
          {!verArquivadas && <button className="btn-primary" onClick={nova}><Plus size={15} weight="bold" style={{marginRight:5}} />Nova anotação</button>}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:'1 1 200px', minWidth:160 }}>
          <MagnifyingGlass size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', pointerEvents:'none' }} />
          <input className="modal-input" placeholder="Buscar anotações…" value={busca} onChange={e => setBusca(e.target.value)} style={{ paddingLeft:30, width:'100%' }} />
        </div>
        <select className="modal-input" value={filtroTag} onChange={e => setFiltroTag(e.target.value)} style={{ minWidth:130 }}>
          <option value="todas">Todas as tags</option>
          {TAGS_PADRAO.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select className="modal-input" value={filtroTurma} onChange={e => setFiltroTurma(e.target.value)} style={{ minWidth:150 }}>
          <option value="todas">Todas as turmas</option>
          <option value="sem_turma">Sem turma</option>
          {turmas.map(t => <option key={t.id} value={t.id}>{t.modulo} · {t.label}</option>)}
        </select>
      </div>

      {visiveis.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text3)' }}>
          {notas.length === 0 ? 'Nenhuma anotação ainda — crie a primeira!' : 'Nenhuma nota corresponde aos filtros.'}
        </div>
      ) : (
        <>
          {fixadas.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:'0.7rem', color:'var(--text3)', fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                <PushPin size={11} weight="fill" /> Fixadas
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
                {fixadas.map(n => <CardNota key={n.id} nota={n} onOpen={setEditando} onToggleFixar={toggleFixar} onArquivar={arquivar} onDelete={deletar} />)}
              </div>
            </div>
          )}
          {normais.length > 0 && (
            <div>
              {fixadas.length > 0 && <div style={{ fontSize:'0.7rem', color:'var(--text3)', fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>{verArquivadas ? 'Arquivadas' : 'Notas'}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
                {normais.map(n => <CardNota key={n.id} nota={n} onOpen={setEditando} onToggleFixar={toggleFixar} onArquivar={arquivar} onDelete={deletar} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}