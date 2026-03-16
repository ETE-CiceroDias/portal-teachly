// components/Bloco.jsx — v4
// • Sem ícones de lápis nos títulos — clique direto no texto para editar
// • Lixo sempre visível
// • + Aula / + Nota sempre visíveis no rodapé do bloco
import { useState, useRef } from 'react';
import { AulaDetail } from './AulaDetail.jsx';
import { ConfirmModal } from './ConfirmModal.jsx';
import { aulaId } from '../store/storage.js';
import { Trash } from '@phosphor-icons/react';

// ── Card de Nota ─────────────────────────────────────────────
function NotaRow({ aula, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(aula.titulo);

  const confirm = () => { if (draft.trim()) onEdit({ ...aula, titulo: draft }); setEditing(false); };

  if (editing) {
    return (
      <div className="nota-row" style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
          onBlur={confirm} onKeyDown={e => { if (e.key==='Enter') confirm(); if (e.key==='Escape') setEditing(false); }}
          style={{ flex:1, background:'var(--surface2)', border:'1px solid var(--accent)', borderRadius:6,
            padding:'4px 8px', color:'var(--text)', fontSize:'0.82rem', fontFamily:'inherit' }} />
      </div>
    );
  }
  return (
    <div className="nota-row" style={{ display:'flex', alignItems:'center', gap:6 }}>
      <span style={{ flex:1, cursor:'text' }} onClick={() => { setDraft(aula.titulo); setEditing(true); }}>
        {aula.titulo}
      </span>
      <button onClick={onDelete} title="Remover nota"
        style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.25)', cursor:'pointer', color:'var(--red)',
          padding:'3px 5px', borderRadius:6, opacity:0.7, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Trash size={12} />
      </button>
    </div>
  );
}

// ── Card de Aula ─────────────────────────────────────────────
function AulaCard({
  courseKey, turmaKey, aula, aulaIdx, posicao, state,
  onToggle, onSave, onDragStart, onDrop,
  onDeleteAula, onEditAula,
  isDragging, isOver,
}) {
  const [open, setOpen]               = useState(false);
  const [confirmDel, setConfirmDel]   = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draft, setDraft]             = useState('');

  const id     = aulaId(courseKey, turmaKey, aula);
  const st     = state[id] || {};
  const isDone = !!st.done;
  const hasProb = (st.problems || []).length > 0;

  const lines    = aula.titulo.split('\n');
  const title    = lines[0];
  const subLine  = lines.slice(1).join(' ').trim();
  // Usa posição real passada pelo pai, não o ID da aula
  const numLabel = posicao != null ? String(posicao).padStart(2, '0') : aula.id.replace('AULA ', '').trim();

  const pillCls   = hasProb ? 'pill-problem' : isDone ? 'pill-done' : aula.isEval ? 'pill-eval' : 'pill-pend';
  const pillLabel = hasProb ? 'Problema'     : isDone ? 'Feita'     : aula.isEval ? 'Avaliação' : 'Pendente';

  const startEdit = (e) => {
    e.stopPropagation();
    setDraft(aula.titulo);
    setEditingTitle(true);
    setOpen(true);
  };

  const confirmEdit = () => {
    if (draft.trim()) onEditAula({ ...aula, titulo: draft });
    setEditingTitle(false);
  };

  return (
    <div
      className={"aula" + (isDone ? ' done' : '')}
      data-aula-idx={aulaIdx}
      style={{
        opacity: isDragging ? 0.35 : 1,
        outline: isOver ? '2px solid var(--accent)' : 'none',
        outlineOffset: '-2px',
        transition: 'opacity 0.12s',
      }}
    >
      <div className="aula-row"
        onClick={() => !editingTitle && setOpen(o => !o)}
      >
        {/* Handle de drag — só aqui inicia o drag */}
        <span
          className="drag-handle"
          title="Arrastar para reordenar"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => {
            e.stopPropagation();
            onDragStart(aulaIdx);
          }}
          style={{ touchAction: 'none', cursor: 'grab' }}
        >⠿</span>
        <input type="checkbox" className="aula-check" checked={isDone}
          onClick={e => e.stopPropagation()} onChange={() => onToggle(id)} />
        <span className="aula-num">{numLabel}</span>

        {/* Título — clique direto para editar */}
        <div className="aula-info" style={{ flex:1 }}>
          {editingTitle ? (
            <div onClick={e => e.stopPropagation()}>
              <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)}
                onBlur={confirmEdit}
                onKeyDown={e => { if (e.key==='Escape') setEditingTitle(false); }}
                rows={2}
                style={{ background:'var(--surface2)', border:'1px solid var(--accent)', borderRadius:6,
                  padding:'6px 8px', color:'var(--text)', fontSize:'0.8125rem', width:'100%',
                  resize:'none', fontFamily:'inherit' }}
              />
              <div style={{ fontSize:'0.68rem', color:'var(--text3)', marginTop:2 }}>
                Linha 1 = título · Linha 2 = subtítulo · Enter salva
              </div>
            </div>
          ) : (
            <div
              className="aula-title-editable"
              title="Clique para editar o título"
              onClick={startEdit}
            >
              <div className="aula-name">{title}</div>
              {subLine && <div className="aula-meta">{subLine}</div>}
              {st.data_aula && (
                <div className="aula-meta aula-date-tag">
                  📅 {st.data_aula}
                  {st.data_aula_fim && st.data_aula_fim !== st.data_aula && <> → {st.data_aula_fim}</>}
                </div>
              )}
              {st.slide_url && (
                <a href={st.slide_url} target="_blank" rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="aula-meta aula-date-tag"
                  style={{ color:'var(--teal)', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:3 }}>
                  🔗 Slide
                </a>
              )}
            </div>
          )}
        </div>

        {/* Lixo — sempre visível */}
        <button
          onClick={e => { e.stopPropagation(); setConfirmDel(true); }}
          title="Remover aula"
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)',
            fontSize:'0.85rem', padding:'3px 5px', borderRadius:4, flexShrink:0, opacity:0.4,
            transition:'opacity 0.15s, color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.color='var(--red)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity='0.4'; e.currentTarget.style.color='var(--text3)'; }}
        >
          <Trash size={13} />
        </button>

        <span className={"pill " + pillCls}>{pillLabel}</span>
        <span className={"chevron" + (open ? ' open' : '')}>▼</span>
      </div>

      {open && <AulaDetail aulaId={id} aula={aula} state={st} onSave={onSave} />}

      {confirmDel && (
        <ConfirmModal title="Remover aula"
          message={`Remover "${title}"?`}
          confirmLabel="Remover"
          onConfirm={() => { setConfirmDel(false); onDeleteAula(); }}
          onCancel={() => setConfirmDel(false)} />
      )}
    </div>
  );
}

// ── Bloco ─────────────────────────────────────────────────────
export function Bloco({ bloco, blocoIdx, courseKey, turmaKey, state,
  onToggle, onSave, onReorder,
  onUpdateBloco, onDeleteBloco }) {

  const [open, setOpen]             = useState(true);
  const [confirmDel, setConfirmDel] = useState(false);

  // Edição inline do header do bloco
  const [editingTag,  setEditingTag]  = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingSub,  setEditingSub]  = useState(false);
  const [draftTag,  setDraftTag]  = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftSub,  setDraftSub]  = useState('');

  const [dragState, setDragState] = useState(null); // { fromIdx, overIdx }
  const dragRef = useRef(null);

  const iniciarDragAula = (fromIdx) => {
    dragRef.current = fromIdx;
    setDragState({ fromIdx, overIdx: fromIdx });

    const onMove = (ev) => {
      const target = document.elementFromPoint(ev.clientX, ev.clientY);
      const aulaEl = target?.closest('[data-aula-idx]');
      if (aulaEl) {
        const idx = parseInt(aulaEl.dataset.aulaIdx, 10);
        if (!isNaN(idx)) setDragState(s => s ? { ...s, overIdx: idx } : null);
      }
    };

    const onUp = (ev) => {
      const target = document.elementFromPoint(ev.clientX, ev.clientY);
      const aulaEl = target?.closest('[data-aula-idx]');
      if (aulaEl && dragRef.current !== null) {
        const toIdx = parseInt(aulaEl.dataset.aulaIdx, 10);
        if (!isNaN(toIdx) && toIdx !== dragRef.current) {
          // Reordena e renumera diretamente no bloco
          const novas = [...bloco.aulas];
          const [moved] = novas.splice(dragRef.current, 1);
          novas.splice(toIdx, 0, moved);
          onUpdateBloco({ ...bloco, aulas: renumerar(novas) });
        }
      }
      dragRef.current = null;
      setDragState(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Parseia título do bloco
  const lines   = bloco.titulo.split('\n');
  const first   = lines[0];
  const sepIdx  = first.indexOf('·');
  const tag     = sepIdx >= 0 ? first.slice(0, sepIdx).trim()      : first.trim();
  const name    = sepIdx >= 0 ? first.slice(sepIdx + 1).trim()     : (lines[1] || '').trim();
  const sub     = lines[2] || (sepIdx >= 0 ? (lines[1] || '') : (lines[2] || '')).trim();

  const realAulas = bloco.aulas.filter(a => a.id !== 'NOTA');
  const doneCount = realAulas.filter(a => (state[aulaId(courseKey, turmaKey, a)] || {}).done).length;

  // Reconstrói título e salva
  const saveHeader = (newTag, newName, newSub) => {
    const newTitulo = newSub.trim()
      ? `${newTag.trim()} · ${newName.trim()}\n${newSub.trim()}`
      : `${newTag.trim()} · ${newName.trim()}`;
    onUpdateBloco({ ...bloco, titulo: newTitulo });
  };

  // Renumera todas as aulas reais em ordem sequencial
  const renumerar = (aulas) => {
    let n = 0;
    return aulas.map(a => {
      if (a.id === 'NOTA') return a;
      n++;
      const num = String(n).padStart(2, '0');
      // Atualiza id e primeira linha do título se contiver número antigo
      const linhas = a.titulo.split('\n');
      const tituloNovo = linhas[0].replace(/^Aula \d+/i, `Aula ${num}`);
      return { ...a, id: `AULA ${num}`, titulo: [tituloNovo, ...linhas.slice(1)].join('\n') };
    });
  };

  const handleEditAula   = (ai, upd) => onUpdateBloco({ ...bloco, aulas: bloco.aulas.map((a,i) => i===ai ? upd : a) });
  const handleDeleteAula = (ai) => {
    const novas = renumerar(bloco.aulas.filter((_,i) => i !== ai));
    onUpdateBloco({ ...bloco, aulas: novas });
  };

  const handleAddAula = () => {
    const n   = realAulas.length + 1;
    const num = String(n).padStart(2, '0');
    onUpdateBloco({ ...bloco, aulas: [...bloco.aulas, { id: `AULA ${num}`, titulo: `Aula ${num}\nSubtítulo` }] });
  };

  const handleAddNota = () => {
    onUpdateBloco({ ...bloco, aulas: [...bloco.aulas, { id: 'NOTA', titulo: '📌 Nota' }] });
  };

  return (
    <div className="bloco">
      {/* ── Cabeçalho do bloco ── */}
      <div className={"bloco-head" + (open ? ' is-open' : '')}
        onClick={() => {
          if (editingTag || editingName || editingSub) return;
          setOpen(o => !o);
        }}
      >
        <div className="bloco-left" style={{ flex:1, display:'flex', alignItems:'center', gap:10 }}>
          {/* Tag (ex: "Bloco 01") — clique para editar */}
          {editingTag ? (
            <input autoFocus value={draftTag} onChange={e => setDraftTag(e.target.value)}
              onBlur={() => { saveHeader(draftTag, name, sub); setEditingTag(false); }}
              onKeyDown={e => { if (e.key==='Enter'||e.key==='Tab') { saveHeader(draftTag, name, sub); setEditingTag(false); } if(e.key==='Escape') setEditingTag(false); }}
              onClick={e => e.stopPropagation()}
              style={{ width:80, background:'var(--surface2)', border:'1px solid var(--accent)', borderRadius:6,
                padding:'3px 8px', color:'var(--accent-light)', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}
            />
          ) : (
            <span className="bloco-tag"
              title="Clique para editar"
              onClick={e => { e.stopPropagation(); setDraftTag(tag); setEditingTag(true); setOpen(true); }}
              style={{ cursor:'text' }}
            >{tag}</span>
          )}

          <div>
            {/* Nome — clique para editar */}
            {editingName ? (
              <input autoFocus value={draftName} onChange={e => setDraftName(e.target.value)}
                onBlur={() => { saveHeader(tag, draftName, sub); setEditingName(false); }}
                onKeyDown={e => { if (e.key==='Enter') { saveHeader(tag, draftName, sub); setEditingName(false); } if(e.key==='Escape') setEditingName(false); }}
                onClick={e => e.stopPropagation()}
                style={{ background:'var(--surface2)', border:'1px solid var(--accent)', borderRadius:6,
                  padding:'3px 10px', color:'var(--text)', fontSize:'0.875rem', fontWeight:700, fontFamily:'var(--font-display)', width:'100%', minWidth:180 }}
              />
            ) : (
              <div className="bloco-name"
                title="Clique para editar"
                onClick={e => { e.stopPropagation(); setDraftName(name); setEditingName(true); setOpen(true); }}
                style={{ cursor:'text' }}
              >{name}</div>
            )}

            {/* Subtítulo — clique para editar */}
            {editingSub ? (
              <input autoFocus value={draftSub} onChange={e => setDraftSub(e.target.value)}
                onBlur={() => { saveHeader(tag, name, draftSub); setEditingSub(false); }}
                onKeyDown={e => { if (e.key==='Enter') { saveHeader(tag, name, draftSub); setEditingSub(false); } if(e.key==='Escape') setEditingSub(false); }}
                onClick={e => e.stopPropagation()}
                style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6,
                  padding:'2px 8px', color:'var(--text2)', fontSize:'0.77rem', fontFamily:'inherit', width:'100%', marginTop:2 }}
              />
            ) : (
              <div
                className="bloco-sub"
                onClick={e => { e.stopPropagation(); setDraftSub(sub); setEditingSub(true); setOpen(true); }}
                style={{ cursor:'text', minHeight:16 }}
                title={sub ? 'Clique para editar' : 'Clique para adicionar subtítulo'}
              >
                {sub || <span style={{ color:'var(--muted)', fontStyle:'italic', fontSize:'0.72rem' }}>+ subtítulo</span>}
              </div>
            )}
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          {/* Lixo — sempre visível */}
          <button
            onClick={e => { e.stopPropagation(); setConfirmDel(true); }}
            title="Remover bloco"
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)',
              fontSize:'0.85rem', padding:'4px 6px', borderRadius:6, opacity:0.35,
              transition:'opacity 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.color='var(--red)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity='0.35'; e.currentTarget.style.color='var(--text3)'; }}
          ><Trash size={13} /></button>

          <span className="bloco-prog">{doneCount}/{realAulas.length}</span>
          <span className={"chevron" + (open ? ' open' : '')}>▼</span>
        </div>
      </div>

      {/* ── Aulas ── */}
      {open && (
        <div className="lesson-list">
          {bloco.foco && <div className="foco-strip">{bloco.foco}</div>}

          {bloco.aulas.map((aula, ai) => {
            // Posição real entre aulas não-NOTA
            const posReal = bloco.aulas.slice(0, ai + 1).filter(a => a.id !== 'NOTA').length;
            return aula.id === 'NOTA'
              ? <NotaRow key={ai} aula={aula}
                  onEdit={upd => handleEditAula(ai, upd)}
                  onDelete={() => handleDeleteAula(ai)} />
              : <AulaCard
                  key={courseKey + '-' + turmaKey + '-' + blocoIdx + '-' + aula.id}
                  courseKey={courseKey} turmaKey={turmaKey}
                  aula={aula} aulaIdx={ai} posicao={posReal} state={state}
                  onToggle={onToggle} onSave={onSave}
                  isDragging={dragState?.fromIdx === ai}
                  isOver={dragState?.overIdx === ai && dragState?.fromIdx !== ai}
                  onDragStart={iniciarDragAula}
                  onDrop={() => {}}
                  onEditAula={upd => handleEditAula(ai, upd)}
                  onDeleteAula={() => handleDeleteAula(ai)}
                />;
          })}

          {/* Botões add — SEMPRE visíveis */}
          <div style={{ display:'flex', gap:8, padding:'10px 16px', borderTop:'1px dashed rgba(255,255,255,0.06)' }}>
            <button onClick={handleAddAula} style={{
              background:'rgba(124,58,237,0.08)', border:'1px dashed rgba(124,58,237,0.3)',
              borderRadius:8, padding:'5px 16px', color:'var(--accent3)',
              fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            }}>+ Aula</button>
            <button onClick={handleAddNota} style={{
              background:'transparent', border:'1px dashed rgba(255,255,255,0.08)',
              borderRadius:8, padding:'5px 14px', color:'var(--text3)',
              fontSize:'0.78rem', cursor:'pointer', fontFamily:'inherit',
            }}>+ Nota</button>
          </div>
        </div>
      )}

      {confirmDel && (
        <ConfirmModal title="Remover bloco"
          message={`Remover "${name}" e todas as ${realAulas.length} aulas? Essa ação não pode ser desfeita.`}
          confirmLabel="Remover bloco"
          onConfirm={() => { setConfirmDel(false); onDeleteBloco(); }}
          onCancel={() => setConfirmDel(false)} />
      )}
    </div>
  );
}