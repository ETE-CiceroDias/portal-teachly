// pages/GerenciarDiscs.jsx — Disciplinas + Turmas
import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useOrg } from '../store/OrgContext.jsx';
import { COURSES } from '../data/courses.js';
import { PencilSimple, Trash, Eye, EyeSlash, DownloadSimple, Plus, Check, Power } from '@phosphor-icons/react';
import { ConfirmModal } from '../components/ConfirmModal.jsx';

const CORES = ['#7c3aed','#a855f7','#c084fc','#e879f9','#60a5fa','#4ade80','#fbbf24','#fb923c','#f87171','#2dd4bf'];

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:480 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}
function CorePicker({ value, onChange }) {
  return (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:6 }}>
      {CORES.map(c=>(
        <div key={c} onClick={()=>onChange(c)} style={{
          width:26, height:26, borderRadius:'50%', background:c, cursor:'pointer',
          border: value===c?'3px solid white':'3px solid transparent',
          boxShadow: value===c?`0 0 0 2px ${c}`:'none',
          transition:'all 0.15s',
        }}/>
      ))}
    </div>
  );
}

export function GerenciarDiscs() {
  const { org, turmas, reload } = useOrg();

  // ── Estado de modals ───────────────────────────────────────
  const [modal,     setModal]    = useState(null); // null | 'novaDisc' | 'novaTurma' | {disc} | {turma, tipo:'turma'}
  const [turmaId,   setTurmaId]  = useState(turmas[0]?.id || '');
  const [formDisc,  setFormDisc] = useState({ nome:'', codigo:'', cor:'#7c3aed' });
  const [formTurma, setFormTurma]= useState({ label:'', modulo:'', cor:'#7c3aed', hasDesafio:false, periodo:'', ano: new Date().getFullYear().toString() });
  const [saving,    setSaving]   = useState(false);
  const [log,       setLog]      = useState('');
  const [confirmItem, setConfirmItem] = useState(null); // { type:'disc'|'turma', item, onConfirm }

  const fd = k => e => setFormDisc(p=>({...p,[k]: e.target?.value ?? e}));
  const ft = k => e => setFormTurma(p=>({...p,[k]: e.target?.value ?? e}));

  // ── Turma: criar ───────────────────────────────────────────
  const criarTurma = async () => {
    if (!formTurma.label.trim() || !formTurma.modulo.trim()) { setLog('Preencha nome e módulo.'); return; }
    setSaving(true); setLog('');
    const { data:{ user } } = await supabase.auth.getUser();
    const key = `t_${Date.now()}`;
    const { error } = await supabase.from('turmas').insert({
      organizacao_id: org.id,
      professor_id:   user.id,
      key,
      label:       formTurma.label.trim(),
      modulo:      formTurma.modulo.trim(),
      cor:         formTurma.cor,
      has_desafio: formTurma.hasDesafio,
      dot_class:   '',
      periodo:     formTurma.periodo,
      ano:         formTurma.ano,
    });
    if (error) setLog('Erro: ' + error.message);
    else { await reload(); setModal(null); setLog(''); }
    setSaving(false);
  };

  // ── Turma: editar ──────────────────────────────────────────
  const editarTurma = async (turma) => {
    setFormTurma({ label:turma.label, modulo:turma.modulo, cor:turma.cor,
      hasDesafio:turma.hasDesafio, periodo:turma.periodo, ano:turma.ano });
    setModal({ tipo:'turma', ...turma });
  };

  const salvarTurma = async () => {
    if (!modal?.id) return;
    setSaving(true); setLog('');
    const { error } = await supabase.from('turmas').update({
      label:       formTurma.label.trim(),
      modulo:      formTurma.modulo.trim(),
      cor:         formTurma.cor,
      has_desafio: formTurma.hasDesafio,
      periodo:     formTurma.periodo,
      ano:         formTurma.ano,
    }).eq('id', modal.id);
    if (error) setLog('Erro: ' + error.message);
    else { await reload(); setModal(null); setLog(''); }
    setSaving(false);
  };

  const excluirTurma = async (turma) => {
    await supabase.from('disciplinas').delete().eq('turma_id', turma.id);
    const { error } = await supabase.from('turmas').delete().eq('id', turma.id);
    if (error) alert(error.message);
    else await reload();
  };

  // ── Disciplina: criar ──────────────────────────────────────
  const criarDisc = async () => {
    if (!formDisc.nome.trim()) return;
    setSaving(true); setLog('');
    const { data:{ user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('disciplinas').insert({
      organizacao_id: org.id,
      professor_id:   user.id,
      turma_id:       turmaId,
      key:            `d_${Date.now()}`,
      nome:           formDisc.nome.trim(),
      codigo:         formDisc.codigo.trim(),
      cor_destaque:   formDisc.cor,
      ativa:          true,
    });
    if (error) setLog('Erro: ' + error.message);
    else { await reload(); setModal(null); setLog(''); }
    setSaving(false);
  };

  // ── Disciplina: salvar edição ──────────────────────────────
  const salvarDisc = async () => {
    if (!modal?.id || modal.tipo === 'turma') return;
    setSaving(true); setLog('');
    const { error } = await supabase.from('disciplinas').update({
      nome:         formDisc.nome.trim(),
      codigo:       formDisc.codigo.trim(),
      cor_destaque: formDisc.cor,
      ativa:        formDisc.ativa,
    }).eq('id', modal.id);
    if (error) setLog('Erro: ' + error.message);
    else { await reload(); setModal(null); setLog(''); }
    setSaving(false);
  };

  const excluirDisc = async (disc) => {
    const { error } = await supabase.from('disciplinas').delete().eq('id', disc.id);
    if (error) alert(error.message);
    else await reload();
  };

  const toggleAtiva = async (disc) => {
    await supabase.from('disciplinas').update({ ativa: !disc.ativa }).eq('id', disc.id);
    await reload();
  };

  const toggleTurmaAtiva = async (turma) => {
    // Turmas não têm campo ativa no banco, mas podemos simular pelo campo periodo ou usando um campo customizado
    // Usamos a tabela turmas com campo ativa (adicione via SQL se necessário)
    const novoEstado = !turma.ativa;
    await supabase.from('turmas').update({ ativa: novoEstado }).eq('id', turma.id);
    await reload();
  };

  // ── Disciplina: importar conteúdo do courses.js ────────────
  const importarPlano = async (disc) => {
    // Tenta casar pelo key do disc, ou pelo código, ou pelo nome
    const match = Object.values(COURSES).find(c =>
      c.key === disc.key ||
      c.code === disc.code ||
      c.fullname?.toLowerCase() === disc.label?.toLowerCase() ||
      c.label?.toLowerCase() === disc.label?.toLowerCase()
    );

    if (!match) {
      alert(`Nenhum plano encontrado para "${disc.label}".\n\nVerifique se o nome ou código da disciplina corresponde a um dos planos: ${Object.values(COURSES).map(c => c.fullname).join(', ')}`);
      return;
    }

    const jaTemConteudo = disc.blocos && disc.blocos.length > 0;
    const msg = jaTemConteudo
      ? `A disciplina já tem conteúdo. Deseja sobrescrever com o plano de "${match.fullname}"?`
      : `Importar o plano completo de "${match.fullname}" para "${disc.label}"?`;
    setConfirmItem({ type: 'importar', msg, onConfirm: () => _doImportar(disc, match) });
    return;

    // conteudo importado via _doImportar
  };

  const _doImportar = async (disc, match) => {
    setConfirmItem(null);
    setSaving(true);
    const { error } = await supabase.from('disciplinas').update({
      blocos:      match.blocos      || [],
      avaliacao:   match.avaliacao   || '',
      descricao:   match.apresentacao || match.competencias || '',
    }).eq('id', disc.id);
    if (error) alert('Erro ao importar: ' + error.message);
    else await reload();
    setSaving(false);
  };

  return (
    <div className="anim-up">
      <div className="page-header">
        <div>
          <div className="page-title">Disciplinas & Turmas</div>
          <div className="page-subtitle">{org?.nome} · Gerencie turmas e disciplinas</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-ghost" onClick={() => { setFormTurma({ label:'', modulo:'', cor:'#7c3aed', hasDesafio:false, periodo:'', ano:new Date().getFullYear().toString() }); setModal('novaTurma'); setLog(''); }}>
            + Nova turma
          </button>
          <button className="btn-primary" onClick={() => { setFormDisc({ nome:'', codigo:'', cor:'#7c3aed' }); setModal('novaDisc'); setLog(''); }}>
            + Nova disciplina
          </button>
        </div>
      </div>

      {turmas.length === 0 && (
        <div style={{ padding:'40px', textAlign:'center', color:'var(--text3)', background:'var(--surface)',
          border:'1px dashed var(--border)', borderRadius:16 }}>
          Nenhuma turma ainda —{' '}
          <button onClick={() => setModal('novaTurma')}
            style={{ background:'none', border:'none', color:'var(--accent3)', cursor:'pointer', fontWeight:700 }}>
            criar primeira turma
          </button>
        </div>
      )}

      {turmas.map(turma => (
        <div key={turma.id} style={{ marginBottom:32 }}>
          {/* Cabeçalho turma */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:turma.cor, flexShrink:0 }} />
            <div style={{ fontWeight:700, color:'var(--text)', fontSize:'0.9375rem', flex:1 }}>
              {turma.modulo} · {turma.label}
              {turma.periodo && <span style={{ fontWeight:400, color:'var(--text3)', fontSize:'0.8rem', marginLeft:8 }}>{turma.periodo}</span>}
            </div>
            <div style={{ fontSize:'0.75rem', color:'var(--text3)' }}>{turma.disciplinas.length} disciplina{turma.disciplinas.length!==1?'s':''}</div>
            <button onClick={() => toggleTurmaAtiva(turma)} title={turma.ativa === false ? 'Turma desativada — clique para ativar' : 'Desativar turma'} style={{
              background:'none', border:'none', cursor:'pointer',
              color: turma.ativa === false ? 'var(--text3)' : 'var(--green)',
              display:'flex', alignItems:'center',
            }}><Power size={15} weight={turma.ativa === false ? 'regular' : 'fill'} /></button>
            <button onClick={() => editarTurma(turma)} title="Editar turma" style={{
              background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:'2px 6px',
            }}><PencilSimple size={15} /></button>
            <button onClick={() => { setTurmaId(turma.id); setFormDisc({ nome:'', codigo:'', cor:'#7c3aed' }); setModal('novaDisc'); setLog(''); }}
              title="Adicionar disciplina" style={{
              background:'none', border:'1px solid var(--border)', cursor:'pointer', fontSize:'0.75rem',
              color:'var(--accent3)', padding:'3px 10px', borderRadius:99, fontWeight:700,
              display:'inline-flex', alignItems:'center', gap:4,
            }}><Plus size={12} weight="bold" /> disc</button>
          </div>

          {turma.disciplinas.length === 0 ? (
            <div style={{ padding:'16px', textAlign:'center', color:'var(--text3)', fontSize:'0.875rem',
              background:'var(--surface)', border:'1px dashed var(--border)', borderRadius:12 }}>
              Nenhuma disciplina ainda
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
              {turma.disciplinas.map(disc => (
                <div key={disc.id} style={{
                  background: disc.ativa ? `${disc.cor}10` : 'var(--surface)',
                  border:`1px solid ${disc.ativa ? disc.cor+'40' : 'var(--border)'}`,
                  borderRadius:14, padding:'14px', opacity: disc.ativa ? 1 : 0.5,
                  transition:'all 0.2s',
                }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:disc.cor, marginTop:3, flexShrink:0 }} />
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={()=>toggleAtiva(disc)} title={disc.ativa?'Desativar':'Ativar'} style={{
                        background:'none', border:'none', cursor:'pointer', color: disc.ativa ? 'var(--green)' : 'var(--text3)',
                      }}>{disc.ativa ? <Eye size={15} weight="fill" /> : <EyeSlash size={15} />}</button>
                      <button onClick={()=>importarPlano(disc)} title="Importar plano de aula" style={{
                        background:'none', border:'none', cursor:'pointer', color:'var(--text3)',
                      }}><DownloadSimple size={15} /></button>
                      <button onClick={()=>{ setFormDisc({ nome:disc.label, codigo:disc.code, cor:disc.cor, ativa:disc.ativa }); setModal(disc); setLog(''); }} style={{
                        background:'none', border:'none', cursor:'pointer', color:'var(--text3)',
                      }}><PencilSimple size={15} /></button>
                      <button onClick={()=>setConfirmItem({ type:'disc', msg:`Excluir "${disc.label}" permanentemente? Esta ação não pode ser desfeita.`, onConfirm: () => { setConfirmItem(null); excluirDisc(disc); } })} style={{
                        background:'none', border:'none', cursor:'pointer', color:'var(--red)',
                      }}><Trash size={15} /></button>
                    </div>
                  </div>
                  <div style={{ fontWeight:700, color: disc.ativa?'var(--text)':'var(--text3)', fontSize:'0.875rem', marginBottom:2 }}>
                    {disc.label}
                  </div>
                  {disc.code && (
                    <div style={{ fontSize:'0.7rem', fontFamily:'monospace', color:'var(--text3)',
                      background:'var(--surface2)', borderRadius:5, padding:'2px 7px', display:'inline-block' }}>
                      {disc.code}
                    </div>
                  )}
                  <div style={{ marginTop:6, fontSize:'0.7rem', color: disc.blocos?.length ? 'var(--green)' : 'var(--text3)' }}>
                    {disc.blocos?.length
                      ? `✓ ${disc.blocos.length} bloco${disc.blocos.length !== 1 ? 's' : ''} importado${disc.blocos.length !== 1 ? 's' : ''}`
                      : '📥 Sem plano — clique em 📥 para importar'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* ── Modal: Nova Turma ── */}
      {modal === 'novaTurma' && (
        <Modal title="Nova turma" onClose={()=>setModal(null)}>
          <div className="modal-field">
            <div className="modal-label">Nome da turma *</div>
            <input className="modal-input" value={formTurma.label} onChange={ft('label')} placeholder="Turma A" autoFocus />
          </div>
          <div className="modal-field">
            <div className="modal-label">Módulo *</div>
            <input className="modal-input" value={formTurma.modulo} onChange={ft('modulo')} placeholder="Módulo 1" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="modal-field">
              <div className="modal-label">Período</div>
              <input className="modal-input" value={formTurma.periodo} onChange={ft('periodo')} placeholder="Mar – Jul" />
            </div>
            <div className="modal-field">
              <div className="modal-label">Ano</div>
              <input className="modal-input" value={formTurma.ano} onChange={ft('ano')} placeholder="2025" />
            </div>
          </div>
          <div className="modal-field">
            <div className="modal-label">Cor</div>
            <CorePicker value={formTurma.cor} onChange={v=>setFormTurma(p=>({...p,cor:v}))} />
          </div>
          <div className="modal-field">
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'0.875rem', color:'var(--text2)' }}>
              <input type="checkbox" checked={formTurma.hasDesafio} onChange={e=>setFormTurma(p=>({...p,hasDesafio:e.target.checked}))}
                style={{ accentColor:'var(--accent)' }} />
              Tem Desafio UX/UI
            </label>
          </div>
          {log && <div style={{ color:'var(--red)', fontSize:'0.8rem', marginBottom:8 }}>{log}</div>}
          <div className="modal-footer">
            <button className="btn-ghost" onClick={()=>setModal(null)}>Cancelar</button>
            <button className="btn-primary" onClick={criarTurma} disabled={saving || !formTurma.label.trim() || !formTurma.modulo.trim()}>
              {saving ? 'Criando…' : 'Criar turma'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Editar Turma ── */}
      {modal?.tipo === 'turma' && (
        <Modal title={`Editar — ${modal.modulo} · ${modal.label}`} onClose={()=>setModal(null)}>
          <div className="modal-field">
            <div className="modal-label">Nome da turma *</div>
            <input className="modal-input" value={formTurma.label} onChange={ft('label')} autoFocus />
          </div>
          <div className="modal-field">
            <div className="modal-label">Módulo *</div>
            <input className="modal-input" value={formTurma.modulo} onChange={ft('modulo')} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="modal-field">
              <div className="modal-label">Período</div>
              <input className="modal-input" value={formTurma.periodo} onChange={ft('periodo')} placeholder="Mar – Jul" />
            </div>
            <div className="modal-field">
              <div className="modal-label">Ano</div>
              <input className="modal-input" value={formTurma.ano} onChange={ft('ano')} />
            </div>
          </div>
          <div className="modal-field">
            <div className="modal-label">Cor</div>
            <CorePicker value={formTurma.cor} onChange={v=>setFormTurma(p=>({...p,cor:v}))} />
          </div>
          <div className="modal-field">
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'0.875rem', color:'var(--text2)' }}>
              <input type="checkbox" checked={formTurma.hasDesafio} onChange={e=>setFormTurma(p=>({...p,hasDesafio:e.target.checked}))}
                style={{ accentColor:'var(--accent)' }} />
              Tem Desafio UX/UI
            </label>
          </div>
          {log && <div style={{ color:'var(--red)', fontSize:'0.8rem', marginBottom:8 }}>{log}</div>}
          <div className="modal-footer">
            <button className="btn-ghost" style={{ color:'var(--red)' }} onClick={()=>setConfirmItem({ type:'turma', msg:`Excluir a turma "${modal.modulo} · ${modal.label}"? Isso também removerá todas as disciplinas vinculadas.`, onConfirm: () => { setConfirmItem(null); excluirTurma(modal); } })}>Excluir turma</button>
            <button className="btn-ghost" onClick={()=>setModal(null)}>Cancelar</button>
            <button className="btn-primary" onClick={salvarTurma} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Nova Disciplina ── */}
      {modal === 'novaDisc' && (
        <Modal title="Nova disciplina" onClose={()=>setModal(null)}>
          <div className="modal-field">
            <div className="modal-label">Turma</div>
            <select className="modal-input" value={turmaId} onChange={e=>setTurmaId(e.target.value)}>
              {turmas.map(t=><option key={t.id} value={t.id}>{t.modulo} · {t.label}</option>)}
            </select>
          </div>
          <div className="modal-field">
            <div className="modal-label">Nome *</div>
            <input className="modal-input" value={formDisc.nome} onChange={fd('nome')} placeholder="Design Centrado no Usuário" autoFocus />
          </div>
          <div className="modal-field">
            <div className="modal-label">Código</div>
            <input className="modal-input" value={formDisc.codigo} onChange={fd('codigo')} placeholder="DE_232" style={{ fontFamily:'monospace' }} />
          </div>
          <div className="modal-field">
            <div className="modal-label">Cor</div>
            <CorePicker value={formDisc.cor} onChange={v=>setFormDisc(p=>({...p,cor:v}))} />
          </div>
          {log && <div style={{ color:'var(--red)', fontSize:'0.8rem', marginBottom:8 }}>{log}</div>}
          <div className="modal-footer">
            <button className="btn-ghost" onClick={()=>setModal(null)}>Cancelar</button>
            <button className="btn-primary" onClick={criarDisc} disabled={saving || !formDisc.nome.trim()}>
              {saving ? 'Criando…' : 'Criar'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Editar Disciplina ── */}
      {modal && modal !== 'novaDisc' && modal !== 'novaTurma' && modal.tipo !== 'turma' && (
        <Modal title={`Editar — ${modal.label}`} onClose={()=>setModal(null)}>
          <div className="modal-field">
            <div className="modal-label">Nome *</div>
            <input className="modal-input" value={formDisc.nome} onChange={fd('nome')} autoFocus />
          </div>
          <div className="modal-field">
            <div className="modal-label">Código</div>
            <input className="modal-input" value={formDisc.codigo} onChange={fd('codigo')} style={{ fontFamily:'monospace' }} />
          </div>
          <div className="modal-field">
            <div className="modal-label">Cor</div>
            <CorePicker value={formDisc.cor} onChange={v=>setFormDisc(p=>({...p,cor:v}))} />
          </div>
          <div className="modal-field">
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'0.875rem', color:'var(--text2)' }}>
              <input type="checkbox" checked={formDisc.ativa ?? true} onChange={e=>setFormDisc(p=>({...p,ativa:e.target.checked}))}
                style={{ accentColor:'var(--accent)' }} />
              Disciplina ativa (aparece no menu)
            </label>
          </div>
          {log && <div style={{ color:'var(--red)', fontSize:'0.8rem', marginBottom:8 }}>{log}</div>}
          <div className="modal-footer">
            <button className="btn-ghost" style={{ color:'var(--red)' }} onClick={()=>setConfirmItem({ type:'disc', msg:`Excluir "${modal.label}" permanentemente? Esta ação não pode ser desfeita.`, onConfirm: () => { setConfirmItem(null); excluirDisc(modal); } })}>Excluir</button>
            <button className="btn-ghost" onClick={()=>setModal(null)}>Cancelar</button>
            <button className="btn-primary" onClick={salvarDisc} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </Modal>
      )}

      {confirmItem && (
        <ConfirmModal
          title={confirmItem.type === 'turma' ? 'Excluir turma' : confirmItem.type === 'disc' ? 'Excluir disciplina' : 'Confirmar importação'}
          message={confirmItem.msg}
          confirmLabel={confirmItem.type === 'importar' ? 'Importar' : 'Excluir'}
          danger={confirmItem.type !== 'importar'}
          onConfirm={confirmItem.onConfirm}
          onCancel={() => setConfirmItem(null)}
        />
      )}
    </div>
  );
}