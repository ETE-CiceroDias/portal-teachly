// components/AulaDetail.jsx
import { useState } from 'react';

export function AulaDetail({ aulaId, aula, state, onSave }) {
  const [activeTab, setActiveTab] = useState('plano');
  const [saved, setSaved]         = useState(false);
  const [newProb, setNewProb]     = useState('');

  const [form, setForm] = useState({
    teoria:    state.teoria    ?? aula.teoria    ?? '',
    pratica:   state.pratica   ?? aula.pratica   ?? '',
    codealong: state.codealong ?? aula.codealong ?? '',
    recurso:   state.recurso   ?? aula.recurso   ?? '',
    conexao:   state.conexao   ?? aula.conexao   ?? '',
    obs:       state.obs       ?? aula.obs       ?? '',
    plano_b:   state.plano_b   ?? aula.plano_b   ?? '',
    nota_prof: state.nota_prof ?? '',
    data_aula: state.data_aula ?? '',
    slide_url: state.slide_url ?? '',
    problems:  [...(state.problems || [])],
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addProb = () => {
    const t = newProb.trim();
    if (!t) return;
    set('problems', [...form.problems, t]);
    setNewProb('');
  };

  const rmProb = i => set('problems', form.problems.filter((_, j) => j !== i));

  const save = () => {
    onSave(aulaId, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const planFields = [
    { key: 'teoria',    label: '📖 Teoria / Slide-aula',     val: aula.teoria    || form.teoria },
    { key: 'pratica',   label: '✏️ Prática / Dinâmica',       val: aula.pratica   || form.pratica },
    { key: 'codealong', label: '💻 Code-along',               val: aula.codealong || form.codealong },
    { key: 'recurso',   label: '🎬 Recursos',                 val: aula.recurso   || form.recurso },
    { key: 'conexao',   label: '🔗 Conexão interdisciplinar', val: aula.conexao   || form.conexao },
    { key: 'obs',       label: '📌 Observações',              val: aula.obs       || form.obs },
    { key: 'plano_b',   label: '🔄 Plano B',                  val: aula.plano_b   || form.plano_b },
  ].filter(f => f.val);

  const TABS = [
    { id: 'plano',  label: 'Plano de Aula' },
    { id: 'notas',  label: 'Minhas notas' },
    { id: 'probs',  label: `Problemas${form.problems.length > 0 ? ` (${form.problems.length})` : ''}` },
  ];

  return (
    <div className="aula-detail anim-down">
      <div className="detail-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`dtab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Plano */}
      <div className={`detail-panel${activeTab === 'plano' ? ' active' : ''}`}>
        {planFields.length > 0 ? (
          <div className="detail-grid">
            {planFields.map(f => (
              <div key={f.key} className="field">
                <div className="field-label">{f.label}</div>
                <textarea
                  className="field-textarea"
                  value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  rows={4}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text3)', fontSize: '0.875rem', padding: '8px 0' }}>
            Sem conteúdo de plano para esta aula.
          </div>
        )}
      </div>

      {/* Notas */}
      <div className={`detail-panel${activeTab === 'notas' ? ' active' : ''}`}>
        <div className="detail-grid">
          <div className="field">
            <div className="field-label">📝 Minha anotação</div>
            <textarea
              className="field-textarea"
              value={form.nota_prof}
              onChange={e => set('nota_prof', e.target.value)}
              rows={5}
              placeholder="Como foi a aula, o que ficou pendente, o que funcionou bem..."
            />
          </div>
          <div className="field">
            <div className="field-label">📅 Data da aula</div>
            <input
              type="date"
              className="field-input"
              value={form.data_aula}
              onChange={e => set('data_aula', e.target.value)}
            />
          </div>
          <div className="field">
            <div className="field-label">🔗 Link do slide / material da aula</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="url"
                className="field-input"
                placeholder="https://docs.google.com/presentation/..."
                value={form.slide_url}
                onChange={e => set('slide_url', e.target.value)}
              />
              {form.slide_url && (
                <a href={form.slide_url} target="_blank" rel="noreferrer"
                  style={{ color: 'var(--accent-light)', fontSize: '0.8rem', whiteSpace: 'nowrap', textDecoration: 'none' }}
                >↗ Abrir</a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Problemas */}
      <div className={`detail-panel${activeTab === 'probs' ? ' active' : ''}`}>
        {form.problems.length > 0 && (
          <div className="prob-tags" style={{ marginBottom: 12 }}>
            {form.problems.map((p, i) => (
              <div key={i} className="ptag">
                {p}
                <button className="rm" onClick={() => rmProb(i)}>×</button>
              </div>
            ))}
          </div>
        )}
        {form.problems.length === 0 && (
          <div style={{ color: 'var(--text3)', fontSize: '0.8125rem', marginBottom: 12 }}>
            Nenhum problema registrado ainda.
          </div>
        )}
        <div className="add-prob-row">
          <input
            className="add-prob-input"
            placeholder="Descreva o problema e pressione Enter..."
            value={newProb}
            onChange={e => setNewProb(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addProb()}
          />
          <button className="add-prob-btn" onClick={addProb}>+ Add</button>
        </div>
      </div>

      <div className="detail-footer">
        <button className="save-btn" onClick={save}>Salvar</button>
        {saved && <span className="save-ok anim-fade">✓ Salvo!</span>}
      </div>
    </div>
  );
}
