// components/Bloco.jsx
import { useState, useRef } from 'react';
import { AulaDetail } from './AulaDetail.jsx';
import { aulaId } from '../store/storage.js';

function AulaCard({
  courseKey, turmaKey, aula, aulaIdx, state,
  onToggle, onSave, onDragStart, onDrop,
  editMode, onEditAula, onDeleteAula,
}) {
  const [open, setOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');

  if (aula.id === 'NOTA') {
    return (
      <div className="nota-row" style={{ display:'flex', alignItems:'center', gap:6 }}>
        {editMode ? (
          <input
            defaultValue={aula.titulo}
            onBlur={e => onEditAula({ ...aula, titulo: e.target.value })}
            style={{
              background:'transparent', border:'1px solid var(--border)',
              borderRadius:6, padding:'2px 8px', color:'var(--text2)',
              fontSize:'0.8rem', flex:1,
            }}
          />
        ) : aula.titulo}
        {editMode && (
          <button onClick={onDeleteAula} title="Remover nota" style={{
            background:'none', border:'none', cursor:'pointer',
            color:'var(--red)', fontSize:'0.85rem', lineHeight:1,
          }}>x</button>
        )}
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
    <div
      className={"aula" + (isDone ? ' done' : '')}
      draggable={!editMode}
      onDragStart={() => !editMode && onDragStart(aulaIdx)}
      onDragOver={e => e.preventDefault()}
      onDrop={() => !editMode && onDrop(aulaIdx)}
    >
      <div className="aula-row" onClick={() => !editMode && setOpen(o => !o)}>
        {!editMode && (
          <span className="drag-handle" onClick={e => e.stopPropagation()} title="Arrastar">...</span>
        )}
        <input
          type="checkbox"
          className="aula-check"
          checked={isDone}
          onClick={e => e.stopPropagation()}
          onChange={() => onToggle(id)}
        />
        <span className="aula-num">{numLabel}</span>

        <div className="aula-info" style={{ flex:1 }}>
          {editingTitle ? (
            <div style={{ display:'flex', flexDirection:'column', gap:4 }} onClick={e=>e.stopPropagation()}>
              <textarea
                autoFocus
                value={draftTitle}
                onChange={e => setDraftTitle(e.target.value)}
                onBlur={confirmEdit}
                onKeyDown={e => { if (e.key === 'Escape') setEditingTitle(false); }}
                placeholder={"Título da aula\nSubtítulo (opcional — segunda linha)"}
                rows={2}
                style={{
                  background:'var(--surface2)', border:'1px solid var(--accent)',
                  borderRadius:6, padding:'6px 8px', color:'var(--text)',
                  fontSize:'0.8125rem', width:'100%', resize:'none',
                  fontFamily:'inherit',
                }}
              />
              <div style={{ fontSize:'0.68rem', color:'var(--text3)' }}>
                Linha 1 = título · Linha 2 = subtítulo
              </div>
            </div>
          ) : (
            <>
              <div className="aula-name">{title}</div>
              {subLine && <div className="aula-meta">{subLine}</div>}
              {st.data_aula && <div className="aula-meta aula-date-tag">📅 {st.data_aula}</div>}
              {st.slide_url && (
                <a href={st.slide_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                  className="aula-meta aula-date-tag"
                  style={{ color:'var(--teal)', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:3 }}
                >🔗 Slide</a>
              )}
            </>
          )}
        </div>

        {editMode ? (
          <div style={{ display:'flex', gap:4, marginLeft:8 }} onClick={e=>e.stopPropagation()}>
            <button onClick={startEdit} title="Editar título" style={{
              background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:'0.85rem',
            }}>✏️</button>
            <button onClick={onDeleteAula} title="Remover aula" style={{
              background:'none', border:'none', cursor:'pointer', color:'var(--red)', fontSize:'0.85rem',
            }}>🗑</button>
          </div>
        ) : (
          <>
            <span className={"pill " + pillCls}>{pillLabel}</span>
            <span className={"chevron" + (open ? ' open' : '')}>▼</span>
          </>
        )}
      </div>

      {open && !editMode && (
        <AulaDetail aulaId={id} aula={aula} state={st} onSave={onSave} />
      )}
    </div>
  );
}

export function Bloco({ bloco, blocoIdx, courseKey, turmaKey, state, onToggle, onSave, onReorder,
  editMode, onUpdateBloco, onDeleteBloco }) {
  const [open, setOpen] = useState(true);
  const dragSrc = useRef(null);

  const [editingHeader, setEditingHeader] = useState(false);
  const [draftTag,  setDraftTag]  = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftSub,  setDraftSub]  = useState('');

  const lines = bloco.titulo.split('\n');
  const tag   = lines[0].split('·')[0].trim();
  const name  = (lines[1] || lines[0].split('·').slice(1).join('·')).trim();
  const sub   = (lines[2] || lines[0].split('·').slice(2).join('·')).trim();

  const realAulas = bloco.aulas.filter(a => a.id !== 'NOTA');
  const doneCount = realAulas.filter(a => {
    const id = aulaId(courseKey, turmaKey, a);
    return (state[id] || {}).done;
  }).length;

  const startEditHeader = (e) => {
    e.stopPropagation();
    setDraftTag(tag);
    setDraftName(name);
    setDraftSub(sub);
    setEditingHeader(true);
    setOpen(true);
  };

  const confirmHeader = () => {
    const newTitulo = draftSub.trim()
      ? (draftTag.trim() + ' . ' + draftName.trim() + '\n' + draftSub.trim())
      : (draftTag.trim() + ' . ' + draftName.trim());
    onUpdateBloco({ ...bloco, titulo: newTitulo });
    setEditingHeader(false);
  };

  const handleEditAula = (aulaIdx, updatedAula) => {
    const newAulas = bloco.aulas.map((a, i) => i === aulaIdx ? updatedAula : a);
    onUpdateBloco({ ...bloco, aulas: newAulas });
  };

  const handleDeleteAula = (aulaIdx) => {
    if (!confirm('Remover esta aula do bloco?')) return;
    const newAulas = bloco.aulas.filter((_, i) => i !== aulaIdx);
    onUpdateBloco({ ...bloco, aulas: newAulas });
  };

  const handleAddAula = () => {
    const nextNum = realAulas.length + 1;
    const numStr  = String(nextNum).padStart(2, '0');
    const newAula = {
      id:    'AULA ' + numStr,
      titulo: 'Nova Aula ' + numStr + '\nSubtítulo aqui',
    };
    onUpdateBloco({ ...bloco, aulas: [...bloco.aulas, newAula] });
  };

  const handleAddNota = () => {
    const newNota = { id: 'NOTA', titulo: 'Nota do bloco' };
    onUpdateBloco({ ...bloco, aulas: [...bloco.aulas, newNota] });
  };

  return (
    <div className="bloco">
      <div className={"bloco-head" + (open ? ' is-open' : '')}
        onClick={() => !editingHeader && setOpen(o => !o)}>
        <div className="bloco-left" style={{ flex:1 }}>
          {editingHeader ? (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }} onClick={e=>e.stopPropagation()}>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <input
                  autoFocus
                  value={draftTag}
                  onChange={e=>setDraftTag(e.target.value)}
                  placeholder="Bloco 01"
                  style={{
                    background:'var(--surface2)', border:'1px solid var(--accent)',
                    borderRadius:6, padding:'4px 8px', color:'var(--text)',
                    fontSize:'0.8rem', width:90,
                  }}
                />
                <input
                  value={draftName}
                  onChange={e=>setDraftName(e.target.value)}
                  placeholder="Nome do bloco"
                  style={{
                    background:'var(--surface2)', border:'1px solid var(--accent)',
                    borderRadius:6, padding:'4px 8px', color:'var(--text)',
                    fontSize:'0.8rem', flex:1, minWidth:140,
                  }}
                />
              </div>
              <input
                value={draftSub}
                onChange={e=>setDraftSub(e.target.value)}
                placeholder="Subtítulo (opcional)"
                style={{
                  background:'var(--surface2)', border:'1px solid var(--border)',
                  borderRadius:6, padding:'4px 8px', color:'var(--text2)',
                  fontSize:'0.75rem', width:'100%',
                }}
              />
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={confirmHeader} style={{
                  background:'var(--accent)', border:'none', borderRadius:6,
                  padding:'4px 12px', color:'white', fontSize:'0.75rem', cursor:'pointer', fontWeight:600,
                }}>OK</button>
                <button onClick={()=>setEditingHeader(false)} style={{
                  background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6,
                  padding:'4px 10px', color:'var(--text3)', fontSize:'0.75rem', cursor:'pointer',
                }}>Cancelar</button>
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

        <div className="bloco-right" style={{ display:'flex', alignItems:'center', gap:8 }}>
          {editMode && !editingHeader && (
            <div style={{ display:'flex', gap:4 }} onClick={e=>e.stopPropagation()}>
              <button onClick={startEditHeader} title="Editar título do bloco" style={{
                background:'none', border:'none', cursor:'pointer',
                color:'var(--text3)', fontSize:'0.8rem', padding:'2px 5px',
              }}>✏️</button>
              <button onClick={(e)=>{ e.stopPropagation(); onDeleteBloco(); }} title="Remover bloco" style={{
                background:'none', border:'none', cursor:'pointer',
                color:'var(--red)', fontSize:'0.8rem', padding:'2px 5px',
              }}>🗑</button>
            </div>
          )}
          {!editingHeader && (
            <>
              <span className="bloco-prog">{doneCount}/{realAulas.length}</span>
              <span className={"chevron" + (open ? ' open' : '')}>▼</span>
            </>
          )}
        </div>
      </div>

      {open && (
        <div className="lesson-list">
          {bloco.foco && <div className="foco-strip">{bloco.foco}</div>}
          {bloco.aulas.map((aula, ai) => (
            <AulaCard
              key={courseKey + '-' + turmaKey + '-' + blocoIdx + '-' + ai}
              courseKey={courseKey}
              turmaKey={turmaKey}
              aula={aula}
              aulaIdx={ai}
              state={state}
              onToggle={onToggle}
              onSave={onSave}
              onDragStart={i => { dragSrc.current = i; }}
              onDrop={toIdx => {
                if (dragSrc.current === null || dragSrc.current === toIdx) return;
                onReorder(blocoIdx, dragSrc.current, toIdx);
                dragSrc.current = null;
              }}
              editMode={editMode}
              onEditAula={updated => handleEditAula(ai, updated)}
              onDeleteAula={() => handleDeleteAula(ai)}
            />
          ))}

          {editMode && (
            <div style={{ display:'flex', gap:8, padding:'10px 12px', borderTop:'1px dashed var(--border)' }}>
              <button onClick={handleAddAula} style={{
                background:'rgba(124,58,237,0.1)', border:'1px dashed rgba(124,58,237,0.4)',
                borderRadius:8, padding:'6px 14px', color:'var(--accent3)',
                fontSize:'0.78rem', fontWeight:600, cursor:'pointer',
              }}>+ Aula</button>
              <button onClick={handleAddNota} style={{
                background:'rgba(255,255,255,0.04)', border:'1px dashed var(--border)',
                borderRadius:8, padding:'6px 14px', color:'var(--text3)',
                fontSize:'0.78rem', cursor:'pointer',
              }}>+ Nota</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}