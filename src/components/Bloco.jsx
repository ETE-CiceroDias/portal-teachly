// components/Bloco.jsx — v3: add/delete sempre visível, edit mode só para renomear
import { useState, useRef } from 'react';
import { AulaDetail } from './AulaDetail.jsx';
import { ConfirmModal } from './ConfirmModal.jsx';
import { aulaId } from '../store/storage.js';

// ── Card de aula ──────────────────────────────────────────────
function AulaCard({
  courseKey, turmaKey, aula, aulaIdx, state,
  onToggle, onSave, onDragStart, onDrop,
  onDeleteAula, onEditAula,
}) {
  const [open, setOpen]           = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle]     = useState('');

  if (aula.id === 'NOTA') {
    return (
      <div className="nota-row" style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ flex:1 }}>{aula.titulo}</span>
        <button onClick={() => setConfirmDel(true)} style={{
          background:'none', border:'none', cursor:'pointer',
          color:'var(--text3)', fontSize:'0.8rem', opacity:0.5, lineHeight:1,
          padding:'2px 4px', borderRadius:4,
        }} title="Remover nota">×</button>
        {confirmDel && <ConfirmModal title="Remover nota" message={`Remover "${aula.titulo}"?`} confirmLabel="Remover"
          onConfirm={() => { setConfirmDel(false); onDeleteAula(); }}
          onCancel={() => setConfirmDel(false)} />}
      </div>
    );
  }

  const id      = aulaId(courseKey, turmaKey, aula);
  const st      = state[id] || {};
  const isDone  = !!st.done;
  const hasProb = (st.problems || []).length > 0;

  const numLabel = aula.id.replace('AULA\n ', '').replace('AULA ', '').replace('NOTA', '').trim();
  const lines    = aula.titulo.split('\n');
  const title    = lines[0];
  const subLine  = lines.slice(1).join(' ').trim();

  const pillCls   = hasProb ? 'pill-problem' : isDone ? 'pill-done' : aula.isEval ? 'pill-eval' : 'pill-pend';
  const pillLabel = hasProb ? 'Problema'     : isDone ? 'Feita'     : aula.isEval ? 'Avaliação' : 'Pendente';

  const startEdit = (e) => {
    e.stopPropagation();
    setDraftTitle(aula.titulo);
    setEditingTitle(true);
  };
  const confirmEdit = () => {
    if (draftTitle.trim()) onEditAula({ ...aula, titulo: draftTitle });
    setEditingTitle(false);
  };

  return (
    <div className={"aula" + (isDone ? ' done' : '')}
      draggable onDragStart={() => onDragStart(aulaIdx)}
      onDragOver={e => e.preventDefault()} onDrop={() => onDrop(aulaIdx)}>

      <div className="aula-row" onClick={() => !editingTitle && setOpen(o => !o)}>
        <span className="drag-handle" onClick={e => e.stopPropagation()} title="Arrastar">⠿</span>
        <input type="checkbox" className="aula-check" checked={isDone}
          onClick={e => e.stopPropagation()} onChange={() => onToggle(id)} />
        <span className="aula-num">{numLabel}</span>

        <div className="aula-info" style={{ flex:1 }}>
          {editingTitle ? (
            <div onClick={e => e.stopPropagation()}>
              <textarea autoFocus value={draftTitle} onChange={e => setDraftTitle(e.target.value)}
                onBlur={confirmEdit}
                onKeyDown={e => { if (e.key === 'Escape') setEditingTitle(false); }}
                rows={2}
                style={{
                  background:'var(--surface2)', border:'1px solid var(--accent)',
                  borderRadius:6, padding:'6px 8px', color:'var(--text)',
                  fontSize:'0.8125rem', width:'100%', resize:'none', fontFamily:'inherit',
                }}
              />
              <div style={{ fontSize:'0.68rem', color:'var(--text3)', marginTop:2 }}>Linha 1 = título · Linha 2 = subtítulo</div>
            </div>
          ) : (
            <>
              <div className="aula-name">{title}</div>
              {subLine && <div className="aula-meta">{subLine}</div>}
              {st.data_aula && (
                <div className="aula-meta aula-date-tag">
                  📅 {st.data_aula}
                  {st.data_aula_fim && st.data_aula_fim !== st.data_aula && <> → {st.data_aula_fim}</>}
                </div>
              )}
              {st.slide_url && (
                <a href={st.slide_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                  className="aula-meta aula-date-tag"
                  style={{ color:'var(--teal)', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:3 }}>
                  🔗 Slide
                </a>
              )}
            </>
          )}
        </div>

        {/* Ações — sempre visíveis no hover, discretas */}
        <div className="aula-actions" onClick={e => e.stopPropagation()}>
          {!editingTitle && (
            <button onClick={startEdit} className="aula-action-btn" title="Editar título">✏️</button>
          )}
          <button onClick={() => setConfirmDel(true)} className="aula-action-btn aula-action-del" title="Remover aula">🗑</button>
        </div>

        <span className={"pill " + pillCls}>{pillLabel}</span>
        <span className={"chevron" + (open ? ' open' : '')}>▼</span>
      </div>

      {open && <AulaDetail aulaId={id} aula={aula} state={st} onSave={onSave} />}

      {confirmDel && (
        <ConfirmModal title="Remover aula"
          message={`Remover "${title}"? Esta ação não pode ser desfeita.`}
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
  editMode, onUpdateBloco, onDeleteBloco }) {

  const [open, setOpen]           = useState(true);
  const [confirmDel, setConfirmDel] = useState(false);
  const [editingHeader, setEditingHeader] = useState(false);
  const [draftTag,  setDraftTag]  = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftSub,  setDraftSub]  = useState('');
  const dragSrc = useRef(null);

  const lines = bloco.titulo.split('\n');
  const rawFirst = lines[0];
  const dotIdx = rawFirst.indexOf('·');
  const dotIdx2 = rawFirst.indexOf('.');
  const sep = dotIdx >= 0 ? dotIdx : dotIdx2 >= 0 ? dotIdx2 : -1;
  const tag  = sep >= 0 ? rawFirst.slice(0, sep).trim() : rawFirst.trim();
  const name = sep >= 0 ? rawFirst.slice(sep + 1).trim() : (lines[1] || '').trim();
  const sub  = lines[2] || (sep >= 0 ? '' : (lines[1] || '')).trim();

  const realAulas = bloco.aulas.filter(a => a.id !== 'NOTA');
  const doneCount = realAulas.filter(a => (state[aulaId(courseKey, turmaKey, a)] || {}).done).length;

  const startEditHeader = (e) => {
    e.stopPropagation();
    setDraftTag(tag); setDraftName(name); setDraftSub(sub);
    setEditingHeader(true); setOpen(true);
  };
  const confirmHeader = () => {
    const newTitulo = draftSub.trim()
      ? `${draftTag.trim()} · ${draftName.trim()}\n${draftSub.trim()}`
      : `${draftTag.trim()} · ${draftName.trim()}`;
    onUpdateBloco({ ...bloco, titulo: newTitulo });
    setEditingHeader(false);
  };

  const handleEditAula   = (ai, upd) => onUpdateBloco({ ...bloco, aulas: bloco.aulas.map((a,i) => i===ai ? upd : a) });
  const handleDeleteAula = (ai) => onUpdateBloco({ ...bloco, aulas: bloco.aulas.filter((_,i) => i!==ai) });

  const handleAddAula = () => {
    const n = realAulas.length + 1;
    const num = String(n).padStart(2,'0');
    onUpdateBloco({ ...bloco, aulas: [...bloco.aulas, { id:`AULA ${num}`, titulo:`Aula ${num}\nSubtítulo` }] });
  };
  const handleAddNota = () => {
    onUpdateBloco({ ...bloco, aulas: [...bloco.aulas, { id:'NOTA', titulo:'📌 Nota' }] });
  };

  return (
    <div className="bloco">
      <div className={"bloco-head" + (open ? ' is-open' : '')}
        onClick={() => !editingHeader && setOpen(o => !o)}>

        <div className="bloco-left" style={{ flex:1 }}>
          {editingHeader ? (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }} onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <input autoFocus value={draftTag} onChange={e=>setDraftTag(e.target.value)} placeholder="Bloco 01"
                  style={{ background:'var(--surface2)', border:'1px solid var(--accent)', borderRadius:6, padding:'4px 8px', color:'var(--text)', fontSize:'0.8rem', width:90 }} />
                <input value={draftName} onChange={e=>setDraftName(e.target.value)} placeholder="Nome do bloco"
                  style={{ background:'var(--surface2)', border:'1px solid var(--accent)', borderRadius:6, padding:'4px 8px', color:'var(--text)', fontSize:'0.8rem', flex:1, minWidth:140 }} />
              </div>
              <input value={draftSub} onChange={e=>setDraftSub(e.target.value)} placeholder="Subtítulo (opcional)"
                style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 8px', color:'var(--text2)', fontSize:'0.75rem', width:'100%' }} />
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={confirmHeader}
                  style={{ background:'var(--accent)', border:'none', borderRadius:6, padding:'4px 12px', color:'white', fontSize:'0.75rem', cursor:'pointer', fontWeight:600 }}>OK</button>
                <button onClick={() => setEditingHeader(false)}
                  style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 10px', color:'var(--text3)', fontSize:'0.75rem', cursor:'pointer' }}>Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <span className="bloco-tag">{tag}</span>
              <div>
                <div className="bloco-name">{name}</div>
                {sub && <div className="bloco-sub">{sub}</div>}
              </div>
            </>
          )}
        </div>

        <div className="bloco-right" style={{ display:'flex', alignItems:'center', gap:6 }}>
          {/* Ações do bloco — sempre visíveis */}
          {!editingHeader && (
            <div className="bloco-actions" onClick={e => e.stopPropagation()}>
              <button onClick={startEditHeader} className="aula-action-btn" title="Renomear bloco">✏️</button>
              <button onClick={() => setConfirmDel(true)} className="aula-action-btn aula-action-del" title="Remover bloco">🗑</button>
            </div>
          )}
          <span className="bloco-prog">{doneCount}/{realAulas.length}</span>
          <span className={"chevron" + (open ? ' open' : '')}>▼</span>
        </div>
      </div>

      {open && (
        <div className="lesson-list">
          {bloco.foco && <div className="foco-strip">{bloco.foco}</div>}
          {bloco.aulas.map((aula, ai) => (
            <AulaCard
              key={courseKey + '-' + turmaKey + '-' + blocoIdx + '-' + ai}
              courseKey={courseKey} turmaKey={turmaKey}
              aula={aula} aulaIdx={ai} state={state}
              onToggle={onToggle} onSave={onSave}
              onDragStart={i => { dragSrc.current = i; }}
              onDrop={toIdx => {
                if (dragSrc.current === null || dragSrc.current === toIdx) return;
                onReorder(blocoIdx, dragSrc.current, toIdx);
                dragSrc.current = null;
              }}
              onEditAula={upd => handleEditAula(ai, upd)}
              onDeleteAula={() => handleDeleteAula(ai)}
            />
          ))}

          {/* Add buttons — SEMPRE visíveis */}
          <div style={{ display:'flex', gap:8, padding:'10px 14px', borderTop:'1px dashed var(--border)' }}>
            <button onClick={handleAddAula} style={{
              background:'rgba(124,58,237,0.08)', border:'1px dashed rgba(124,58,237,0.35)',
              borderRadius:8, padding:'5px 14px', color:'var(--accent3)',
              fontSize:'0.78rem', fontWeight:600, cursor:'pointer',
            }}>+ Aula</button>
            <button onClick={handleAddNota} style={{
              background:'rgba(255,255,255,0.03)', border:'1px dashed var(--border)',
              borderRadius:8, padding:'5px 14px', color:'var(--text3)',
              fontSize:'0.78rem', cursor:'pointer',
            }}>+ Nota</button>
          </div>
        </div>
      )}

      {confirmDel && (
        <ConfirmModal title="Remover bloco"
          message={`Remover "${name}" e todas as ${realAulas.length} aulas?`}
          confirmLabel="Remover bloco"
          onConfirm={() => { setConfirmDel(false); onDeleteBloco(); }}
          onCancel={() => setConfirmDel(false)} />
      )}
    </div>
  );
}