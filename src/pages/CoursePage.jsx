// pages/CoursePage.jsx — conteúdo editável via Supabase
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { useOrg } from '../store/OrgContext.jsx';
import { COURSES } from '../data/courses.js';
import { TURMAS } from '../data/turmas.js';
import { Bloco } from '../components/Bloco.jsx';
import { courseStats, getOrderedBlocos } from '../store/storage.js';

// ── cores padrão por disciplina ──────────────────────────────
const DISC_CORES = {
  dcu:   '#7c3aed', dt: '#c084fc', pi: '#e879f9',
  prog:  '#60a5fa', dim: '#fbbf24', prog3: '#4ade80',
};

// ── Editor inline (textarea auto-resize) ─────────────────────
function EditableText({ value, onChange, placeholder, multiline, className, style }) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current && multiline) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value, multiline]);

  if (multiline) {
    return (
      <textarea
        ref={ref}
        className={className}
        style={{ resize:'none', overflow:'hidden', ...style }}
        value={value || ''}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      ref={ref}
      className={className}
      style={style}
      value={value || ''}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
    />
  );
}

// ── Modal genérico ────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}

// ── Banner upload ─────────────────────────────────────────────
function BannerSection({ discKey, banner_url, banner_cor, editMode, onChange }) {
  const cor = banner_cor || DISC_CORES[discKey] || '#7c3aed';
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');

  const handleFile = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadErr('');

    // Garante tamanho razoável (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setUploadErr('Imagem muito grande (máx 3MB)');
      setUploading(false);
      return;
    }

    const ext      = file.name.split('.').pop();
    const path     = `banners/${discKey}_${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('disciplinas')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      // Fallback: salva como base64 se storage não existir/erro de permissão
      const reader = new FileReader();
      reader.onload = ev => { onChange({ banner_url: ev.target.result }); setUploading(false); };
      reader.readAsDataURL(file);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('disciplinas')
      .getPublicUrl(path);

    onChange({ banner_url: publicUrl });
    setUploading(false);
  };

  return (
    <div style={{
      width: '100%', height: 270, borderRadius: 16, marginBottom: 24,
      background: banner_url ? `url(${banner_url}) center/cover` : `linear-gradient(135deg, ${cor}33, ${cor}11)`,
      border: `1px solid ${cor}44`,
      display: 'flex', alignItems: 'flex-end',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* overlay gradiente */}
      <div style={{
        position:'absolute', inset:0,
        background: 'linear-gradient(to top, rgba(10,4,20,0.7) 0%, transparent 60%)',
      }} />

      {editMode && (
        <div style={{ position:'absolute', top:12, right:12, display:'flex', gap:8, zIndex:2, flexDirection:'column', alignItems:'flex-end' }}>
          {uploadErr && (
            <div style={{ background:'rgba(220,38,38,0.8)', borderRadius:6, padding:'4px 10px', fontSize:'0.72rem', color:'white' }}>{uploadErr}</div>
          )}
          <div style={{ display:'flex', gap:8 }}>
          <label style={{
            background: uploading ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)',
            border:'1px solid rgba(255,255,255,0.2)',
            borderRadius:8, padding:'6px 12px', cursor: uploading ? 'default' : 'pointer',
            fontSize:'0.78rem', color:'white', backdropFilter:'blur(4px)',
          }}>
            {uploading ? '⏳ Enviando…' : '📷 Trocar banner'}
            <input type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} disabled={uploading} />
          </label>
          {banner_url && !uploading && (
            <button onClick={() => onChange({ banner_url: '' })} style={{
              background:'rgba(220,38,38,0.7)', border:'none', borderRadius:8,
              padding:'6px 10px', cursor:'pointer', fontSize:'0.78rem', color:'white',
            }}>✕</button>
          )}
          <div style={{ display:'flex', gap:4 }}>
            {['#7c3aed','#c084fc','#e879f9','#60a5fa','#fbbf24','#4ade80','#f87171','#fb923c'].map(c => (
              <div key={c} onClick={() => onChange({ banner_cor: c })} style={{
                width:20, height:20, borderRadius:'50%', background:c, cursor:'pointer',
                border: cor === c ? '2px solid white' : '2px solid transparent',
              }} />
            ))}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mini Projetos ─────────────────────────────────────────────
function MiniProjetos({ discKey, projetos, editMode, onAdd, onEdit, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editIdx,  setEditIdx]  = useState(null);
  const [form, setForm] = useState({ num:'', nome:'', descricao:'', link:'' });
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const openAdd = () => { setForm({ num: String(projetos.length+1).padStart(2,'0'), nome:'', descricao:'', link:'' }); setEditIdx(null); setShowForm(true); };
  const openEdit = (i) => { setForm({ ...projetos[i] }); setEditIdx(i); setShowForm(true); };
  const submit = () => { editIdx !== null ? onEdit(editIdx, form) : onAdd(form); setShowForm(false); };

  if (!projetos.length && !editMode) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontSize:'0.78rem', color:'var(--text3)', fontWeight:700, letterSpacing:2, textTransform:'uppercase' }}>
          🛠 Mini-Projetos
        </div>
        {editMode && (
          <button onClick={openAdd} style={{
            background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.3)',
            borderRadius:8, padding:'4px 12px', color:'var(--accent3)',
            fontSize:'0.78rem', fontWeight:600, cursor:'pointer',
          }}>+ Novo</button>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(190px,1fr))', gap:8 }}>
        {projetos.map((mp, i) => (
          <div key={mp.id || i} style={{
            background:'var(--surface2)', border:'1px solid var(--border)',
            borderRadius:10, padding:'12px 14px', position:'relative',
          }}>
            {editMode && (
              <div style={{ position:'absolute', top:8, right:8, display:'flex', gap:4 }}>
                <button onClick={() => openEdit(i)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.8rem', color:'var(--text3)' }}>✏️</button>
                <button onClick={() => onDelete(i)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.8rem', color:'var(--red)' }}>🗑</button>
              </div>
            )}
            <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--accent3)', marginBottom:4 }}>#{mp.num} {mp.nome}</div>
            {mp.descricao && <div style={{ fontSize:'0.78rem', color:'var(--text3)', lineHeight:1.5 }}>{mp.descricao}</div>}
            {mp.link && <a href={mp.link} target="_blank" rel="noopener" style={{ fontSize:'0.72rem', color:'var(--accent3)', marginTop:4, display:'block' }}>🔗 Ver</a>}
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title={editIdx !== null ? 'Editar mini-projeto' : 'Novo mini-projeto'} onClose={() => setShowForm(false)}>
          <div className="modal-field"><div className="modal-label">Número</div>
            <input className="modal-input" value={form.num} onChange={f('num')} placeholder="01" /></div>
          <div className="modal-field"><div className="modal-label">Nome *</div>
            <input className="modal-input" value={form.nome} onChange={f('nome')} placeholder="ex: Layout de Blog" autoFocus /></div>
          <div className="modal-field"><div className="modal-label">Descrição</div>
            <textarea className="modal-input" value={form.descricao} onChange={f('descricao')} placeholder="Descreva o projeto..." rows={3} style={{ resize:'vertical' }} /></div>
          <div className="modal-field"><div className="modal-label">Link (opcional)</div>
            <input className="modal-input" value={form.link} onChange={f('link')} placeholder="https://..." /></div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="btn-primary" onClick={submit}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export function CoursePage({ courseKey, discId, discBlocos, discLabel, discCode, activeTurma, state, onToggle, onSave, onReorder }) {
  // Usa discId (UUID) como chave única no banco — evita conflito entre disciplinas com mesmo courseKey
  const dbKey = discId || courseKey;
  const { turmas } = useOrg();
  // Usa COURSES local se existir; senão monta um course sintético com os blocos do banco
  const courseLocal = COURSES[courseKey];
  const course = courseLocal || (discBlocos?.length ? {
    key: courseKey,
    label: discLabel || courseKey,
    code: discCode || '',
    fullname: discLabel || courseKey,
    info: '',
    avaliacao: '',
    apresentacao: '',
    competencias: '',
    miniProjetos: [],
    blocos: discBlocos,
  } : null);
  // Busca turma pelo key ou id no OrgContext
  const turma = turmas.find(t => t.key === activeTurma || t.id === activeTurma);

  if (!course) return (
    <div className="anim-up">
      <div className="page-header">
        <div className="page-title">Disciplina</div>
      </div>
      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'56px 24px', textAlign:'center',
        background:'var(--surface)', border:'1px dashed var(--border)', borderRadius:16, gap:14,
      }}>
        <div style={{ fontSize:'2.4rem', opacity:0.45 }}>📂</div>
        <div style={{ fontWeight:700, color:'var(--text)', fontSize:'0.9375rem' }}>
          Conteúdo ainda não cadastrado
        </div>
        <div style={{ color:'var(--text3)', fontSize:'0.85rem', maxWidth:340, lineHeight:1.6 }}>
          Esta disciplina ainda não tem aulas ou blocos de conteúdo vinculados.<br/>
          O conteúdo é adicionado pelo painel de administração ou diretamente no código.
        </div>
      </div>
    </div>
  );

  const [editMode,  setEditMode]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [savedOk,   setSavedOk]   = useState(false);
  // Blocos editáveis (cópia local para edição estrutural)
  const [blocosEdit, setBlocosEdit] = useState(null);

  // conteúdo editável vindo do banco
  const [conteudo, setConteudo] = useState({
    banner_url:   '',
    banner_cor:   DISC_CORES[courseKey] || '#7c3aed',
    nome:         discLabel || course.fullname || '',
    info:         '',
    avaliacao:    course.avaliacao    || '',
    apresentacao: course.apresentacao || '',
    competencias: course.competencias || '',
  });
  const [projetos, setProjetos] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const set = (k, v) => setConteudo(c => ({ ...c, [k]: v }));

  // ── Load do banco ──────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from('disciplinas_conteudo').select('*').eq('disc_key', dbKey).maybeSingle(),
        supabase.from('mini_projetos').select('*').eq('disc_key', dbKey).order('num'),
      ]);
      setConteudo({
        banner_url:   c?.banner_url   || '',
        banner_cor:   c?.banner_cor   || DISC_CORES[courseKey] || '#7c3aed',
        nome:         c?.nome         || discLabel || course.fullname || '',
        info:         c?.info         || '',
        avaliacao:    c?.avaliacao    || course.avaliacao    || '',
        apresentacao: c?.apresentacao || course.apresentacao || '',
        competencias: c?.competencias || course.competencias || '',
      });
      // Mescla miniProjetos do courses.js com os do banco (banco tem prioridade)
      const base = (course.miniProjetos || []).map(mp => ({ ...mp, fonte: 'local' }));
      const banco = (p || []).map(mp => ({ ...mp, fonte: 'banco' }));
      setProjetos(banco.length > 0 ? banco : base);
      setLoading(false);
    }
    load();
  }, [courseKey]);

  // ── Salvar ─────────────────────────────────────────────────
  const salvar = async () => {
    setSaving(true);
    await supabase.from('disciplinas_conteudo').upsert({
      disc_key:     dbKey,
      banner_url:   conteudo.banner_url,
      banner_cor:   conteudo.banner_cor,
      nome:         conteudo.nome,
      info:         conteudo.info,
      avaliacao:    conteudo.avaliacao,
      apresentacao: conteudo.apresentacao,
      competencias: conteudo.competencias,
      atualizado_em: new Date().toISOString(),
    });
    // Salva estrutura de blocos editados no banco (coluna blocos da disciplina)
    if (blocosEdit !== null && discId) {
      await supabase.from('disciplinas').update({ blocos: blocosEdit }).eq('id', discId);
    }
    setSaving(false);
    setSavedOk(true);
    setEditMode(false);
    setBlocosEdit(null);
    setTimeout(() => setSavedOk(false), 2000);
  };

  // ── Novo bloco ─────────────────────────────────────────────
  const handleAddBloco = () => {
    const currentBlocos = blocosEdit ?? blocosFonte;
    const num = String(currentBlocos.length + 1).padStart(2, '0');
    const newBloco = {
      titulo: 'Bloco ' + num + ' . Novo Bloco',
      aulas: [{ id: 'AULA 01', titulo: 'Aula 01\nSubtítulo' }],
    };
    setBlocosEdit([...currentBlocos, newBloco]);
  };

  const handleUpdateBloco = (idx, updated) => {
    const currentBlocos = blocosEdit ?? blocosFonte;
    setBlocosEdit(currentBlocos.map((b, i) => i === idx ? updated : b));
  };

  const handleDeleteBloco = (idx) => {
    // Chamado pelo Bloco após confirmação no próprio modal
    const currentBlocos = blocosEdit ?? blocosFonte;
    setBlocosEdit(currentBlocos.filter((_, i) => i !== idx));
  };

  // ── Mini projetos CRUD ─────────────────────────────────────
  const addProjeto = async (form) => {
    const { data } = await supabase.from('mini_projetos')
      .insert({ disc_key: dbKey, ...form }).select().single();
    setProjetos(p => [...p.filter(x => x.fonte !== 'local'), ...(data ? [data] : [])]);
  };

  const editProjeto = async (idx, form) => {
    const proj = projetos[idx];
    if (proj.fonte === 'banco' && proj.id) {
      const { data } = await supabase.from('mini_projetos').update(form).eq('id', proj.id).select().single();
      setProjetos(p => p.map((x, i) => i === idx ? data : x));
    } else {
      // era local, agora vai pro banco
      const { data } = await supabase.from('mini_projetos')
        .insert({ disc_key: dbKey, ...form }).select().single();
      setProjetos(p => p.map((x, i) => i === idx ? data : x));
    }
  };

  const deleteProjeto = async (idx) => {
    if (!confirm('Excluir este mini-projeto?')) return;
    const proj = projetos[idx];
    if (proj.fonte === 'banco' && proj.id) {
      await supabase.from('mini_projetos').delete().eq('id', proj.id);
    }
    setProjetos(p => p.filter((_, i) => i !== idx));
  };

  // Prioridade: blocosEdit (edição em curso) > blocos do banco > blocos do COURSES local
  const blocosFonte = discBlocos?.length ? discBlocos : (course?.blocos || []);
  const blocosAtivos = blocosEdit ?? blocosFonte;
  const courseComBlocos = { ...course, blocos: blocosAtivos };
  const allCoursesComBlocos = { ...COURSES, [courseKey]: courseComBlocos };
  const s      = courseStats(courseKey, activeTurma, allCoursesComBlocos, state);
  const blocos = editMode
    ? blocosAtivos  // em edição: usa direto sem reordenação de estado
    : getOrderedBlocos(courseKey, activeTurma, allCoursesComBlocos, state);
  const cor    = conteudo.banner_cor || DISC_CORES[courseKey] || '#7c3aed';

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:'var(--text3)', fontSize:'0.9rem' }}>Carregando...</div>;

  return (
    <div className="anim-up">

      {/* ── Banner ── */}
      <BannerSection
        discKey={courseKey}
        banner_url={conteudo.banner_url}
        banner_cor={conteudo.banner_cor}
        editMode={editMode}
        onChange={patch => setConteudo(c => ({ ...c, ...patch }))}
      />

      {/* ── Header ── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ flex:1 }}>
          <div className="course-code">{discCode || course.code}</div>
          {editMode
            ? <input className="profile-input" style={{ marginBottom:6, fontWeight:700, fontSize:'1rem' }}
                value={conteudo.nome}
                placeholder="Nome da disciplina"
                onChange={e => set('nome', e.target.value)} />
            : <div className="course-title">{conteudo.nome || discLabel || course.fullname}</div>
          }
          {editMode
            ? <EditableText multiline className="profile-input"
                value={conteudo.info}
                onChange={v => set('info', v)}
                placeholder="Informações (carga horária, período...)"
                style={{ width:'100%', fontSize:'0.8rem' }} />
            : <div style={{ fontSize:'0.8rem', color:'var(--text3)', marginTop:4, whiteSpace:'pre-line' }}>{conteudo.info || discLabel}</div>
          }
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div className="turma-badge" style={{ borderColor: turma?.cor + '66', color: turma?.cor }}>
            <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background: turma?.cor, marginRight:6 }} />
            {turma?.modulo} · {turma?.label}
          </div>
          <div className="course-prog">
            <span>{s.done}</span>/{s.total} · {s.pct}%
          </div>
          {/* Botão editar */}
          {editMode ? (
            <>
              <button onClick={salvar} disabled={saving} style={{
                background:`linear-gradient(135deg, ${cor}, ${cor}cc)`,
                border:'none', borderRadius:10, padding:'8px 16px',
                color:'white', fontWeight:700, cursor:'pointer', fontSize:'0.85rem',
              }}>{saving ? 'Salvando…' : '✓ Salvar'}</button>
              <button onClick={() => setEditMode(false)} style={{
                background:'var(--surface2)', border:'1px solid var(--border)',
                borderRadius:10, padding:'8px 14px', color:'var(--text2)',
                cursor:'pointer', fontSize:'0.85rem',
              }}>Cancelar</button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)} style={{
              background:'var(--surface2)', border:'1px solid var(--border)',
              borderRadius:10, padding:'8px 14px', color:'var(--text2)',
              cursor:'pointer', fontSize:'0.85rem', fontWeight:600,
            }}>✏️ Editar</button>
          )}
          {savedOk && <span style={{ color:'var(--green)', fontSize:'0.82rem', fontWeight:600 }}>✓ Salvo!</span>}
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width:`${s.pct}%`, background:`linear-gradient(90deg, ${cor}, ${cor}99)` }} />
      </div>

      {/* ── Apresentação ── */}
      {(conteudo.apresentacao || editMode) && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:'0.72rem', color:'var(--text3)', fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>
            Sobre a disciplina
          </div>
          {editMode ? (
            <EditableText
              multiline
              className="profile-input"
              value={conteudo.apresentacao}
              onChange={v => set('apresentacao', v)}
              placeholder="Descrição da disciplina..."
              style={{ width:'100%', lineHeight:1.7 }}
            />
          ) : (
            <div style={{ fontSize:'0.875rem', color:'var(--text2)', lineHeight:1.75, whiteSpace:'pre-line' }}>
              {conteudo.apresentacao}
            </div>
          )}
        </div>
      )}

      {/* ── Avaliação ── */}
      {(conteudo.avaliacao || editMode) && (
        <div className="aval-box" style={{ marginBottom:20 }}>
          <div className="aval-box-title">⭐ Estrutura Avaliativa</div>
          {editMode ? (
            <EditableText
              multiline
              value={conteudo.avaliacao}
              onChange={v => set('avaliacao', v)}
              placeholder="Descreva a estrutura avaliativa..."
              style={{
                width:'100%', background:'transparent', border:'none',
                color:'var(--text2)', fontFamily:'var(--font-mono)',
                fontSize:'0.8125rem', lineHeight:1.7, outline:'none',
              }}
            />
          ) : (
            <pre className="aval-box-pre">{conteudo.avaliacao}</pre>
          )}
        </div>
      )}

      {/* ── Competências ── */}
      {(conteudo.competencias || editMode) && (
        <details style={{ marginBottom:16 }}>
          <summary style={{ cursor:'pointer', fontSize:'0.8125rem', color:'var(--text3)', padding:'8px 0' }}>
            📋 Competências oficiais ▸
          </summary>
          <div style={{ marginTop:10 }}>
            {editMode ? (
              <EditableText
                multiline
                className="profile-input"
                value={conteudo.competencias}
                onChange={v => set('competencias', v)}
                placeholder="Liste as competências..."
                style={{ width:'100%' }}
              />
            ) : (
              <pre style={{ fontSize:'0.8125rem', color:'var(--text2)', whiteSpace:'pre-wrap', lineHeight:1.7 }}>
                {conteudo.competencias}
              </pre>
            )}
          </div>
        </details>
      )}

      {/* ── Mini Projetos ── */}
      <MiniProjetos
        discKey={courseKey}
        projetos={projetos}
        editMode={editMode}
        onAdd={addProjeto}
        onEdit={editProjeto}
        onDelete={deleteProjeto}
      />

      {/* ── Blocos de aulas ── */}
      {blocos.map((bloco, bi) => (
        <Bloco
          key={bi}
          bloco={bloco}
          blocoIdx={bi}
          courseKey={courseKey}
          turmaKey={activeTurma}
          state={state}
          onToggle={onToggle}
          onSave={onSave}
          onReorder={(blocoIdx, fi, ti) => onReorder(blocoIdx, fi, ti)}
          editMode={editMode}
          onUpdateBloco={updated => handleUpdateBloco(bi, updated)}
          onDeleteBloco={() => handleDeleteBloco(bi)}
        />
      ))}

      {/* ── Novo Bloco (só em editMode) ── */}
      {editMode && (
        <button onClick={handleAddBloco} style={{
          width:'100%', marginTop:8,
          background:'rgba(124,58,237,0.07)', border:'1px dashed rgba(124,58,237,0.35)',
          borderRadius:12, padding:'14px', color:'var(--accent3)',
          fontSize:'0.85rem', fontWeight:600, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>
          + Novo Bloco
        </button>
      )}
    </div>
  );
}