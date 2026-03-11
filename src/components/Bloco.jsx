// components/Bloco.jsx
import { useState, useRef } from 'react';
import { AulaDetail } from './AulaDetail.jsx';
import { aulaId } from '../store/storage.js';

function AulaCard({ courseKey, turmaKey, aula, aulaIdx, state, onToggle, onSave, onDragStart, onDrop }) {
  const [open, setOpen] = useState(false);

  if (aula.id === 'NOTA') {
    return <div className="nota-row">{aula.titulo}</div>;
  }

  const id    = aulaId(courseKey, turmaKey, aula);
  const st    = state[id] || {};
  const isDone  = !!st.done;
  const hasProb = (st.problems || []).length > 0;

  const numLabel = aula.id.replace('AULA\n ', '').replace('AULA ', '').replace('NOTA', '').trim();
  const lines    = aula.titulo.split('\n');
  const title    = lines[0];
  const subLine  = lines.slice(1).join(' ').trim();

  const pillCls   = hasProb ? 'pill-problem' : isDone ? 'pill-done' : aula.isEval ? 'pill-eval' : 'pill-pend';
  const pillLabel = hasProb ? 'Problema'     : isDone ? 'Feita'     : aula.isEval ? 'Avaliação' : 'Pendente';

  return (
    <div
      className={`aula${isDone ? ' done' : ''}`}
      draggable
      onDragStart={() => onDragStart(aulaIdx)}
      onDragOver={e => e.preventDefault()}
      onDrop={() => onDrop(aulaIdx)}
    >
      <div className="aula-row" onClick={() => setOpen(o => !o)}>
        <span className="drag-handle" onClick={e => e.stopPropagation()} title="Arrastar">⠿</span>
        <input
          type="checkbox"
          className="aula-check"
          checked={isDone}
          onClick={e => e.stopPropagation()}
          onChange={() => onToggle(id)}
        />
        <span className="aula-num">{numLabel}</span>
        <div className="aula-info">
          <div className="aula-name">{title}</div>
          {subLine && <div className="aula-meta">{subLine}</div>}
          {st.data_aula && <div className="aula-meta aula-date-tag">📅 {st.data_aula}</div>}
          {st.slide_url && (
            <a href={st.slide_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
              className="aula-meta aula-date-tag"
              style={{ color: 'var(--teal)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}
            >🔗 Slide</a>
          )}
        </div>
        <span className={`pill ${pillCls}`}>{pillLabel}</span>
        <span className={`chevron${open ? ' open' : ''}`}>▼</span>
      </div>

      {open && (
        <AulaDetail aulaId={id} aula={aula} state={st} onSave={onSave} />
      )}
    </div>
  );
}

export function Bloco({ bloco, blocoIdx, courseKey, turmaKey, state, onToggle, onSave, onReorder }) {
  const [open, setOpen] = useState(true);
  const dragSrc = useRef(null);

  const lines     = bloco.titulo.split('\n');
  const tag       = lines[0].split('·')[0].trim();
  const name      = (lines[1] || lines[0].split('·').slice(1).join('·')).trim();
  const sub       = (lines[2] || lines[0].split('·').slice(2).join('·')).trim();
  const realAulas = bloco.aulas.filter(a => a.id !== 'NOTA');
  const doneCount = realAulas.filter(a => {
    const id = aulaId(courseKey, turmaKey, a);
    return (state[id] || {}).done;
  }).length;

  return (
    <div className="bloco">
      <div className={`bloco-head${open ? ' is-open' : ''}`} onClick={() => setOpen(o => !o)}>
        <div className="bloco-left">
          <span className="bloco-tag">{tag}</span>
          <div>
            <div className="bloco-name">{name}</div>
            {sub && <div className="bloco-sub">{sub}</div>}
          </div>
        </div>
        <div className="bloco-right">
          <span className="bloco-prog">{doneCount}/{realAulas.length}</span>
          <span className={`chevron${open ? ' open' : ''}`}>▼</span>
        </div>
      </div>

      {open && (
        <div className="lesson-list">
          {bloco.foco && <div className="foco-strip">{bloco.foco}</div>}
          {bloco.aulas.map((aula, ai) => (
            <AulaCard
              key={`${courseKey}-${turmaKey}-${blocoIdx}-${ai}`}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
