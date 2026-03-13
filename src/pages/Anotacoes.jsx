// pages/Anotacoes.jsx — Editor rico com blocos, avisos, listas e formatação
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useOrg } from '../store/OrgContext.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import {
  Plus, MagnifyingGlass, PushPin, Archive,
  ArrowUUpLeft, Trash, Tag, X, Check, ArrowLeft,
  TextB, TextItalic, ListBullets, ListNumbers,
  Warning, Info, CheckCircle, Minus, Link as LinkIcon,
  Quotes,
} from '@phosphor-icons/react';

const CORES_NOTA = [
  { bg:'#7c3aed', label:'Roxo' }, { bg:'#2563eb', label:'Azul' },
  { bg:'#059669', label:'Verde' }, { bg:'#d97706', label:'Âmbar' },
  { bg:'#dc2626', label:'Vermelho' }, { bg:'#db2777', label:'Rosa' },
  { bg:'#0891b2', label:'Ciano' }, { bg:'#6b7280', label:'Cinza' },
];

const TAGS_PADRAO = [
  { id:'geral',          label:'Geral',          cor:'#6b7280' },
  { id:'administrativo', label:'Administrativo', cor:'#2563eb' },
  { id:'aula',           label:'Aula',           cor:'#7c3aed' },
  { id:'ideia',          label:'Ideia',          cor:'#059669' },
  { id:'importante',     label:'Importante',     cor:'#dc2626' },
  { id:'turma',          label:'Turma',          cor:'#d97706' },
];

const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' }) : '';

// ── Renderiza markdown simples para preview nos cards ──────────────
function renderPreview(text) {
  if (!text) return '';
  return text.replace(/\[aviso[^\]]*\]([^\[]*)\[\/aviso\]/g, '$1')
             .replace(/\*\*(.*?)\*\*/g, '$1')
             .replace(/_(.*?)_/g, '$1')
             .replace(/^#{1,3}\s/gm, '')
             .replace(/^[-*]\s/gm, '• ')
             .replace(/^\d+\.\s/gm, '')
             .replace(/^---$/gm, '')
             .trim();
}

// ── Renderiza conteúdo rico no editor preview ──────────────────────
function RichContent({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  const inlineFormat = (str) => {
    const parts = str.split(/(\*\*.*?\*\*|_.*?_|\[.*?\]\(.*?\))/g);
    return parts.map((p, idx) => {
      if (p.startsWith('**') && p.endsWith('**')) return <strong key={idx}>{p.slice(2,-2)}</strong>;
      if (p.startsWith('_') && p.endsWith('_')) return <em key={idx}>{p.slice(1,-1)}</em>;
      if (p.match(/^\[.*?\]\(.*?\)$/)) {
        const label = p.match(/\[(.*?)\]/)[1];
        const url   = p.match(/\((.*?)\)/)[1];
        return <a key={idx} href={url} target="_blank" rel="noopener noreferrer" style={{color:'var(--accent)',textDecoration:'underline'}}>{label}</a>;
      }
      return p;
    });
  };

  while (i < lines.length) {
    const line = lines[i];

    // Aviso block: [aviso tipo]...[/aviso]
    const avisoMatch = line.match(/^\[aviso (info|sucesso|atencao|erro)\](.*)$/);
    if (avisoMatch) {
      const tipo = avisoMatch[1];
      const content = [avisoMatch[2]];
      i++;
      while (i < lines.length && !lines[i].startsWith('[/aviso]')) {
        content.push(lines[i]); i++;
      }
      i++; // skip [/aviso]
      const cfg = {
        info:     { bg:'rgba(37,99,235,0.08)',  border:'#2563eb', icon:<Info size={15} weight="fill" color="#2563eb" />,    label:'Info' },
        sucesso:  { bg:'rgba(5,150,105,0.08)',   border:'#059669', icon:<CheckCircle size={15} weight="fill" color="#059669" />, label:'Sucesso' },
        atencao:  { bg:'rgba(217,119,6,0.08)',   border:'#d97706', icon:<Warning size={15} weight="fill" color="#d97706" />,  label:'Atenção' },
        erro:     { bg:'rgba(220,38,38,0.08)',    border:'#dc2626', icon:<Warning size={15} weight="fill" color="#dc2626" />,  label:'Erro' },
      }[tipo];
      elements.push(
        <div key={i} style={{ background:cfg.bg, border:`1px solid ${cfg.border}40`, borderLeft:`3px solid ${cfg.border}`, borderRadius:8, padding:'10px 14px', margin:'6px 0', display:'flex', gap:10, alignItems:'flex-start' }}>
          <span style={{marginTop:2,flexShrink:0}}>{cfg.icon}</span>
          <div style={{flex:1}}>
            {content.map((c,ci) => <div key={ci} style={{color:'var(--text)',fontSize:'0.9rem',lineHeight:1.6}}>{inlineFormat(c)}</div>)}
          </div>
        </div>
      );
      continue;
    }

    // Heading
    if (line.match(/^###\s/)) { elements.push(<h3 key={i} style={{fontSize:'1rem',fontWeight:700,color:'var(--text)',margin:'14px 0 4px'}}>{inlineFormat(line.slice(4))}</h3>); i++; continue; }
    if (line.match(/^##\s/))  { elements.push(<h2 key={i} style={{fontSize:'1.15rem',fontWeight:700,color:'var(--text)',margin:'18px 0 6px'}}>{inlineFormat(line.slice(3))}</h2>); i++; continue; }
    if (line.match(/^#\s/))   { elements.push(<h1 key={i} style={{fontSize:'1.4rem',fontWeight:800,color:'var(--text)',margin:'22px 0 8px'}}>{inlineFormat(line.slice(2))}</h1>); i++; continue; }

    // Lista não-ordenada
    if (line.match(/^[-*]\s/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) { items.push(lines[i].slice(2)); i++; }
      elements.push(<ul key={i} style={{margin:'6px 0',paddingLeft:20,display:'flex',flexDirection:'column',gap:3}}>{items.map((it,ii)=><li key={ii} style={{color:'var(--text2)',fontSize:'0.9rem',lineHeight:1.6}}>{inlineFormat(it)}</li>)}</ul>);
      continue;
    }

    // Lista ordenada
    if (line.match(/^\d+\.\s/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) { items.push(lines[i].replace(/^\d+\.\s/,'')); i++; }
      elements.push(<ol key={i} style={{margin:'6px 0',paddingLeft:20,display:'flex',flexDirection:'column',gap:3}}>{items.map((it,ii)=><li key={ii} style={{color:'var(--text2)',fontSize:'0.9rem',lineHeight:1.6}}>{inlineFormat(it)}</li>)}</ol>);
      continue;
    }

    // Separador
    if (line.trim() === '---') { elements.push(<hr key={i} style={{border:'none',borderTop:'1px solid var(--border)',margin:'16px 0'}} />); i++; continue; }

    // Citação
    if (line.match(/^>\s/)) {
      elements.push(<blockquote key={i} style={{borderLeft:'3px solid var(--accent)',paddingLeft:12,margin:'6px 0',color:'var(--text2)',fontStyle:'italic',fontSize:'0.9rem'}}>{inlineFormat(line.slice(2))}</blockquote>);
      i++; continue;
    }

    // Linha vazia
    if (!line.trim()) { elements.push(<div key={i} style={{height:8}} />); i++; continue; }

    // Parágrafo normal
    elements.push(<p key={i} style={{margin:'2px 0',color:'var(--text2)',fontSize:'0.9rem',lineHeight:1.7}}>{inlineFormat(line)}</p>);
    i++;
  }

  return <>{elements}</>;
}

// ── Tag badge ──────────────────────────────────────────────────────
function TagBadge({ tag, onRemove, small }) {
  const t = TAGS_PADRAO.find(x => x.id === tag) || { label: tag, cor: '#6b7280' };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:t.cor+'18', color:t.cor, border:`1px solid ${t.cor}35`, borderRadius:99, padding: small ? '1px 7px' : '2px 9px', fontSize: small ? '0.68rem' : '0.72rem', fontWeight:600 }}>
      {t.label}
      {onRemove && <button onClick={onRemove} style={{ background:'none', border:'none', cursor:'pointer', color:t.cor, padding:0, lineHeight:1, display:'flex' }}><X size={10} weight="bold" /></button>}
    </span>
  );
}

// ── Card de nota ───────────────────────────────────────────────────
function CardNota({ nota, onOpen, onToggleFixar, onArquivar, onDelete }) {
  const cor = nota.cor || '#7c3aed';
  const tags = nota.tags || [];
  const preview = renderPreview(nota.conteudo);
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
      {preview && (
        <div style={{ fontSize:'0.82rem', color:'var(--text2)', lineHeight:1.55, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' }}>
          {preview}
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

// ── Editor fullscreen ──────────────────────────────────────────────
function EditorFullscreen({ nota, turmas, onSave, onClose }) {
  const [titulo,    setTitulo]    = useState(nota.titulo || '');
  const [conteudo,  setConteudo]  = useState(nota.conteudo || '');
  const [cor,       setCor]       = useState(nota.cor || '#7c3aed');
  const [tags,      setTags]      = useState(nota.tags || []);
  const [turmaId,   setTurmaId]   = useState(nota.turma_id || '');
  const [saved,     setSaved]     = useState(false);
  const [showTags,  setShowTags]  = useState(false);
  const [preview,   setPreview]   = useState(false);
  const taRef        = useRef(null);
  const autoSaveRef  = useRef(null);

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

  // Insere texto no cursor
  const insert = (before, after = '', placeholder = '') => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = conteudo.slice(s, e) || placeholder;
    const next = conteudo.slice(0, s) + before + sel + after + conteudo.slice(e);
    setConteudo(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, s + before.length + sel.length);
    }, 0);
  };

  // Insere no início da linha
  const insertLine = (prefix) => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const lineStart = conteudo.lastIndexOf('\n', s - 1) + 1;
    const next = conteudo.slice(0, lineStart) + prefix + conteudo.slice(lineStart);
    setConteudo(next);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + prefix.length, s + prefix.length); }, 0);
  };

  const btnStyle = (active) => ({
    background: active ? 'var(--surface2)' : 'none',
    border: 'none', cursor:'pointer',
    color: active ? 'var(--text)' : 'var(--text3)',
    padding:'5px 8px', borderRadius:6, display:'flex', alignItems:'center',
    transition:'all 0.12s',
  });

  // Blocos de aviso prontos
  const insertAviso = (tipo) => {
    const labels = { info:'ℹ️ Informação', sucesso:'✅ Sucesso', atencao:'⚠️ Atenção', erro:'❌ Erro' };
    insert(`\n[aviso ${tipo}]${labels[tipo]}\n`, '\n[/aviso]\n', '');
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'var(--bg)', display:'flex', flexDirection:'column' }}>

      {/* Toolbar principal */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'8px 16px', borderBottom:`2px solid ${cor}40`, background:`linear-gradient(90deg,${cor}0d,transparent)`, flexWrap:'wrap', rowGap:4 }}>

        {/* Voltar */}
        <button onClick={async () => { clearTimeout(autoSaveRef.current); await save(); onClose(); }}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'1px solid var(--border)', borderRadius:7, cursor:'pointer', color:'var(--text2)', padding:'5px 12px', fontSize:'0.83rem', fontFamily:'inherit', fontWeight:600, marginRight:4 }}>
          <ArrowLeft size={15} /> Voltar
        </button>

        <div style={{ width:1, height:20, background:'var(--border)' }} />

        {/* Formatação inline */}
        <button onClick={() => insert('**','**','texto')} title="Negrito (Ctrl+B)" style={btnStyle(false)}><TextB size={15} weight="bold" /></button>
        <button onClick={() => insert('_','_','texto')} title="Itálico" style={btnStyle(false)}><TextItalic size={15} /></button>
        <button onClick={() => insert('[','](https://url.com)','link')} title="Link" style={btnStyle(false)}><LinkIcon size={15} /></button>
        <button onClick={() => insertLine('> ')} title="Citação" style={btnStyle(false)}><Quotes size={15} /></button>

        <div style={{ width:1, height:20, background:'var(--border)' }} />

        {/* Listas */}
        <button onClick={() => insertLine('- ')} title="Lista com marcadores" style={btnStyle(false)}><ListBullets size={15} /></button>
        <button onClick={() => insertLine('1. ')} title="Lista numerada" style={btnStyle(false)}><ListNumbers size={15} /></button>
        <button onClick={() => insert('\n---\n')} title="Separador" style={btnStyle(false)}><Minus size={15} /></button>

        <div style={{ width:1, height:20, background:'var(--border)' }} />

        {/* Títulos */}
        {['#','##','###'].map((h,hi) => (
          <button key={h} onClick={() => insertLine(h+' ')} title={`Título ${hi+1}`} style={{...btnStyle(false), fontWeight:700, fontSize: hi===0?'0.9rem':hi===1?'0.82rem':'0.75rem'}}>H{hi+1}</button>
        ))}

        <div style={{ width:1, height:20, background:'var(--border)' }} />

        {/* Avisos */}
        <div style={{ position:'relative' }}>
          <button onClick={() => setShowTags(p => !p)} style={{...btnStyle(showTags), gap:4, fontSize:'0.78rem', border:'1px solid var(--border)', borderRadius:6, padding:'4px 9px'}}>
            <Warning size={13} /> Aviso
          </button>
          {showTags && (
            <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:6, zIndex:20, minWidth:160, boxShadow:'0 8px 24px rgba(0,0,0,0.2)', display:'flex', flexDirection:'column', gap:2 }}>
              {[
                { tipo:'info',    label:'ℹ️ Info',     cor:'#2563eb' },
                { tipo:'sucesso', label:'✅ Sucesso',  cor:'#059669' },
                { tipo:'atencao', label:'⚠️ Atenção',  cor:'#d97706' },
                { tipo:'erro',    label:'❌ Erro',     cor:'#dc2626' },
              ].map(a => (
                <button key={a.tipo} onClick={() => { insertAviso(a.tipo); setShowTags(false); }}
                  style={{ background:'none', border:'none', borderRadius:7, padding:'7px 12px', cursor:'pointer', color:'var(--text2)', fontFamily:'inherit', fontSize:'0.83rem', textAlign:'left', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:3, height:16, background:a.cor, borderRadius:99 }} />
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tags da nota */}
        <div style={{ position:'relative', marginLeft:4 }}>
          <button onClick={() => setPreview(false)}
            style={{...btnStyle(false), gap:4, fontSize:'0.78rem', border:'1px solid var(--border)', borderRadius:6, padding:'4px 9px'}}>
            <Tag size={13} /> Tags {tags.length > 0 && <span style={{ background:cor, color:'white', borderRadius:99, width:16, height:16, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700 }}>{tags.length}</span>}
          </button>
        </div>

        {/* Turma */}
        <select value={turmaId} onChange={e => setTurmaId(e.target.value)}
          style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:7, color:'var(--text2)', padding:'4px 8px', fontSize:'0.8rem', fontFamily:'inherit', cursor:'pointer' }}>
          <option value="">Sem turma</option>
          {turmas.map(t => <option key={t.id} value={t.id}>{t.modulo} · {t.label}</option>)}
        </select>

        {/* Preview toggle */}
        <button onClick={() => setPreview(p => !p)}
          style={{...btnStyle(preview), fontSize:'0.78rem', border:'1px solid var(--border)', borderRadius:6, padding:'4px 10px', marginLeft:4}}>
          {preview ? '✏️ Editar' : '👁 Preview'}
        </button>

        {/* Cores */}
        <div style={{ marginLeft:'auto', display:'flex', gap:5, alignItems:'center' }}>
          {CORES_NOTA.map(c => (
            <div key={c.bg} onClick={() => setCor(c.bg)} title={c.label}
              style={{ width:14, height:14, borderRadius:'50%', background:c.bg, cursor:'pointer', border: cor===c.bg ? '2px solid white' : '2px solid transparent', boxShadow: cor===c.bg ? `0 0 0 2px ${c.bg}` : 'none', transition:'all 0.12s' }} />
          ))}
          <span style={{ fontSize:'0.7rem', color: saved ? 'var(--green)' : 'var(--text3)', marginLeft:6 }}>
            {saved ? '✓ Salvo' : 'Autosalvando…'}
          </span>
        </div>
      </div>

      {/* Tags selecionadas */}
      <div style={{ padding:'6px 20px 0', display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', background:`${cor}06` }}>
        {TAGS_PADRAO.map(t => (
          <button key={t.id} onClick={() => toggleTag(t.id)}
            style={{ padding:'2px 10px', borderRadius:99, border:`1px solid ${tags.includes(t.id) ? t.cor : 'var(--border)'}`, background: tags.includes(t.id) ? t.cor+'18' : 'transparent', color: tags.includes(t.id) ? t.cor : 'var(--text3)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.72rem', fontWeight:600, transition:'all 0.12s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Área de edição */}
      <div style={{ flex:1, overflowY:'auto', padding:'32px', maxWidth:820, width:'100%', margin:'0 auto' }}>
        <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título da anotação…"
          style={{ background:'transparent', border:'none', outline:'none', color:'var(--text)', fontFamily:'var(--font-display)', fontSize:'1.75rem', fontWeight:700, lineHeight:1.25, width:'100%', marginBottom:20 }} />

        {preview ? (
          <div style={{ minHeight:400 }}>
            <RichContent text={conteudo} />
          </div>
        ) : (
          <div style={{ position:'relative' }}>
            <textarea
              ref={taRef}
              value={conteudo}
              onChange={e => setConteudo(e.target.value)}
              onKeyDown={e => {
                // Enter em lista continua lista
                if (e.key === 'Enter') {
                  const ta = taRef.current;
                  const s = ta.selectionStart;
                  const lineStart = conteudo.lastIndexOf('\n', s - 1) + 1;
                  const line = conteudo.slice(lineStart, s);
                  const listMatch = line.match(/^([-*]|\d+\.)\s/);
                  if (listMatch) {
                    e.preventDefault();
                    // Se linha está vazia (só o marcador), sai da lista
                    if (line.trim() === listMatch[0].trim()) {
                      const next = conteudo.slice(0, lineStart) + '\n' + conteudo.slice(s);
                      setConteudo(next);
                    } else {
                      const prefix = listMatch[0].match(/^\d/) ? `${parseInt(listMatch[0])+1}. ` : listMatch[0];
                      const next = conteudo.slice(0, s) + '\n' + prefix + conteudo.slice(s);
                      setConteudo(next);
                      setTimeout(() => ta.setSelectionRange(s + 1 + prefix.length, s + 1 + prefix.length), 0);
                    }
                  }
                }
                // Tab insere espaços
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const ta = taRef.current;
                  const s = ta.selectionStart;
                  const next = conteudo.slice(0, s) + '  ' + conteudo.slice(s);
                  setConteudo(next);
                  setTimeout(() => ta.setSelectionRange(s+2, s+2), 0);
                }
              }}
              placeholder={`Escreva aqui… Dicas rápidas:\n- **negrito**, _itálico_\n- Liste com "- item"\n- Títulos com "# Título"\n- Avisos com o botão ⚠️ Aviso\n- Separador com "---"`}
              style={{
                background:'transparent', border:'none', outline:'none',
                color:'var(--text2)', fontFamily:'var(--font-mono, monospace)',
                fontSize:'0.95rem', lineHeight:1.8, width:'100%',
                resize:'none', minHeight:500,
                caretColor:'var(--accent)',
              }}
              rows={Math.max(20, conteudo.split('\n').length + 5)}
            />
          </div>
        )}
      </div>

      {/* Rodapé — dicas */}
      {!preview && (
        <div style={{ padding:'6px 32px', borderTop:'1px solid var(--border)', display:'flex', gap:16, flexWrap:'wrap' }}>
          {['**negrito**', '_itálico_', '# Título', '- lista', '1. numerada', '> citação', '---'].map(d => (
            <span key={d} style={{ fontSize:'0.68rem', color:'var(--text3)', fontFamily:'monospace' }}>{d}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────
export function Anotacoes({ onBack }) {
  const { turmas } = useOrg();
  const [notas,         setNotas]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [busca,         setBusca]         = useState('');
  const [filtroTag,     setFiltroTag]     = useState('todas');
  const [filtroTurma,   setFiltroTurma]   = useState('todas');
  const [verArquivadas, setVerArquivadas] = useState(false);
  const [editando,      setEditando]      = useState(null);
  const [confirmDel,    setConfirmDel]    = useState(null);

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

  const deletar = (id) => setConfirmDel(id);

  const confirmarDeletar = async () => {
    await supabase.from('anotacoes').delete().eq('id', confirmDel);
    setNotas(n => n.filter(x => x.id !== confirmDel));
    if (editando?.id === confirmDel) setEditando(null);
    setConfirmDel(null);
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
    return <EditorFullscreen nota={editando} turmas={turmas}
      onSave={async (nota) => { await salvar(nota); setEditando(p => ({...p,...nota})); }}
      onClose={() => { setEditando(null); if (onBack) onBack(); }} />;
  }

  return (
    <>
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

    {confirmDel && (
      <ConfirmModal
        title="Excluir anotação"
        message="Tem certeza que deseja excluir esta anotação? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        onConfirm={confirmarDeletar}
        onCancel={() => setConfirmDel(null)}
      />
    )}
    </>
  );
}