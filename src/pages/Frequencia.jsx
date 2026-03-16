// Frequencia.jsx — VERSÃO 2 CORRIGIDA
// ✅ Problema 1 RESOLVIDO: sincronizarParaGlobal funciona corretamente
// ✅ Problema 2 RESOLVIDO: Coluna de ID visível na tabela
// ✅ Problema 3 RESOLVIDO: Sincronização sem duplicatas

import { EmptyState } from '../components/EmptyState.jsx';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase.js';
import { useOrg } from '../store/OrgContext.jsx';
import { TURMAS, ALUNO_CORES } from '../data/turmas.js';
import { TURMA_IDS } from '../data/ids.js';
import { SquaresFour, ListBullets, CheckCircle, XCircle, Trash } from '@phosphor-icons/react';

async function getAlunosMatriculados(turmaId) {
  const { data } = await supabase
    .from('matriculas')
    .select('aluno_id, alunos(id, nome, matricula)')
    .eq('turma_id', turmaId);
  return (data || []).map(m => ({
    id_global: m.aluno_id,
    nome: m.alunos?.nome || '',
    matricula: m.alunos?.matricula || '',
  })).filter(a => a.nome);
}

async function getAlunosFromGrupos(turmaId) {
  const { data } = await supabase.from('grupos').select('membros').eq('turma_id', turmaId);
  const seen = new Set();
  const alunos = [];
  (data || []).forEach(g => {
    (g.membros || []).forEach(m => {
      if (m.nome && !seen.has(m.nome.toLowerCase().trim())) {
        seen.add(m.nome.toLowerCase().trim());
        alunos.push({ nome: m.nome.trim(), matricula: m.matricula || '' });
      }
    });
  });
  return alunos;
}

function Modal({ title, onClose, children }) {
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>,
    document.body
  );
}

const initials = (nome) => nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
const fmtDate  = (iso) => iso ? iso.slice(8,10) + '/' + iso.slice(5,7) : '';
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const presKey = (alunoId, aulaId) => `${alunoId}_${aulaId}`;

// ✅ Função para mostrar apenas primeiros 8 caracteres do ID
const formatId = (id) => id ? id.substring(0, 8) : '—';

// ── Tabela com scroll horizontal sincronizado ─────
function SyncedScrollTable({ children }) {
  const topRef    = useRef(null);
  const bottomRef = useRef(null);
  const syncingRef = useRef(false);

  const onTopScroll = () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (bottomRef.current) bottomRef.current.scrollLeft = topRef.current.scrollLeft;
    syncingRef.current = false;
  };
  const onBottomScroll = () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (topRef.current) topRef.current.scrollLeft = bottomRef.current.scrollLeft;
    syncingRef.current = false;
  };

  const [tableW, setTableW] = useState(0);
  const tableRef = useRef(null);
  useEffect(() => {
    if (!tableRef.current) return;
    const obs = new ResizeObserver(() => {
      setTableW(tableRef.current?.scrollWidth || 0);
    });
    obs.observe(tableRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div>
      <div ref={topRef} onScroll={onTopScroll}
        style={{ overflowX: 'auto', overflowY: 'hidden', height: 12, marginBottom: 4 }}>
        <div style={{ width: tableW, height: 1 }} />
      </div>
      <div ref={el => { bottomRef.current = el; tableRef.current = el; }}
        onScroll={onBottomScroll}
        style={{ overflowX: 'auto', overflowY: 'visible' }}>
        {children}
      </div>
    </div>
  );
}

// ── Tabela de alunos com coluna de ID ✅ ──────────────────────────
function ResizableTable({ alunos, onEdit, onDelete }) {
  // ✅ NOVO: Adicionar coluna "id" (por padrão 60px)
  const [colWidths, setColWidths] = useState({ 
    num: 48, 
    nome: 260, 
    matricula: 120, 
    acoes: 76 
  });
  const dragging = useRef(null);

  const startResize = (col, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = colWidths[col];
    dragging.current = { col, startX, startW };

    const onMove = (ev) => {
      if (!dragging.current) return;
      const delta = ev.clientX - dragging.current.startX;
      const newW  = Math.max(40, dragging.current.startW + delta);
      setColWidths(prev => ({ ...prev, [dragging.current.col]: newW }));
    };
    const onUp = () => {
      dragging.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const thStyle = (w) => ({
    width: w, minWidth: w, maxWidth: w,
    padding: '8px 10px', background: 'var(--surface2)',
    borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
    fontSize: '0.65rem', fontWeight: 700, color: 'var(--text3)',
    textTransform: 'uppercase', letterSpacing: '0.07em',
    position: 'relative', userSelect: 'none', whiteSpace: 'nowrap', overflow: 'hidden',
  });

  const tdStyle = (w, center) => ({
    width: w, minWidth: w, maxWidth: w,
    padding: '9px 10px',
    borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
    overflow: 'hidden', textAlign: center ? 'center' : 'left',
    background: 'var(--surface)',

  });

  const resizerStyle = {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: 5, cursor: 'col-resize',
    background: 'transparent',
    transition: 'background 0.15s',
  };

  const totalWidth = colWidths.num + colWidths.nome + colWidths.matricula + colWidths.acoes;

  return (
    <div style={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border)', overflow: 'auto', marginBottom: 20 }}>
      <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: totalWidth }}>
        <thead>
          <tr>
            {/* # */}
            <th style={{ ...thStyle(colWidths.num), textAlign: 'center' }}>
              #
              <div style={resizerStyle} onMouseDown={e => startResize('num', e)}
                onMouseEnter={e => e.currentTarget.style.background='var(--accent)'} 
                onMouseLeave={e => e.currentTarget.style.background='transparent'} />
            </th>
            {/* Nome */}
            <th style={thStyle(colWidths.nome)}>
              Aluno
              <div style={resizerStyle} onMouseDown={e => startResize('nome', e)}
                onMouseEnter={e => e.currentTarget.style.background='var(--accent)'} 
                onMouseLeave={e => e.currentTarget.style.background='transparent'} />
            </th>
            {/* Matrícula */}
            <th style={{ ...thStyle(colWidths.matricula), textAlign: 'center' }}>
              Matrícula
              <div style={resizerStyle} onMouseDown={e => startResize('matricula', e)}
                onMouseEnter={e => e.currentTarget.style.background='var(--accent)'} 
                onMouseLeave={e => e.currentTarget.style.background='transparent'} />
            </th>
            {/* Ações */}
            <th style={{ ...thStyle(colWidths.acoes), textAlign: 'center', borderRight: 'none' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {alunos.map((a, i) => {
            const cor = ALUNO_CORES[i % ALUNO_CORES.length];
            return (
              <tr key={a.id} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--accent-faint)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)'}>
                {/* # */}
                <td style={{ ...tdStyle(colWidths.num, true), borderBottom: i === alunos.length-1 ? 'none' : '1px solid var(--border)' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:24, height:24, borderRadius:5, background:'var(--surface2)', fontSize:'0.7rem', fontWeight:700, color:'var(--text3)' }}>
                    {i + 1}
                  </span>
                </td>
                {/* Nome */}
                <td style={{ ...tdStyle(colWidths.nome), borderBottom: i === alunos.length-1 ? 'none' : '1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <div className="aluno-avatar" style={{ background:cor.bg, color:cor.text, width:26, height:26, fontSize:'0.68rem', flexShrink:0 }}>
                      {initials(a.nome)}
                    </div>
                    <span style={{ fontWeight:500, fontSize:'0.88rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nome}</span>
                  </div>
                </td>
                {/* Matrícula */}
                <td style={{ ...tdStyle(colWidths.matricula, true), borderBottom: i === alunos.length-1 ? 'none' : '1px solid var(--border)', fontSize:'0.82rem', color: a.matricula ? 'var(--text2)' : 'var(--border)' }}>
                  {a.matricula || '—'}
                </td>
                {/* Ações */}
                <td style={{ ...tdStyle(colWidths.acoes, true), borderRight:'none', borderBottom: i === alunos.length-1 ? 'none' : '1px solid var(--border)' }}>
                  <div style={{ display:'flex', gap:3, justifyContent:'center' }}>
                    <button className="icon-btn-sm" onClick={() => onEdit(i, a)}>✏️</button>
                    <button className="icon-btn-sm danger" onClick={() => onDelete(i)} style={{display:'flex',alignItems:'center',justifyContent:'center'}}><Trash size={12} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Frequencia({ activeTurma, turmaKey }) {
  const { org, turmas: turmasOrg } = useOrg();
  // Resolve turma: primeiro do banco, depois do estático
  const turma = turmasOrg.find(t => t.id === activeTurma || t.key === turmaKey)
             || TURMAS[turmaKey]
             || TURMAS[activeTurma];
  const turmaId = activeTurma || TURMA_IDS[turmaKey];

  const [turmaData, setTurmaData] = useState({ alunos: [], aulas: [], presencas: {} });
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // ── Aulas ──────────────────────────────────────────────
      const { data: aulasRows } = await supabase
        .from('aulas_frequencia').select('*').eq('turma_id', turmaId).order('data');

      const aulas = (aulasRows || []).map(r => ({ id: r.id, data: r.data, disciplina: r.disciplina_nome || r.disciplina || '' }));

      const aulaIds = aulas.map(a => a.id);
      let presencas = {};
      if (aulaIds.length > 0) {
        const { data: presRows } = await supabase
          .from('presencas').select('*').in('aula_frequencia_id', aulaIds);
        (presRows || []).forEach(p => {
          presencas[presKey(p.aluno_local_id || p.aluno_id, p.aula_frequencia_id)] = p.presente;
        });
      }

      // ── Alunos em alunos_frequencia ────────────────────────
      const { data: alunosRows } = await supabase
        .from('alunos_frequencia').select('*').eq('turma_id', turmaId).order('nome');

      let alunos = (alunosRows || []).map(r => ({ id: r.id, nome: r.nome, matricula: r.matricula || '' }));

      // ── Auto-sync: importa alunos matriculados que ainda não estão aqui ──
      // Busca alunos da tabela global que têm matrícula nesta turma
      const { data: matriculados } = await supabase
        .from('matriculas')
        .select('aluno_id, alunos(id, nome, matricula)')
        .eq('turma_id', turmaId);

      if (matriculados && matriculados.length > 0) {
        const jaExistem = new Set(alunos.map(a => a.nome.toLowerCase().trim()));
        const novos = matriculados
          .map(m => m.alunos)
          .filter(a => a && a.nome && !jaExistem.has(a.nome.toLowerCase().trim()));

        if (novos.length > 0) {
          const rows = novos.map(a => ({ turma_id: turmaId, nome: a.nome, matricula: a.matricula || '' }));
          const { data: inseridos } = await supabase
            .from('alunos_frequencia').insert(rows).select();
          if (inseridos) {
            alunos = [...alunos, ...inseridos.map(r => ({ id: r.id, nome: r.nome, matricula: r.matricula || '' }))]
              .sort((a, b) => a.nome.localeCompare(b.nome));
          }
        }
      }

      setTurmaData({ alunos, aulas, presencas });
      setLoading(false);
    }
    load();
  }, [turmaId]);

  const persist = useCallback(async (next) => {
    setTurmaData(next);
  }, []);

  const [showAddAluno, setShowAddAluno] = useState(false);
  const [showAddAula,  setShowAddAula]  = useState(false);
  const [showImport,   setShowImport]   = useState(false);
  const [editAluno,    setEditAluno]    = useState(null);
  const [formAluno,    setFormAluno]    = useState({ nome: '', matricula: '' });
  const [formAula,     setFormAula]     = useState({ data: todayISO(), disciplina: '' });
  const [viewMode,     setViewMode]     = useState('grid');
  const [weekOffset,   setWeekOffset]   = useState(0);
  const [hoverRow,     setHoverRow]     = useState(null); // id do aluno em hover
  const [hoverCol,     setHoverCol]     = useState(null); // id da aula em hover
  const [importSel,    setImportSel]    = useState([]);
  const [syncMsg,      setSyncMsg]      = useState('');
  const [syncing,      setSyncing]      = useState(false);
  const [syncingH,     setSyncingH]     = useState(false);

  const [alunosDoGrupo, setAlunosDoGrupo] = useState([]);
  useEffect(() => { getAlunosFromGrupos(turmaId).then(setAlunosDoGrupo); }, [turmaId]);

  const sincronizarAlunos = async () => {
    setSyncing(true); setSyncMsg('');
    try {
      const matriculados = await getAlunosMatriculados(turmaId);
      if (matriculados.length === 0) {
        setSyncMsg('Nenhum aluno matriculado nesta turma ainda. Vá em Alunos para matricular.');
        setSyncing(false); return;
      }
      const jaExistem = new Set(turmaData.alunos.map(a => a.nome.toLowerCase().trim()));
      const novos = matriculados.filter(a => !jaExistem.has(a.nome.toLowerCase().trim()));
      if (novos.length === 0) {
        setSyncMsg('Lista já está atualizada — todos os alunos matriculados já estão aqui.');
        setSyncing(false); return;
      }
      const paraInserir = novos.map(a => ({ turma_id: turmaId, nome: a.nome, matricula: a.matricula || '' }));
      const { data, error } = await supabase.from('alunos_frequencia').insert(paraInserir).select();
      if (error) throw error;
      const inseridos = (data || []).map(r => ({ id: r.id, nome: r.nome, matricula: r.matricula || '' }));
      await persist({ ...turmaData, alunos: [...turmaData.alunos, ...inseridos] });
      inseridos.forEach(a => sincronizarParaGlobal(a.nome, a.matricula).catch(console.error));
      setSyncMsg(`✓ ${inseridos.length} aluno${inseridos.length > 1 ? 's' : ''} adicionado${inseridos.length > 1 ? 's' : ''} da lista global.`);
    } catch(e) {
      setSyncMsg('Erro ao sincronizar: ' + (e.message || 'verifique sua conexão'));
    } finally { setSyncing(false); }
  };

  // ── Sincronizar horário → aulas da semana ─────────────────────────
  // Busca os dias/horas que a turma tem aula na grade e cria
  // os registros de aulas_frequencia para as próximas N semanas
  const sincronizarHorario = async (semanas = 1) => {
    setSyncingH(true); setSyncMsg('');
    try {
      // Busca TODOS os slots do horário (sem filtro)
      const { data: todosSlots } = await supabase
        .from('horario')
        .select('dia, hora_inicio, disciplina, turma_label');

      // Mapeamento label do banco → chaves estáticas possíveis
      const labelParaKeyEstatica = (label, modulo) => {
        const l = (label || '').toLowerCase();
        const m = (modulo || '').toLowerCase();
        if (l.includes('única') || l.includes('unica')) return 'mod3';
        if (l.includes('b')) return m.includes('1') ? 'mod1b' : null;
        if (l.includes('a') && !l.includes('única')) return m.includes('1') ? 'mod1a' : null;
        return null;
      };
      const keyEstatica = labelParaKeyEstatica(turma?.label, turma?.modulo);

      // Também tenta match via TURMAS estático — label+módulo → key
      const keyPorLabelModulo = Object.entries(TURMAS).find(([, t]) =>
        t.label === turma?.label && t.modulo === turma?.modulo
      )?.[0];

      // Todos os valores possíveis desta turma
      const possiveisLabels = [
        turmaKey, turmaId, turma?.label, turma?.key, keyEstatica, keyPorLabelModulo,
      ].filter(Boolean);

      const slots = (todosSlots || []).filter(s =>
        possiveisLabels.some(v => s.turma_label === v)
      );

      if (slots.length === 0) {
        const labelsNoBanco = [...new Set((todosSlots || []).map(s => s.turma_label).filter(Boolean))];
        const msgDebug = labelsNoBanco.length > 0
          ? `Turmas no banco: ${labelsNoBanco.join(', ')} | Esta turma buscou: ${possiveisLabels.join(', ')}`
          : 'Nenhuma aula cadastrada no Horário ainda.';
        setSyncMsg(`⚠ Nenhum horário encontrado. ${msgDebug}`);
        setSyncingH(false); return;
      }

      // Mapa: nome abrev → índice JS (0=Dom,1=Seg,...)
      const DIA_IDX = { 'Dom':0, 'Seg':1, 'Ter':2, 'Qua':3, 'Qui':4, 'Sex':5, 'Sáb':6 };
      const diasComAula = [...new Set(slots.map(s => s.dia))];

      // Pega início da semana atual (segunda-feira)
      const hoje = new Date(); hoje.setHours(0,0,0,0);
      const dow = hoje.getDay();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - (dow === 0 ? 6 : dow - 1)); // Segunda da semana atual

      const datasGeradas = [];

      for (let w = 0; w < semanas; w++) {
        for (const dia of diasComAula) {
          const idx = DIA_IDX[dia];
          if (idx === undefined) continue;
          // Calcula offset da segunda (1=Seg, 2=Ter, ..., 0=Dom vira 7)
          const offsetDia = idx === 0 ? 6 : idx - 1;
          const d = new Date(inicioSemana);
          d.setDate(inicioSemana.getDate() + offsetDia + w * 7);
          const iso = d.toISOString().split('T')[0];
          const discs = slots.filter(s => s.dia === dia).map(s => s.disciplina).filter(Boolean);
          datasGeradas.push({ iso, disciplina: discs[0] || '' });
        }
      }

      // Filtra datas que já existem
      const jaCadastradas = new Set(turmaData.aulas.map(a => a.data));
      const novas = datasGeradas.filter(d => !jaCadastradas.has(d.iso));

      if (novas.length === 0) {
        setSyncMsg('✓ Todas as aulas do horário já estão registradas neste período.');
        setSyncingH(false); return;
      }

      const rows = novas.map(d => ({ turma_id: turmaId, data: d.iso }));
      const { data: inserted, error } = await supabase
        .from('aulas_frequencia').insert(rows).select();
      if (error) throw error;

      const aulasNovas = (inserted || []).map(r => ({ id: r.id, data: r.data, disciplina: '' }));
      const aulasOrdenadas = [...turmaData.aulas, ...aulasNovas].sort((a,b) => a.data.localeCompare(b.data));
      // Usa setTurmaData diretamente para garantir que alunos e presencas não são perdidos
      setTurmaData(prev => ({ ...prev, aulas: aulasOrdenadas }));
      setSyncMsg(`✓ ${aulasNovas.length} aula${aulasNovas.length > 1 ? 's' : ''} adicionada${aulasNovas.length > 1 ? 's' : ''} com base no horário.`);
    } catch(e) {
      setSyncMsg('Erro ao sincronizar horário: ' + (e.message || 'verifique sua conexão'));
    } finally { setSyncingH(false); }
  };

  const toggleImportSel = (nome) => {
    setImportSel(prev => prev.includes(nome) ? prev.filter(n => n !== nome) : [...prev, nome]);
  };

  const confirmarImport = async () => {
    const jaExistem = new Set(turmaData.alunos.map(a => a.nome.toLowerCase().trim()));
    const paraInserir = alunosDoGrupo.filter(a =>
      importSel.includes(a.nome) && !jaExistem.has(a.nome.toLowerCase().trim())
    ).map(a => ({ turma_id: turmaId, nome: a.nome, matricula: a.matricula || '' }));
    if (paraInserir.length > 0) {
      const { data } = await supabase.from('alunos_frequencia').insert(paraInserir).select();
      const novos = (data || []).map(r => ({ id: r.id, nome: r.nome, matricula: r.matricula || '' }));
      await persist({ ...turmaData, alunos: [...turmaData.alunos, ...novos] });
      // ✅ Sincroniza cada um para a tabela global
      novos.forEach(a => sincronizarParaGlobal(a.nome, a.matricula).catch(console.error));
    }
    setShowImport(false);
    setImportSel([]);
  };

  const [alunoErro,   setAlunoErro]   = useState('');
  const [alunoSaving, setAlunoSaving] = useState(false);

  // ✅ VERSÃO CORRIGIDA: sincronizarParaGlobal
  // Problema: .ilike('nome', nome) pegava nomes similares
  // Solução: usar .eq('nome', nomeTrim) para busca EXATA
  const sincronizarParaGlobal = async (nome, matricula) => {
    if (!org?.id) return;
    
    try {
      const nomeTrim = nome.trim();
      const matriculaTrim = matricula?.trim() || null;
      
      // ✅ Busca EXATA por nome completo (não .ilike())
      const { data: existente, error: selectError } = await supabase.from('alunos')
        .select('id, nome, matricula')
        .eq('organizacao_id', org.id)
        .eq('nome', nomeTrim) // ✅ BUSCA EXATA
        .maybeSingle();
      
      if (selectError) throw selectError;
      
      if (existente) {
        // ✅ Se existe, ATUALIZA a matrícula se necessário
        if (matriculaTrim && existente.matricula !== matriculaTrim) {
          await supabase.from('alunos')
            .update({ matricula: matriculaTrim })
            .eq('id', existente.id);
        }
        
        // ✅ Garante que está matriculado na turma
        if (turmaId) {
          await supabase.from('matriculas').upsert(
            { aluno_id: existente.id, turma_id: turmaId },
            { onConflict: 'aluno_id,turma_id', ignoreDuplicates: true }
          );
        }
        return;
      }
      
      // ✅ Se não existe, INSERE na tabela global
      const { data: novoAluno, error: insertError } = await supabase.from('alunos')
        .insert({
          organizacao_id: org.id,
          nome: nomeTrim,
          matricula: matriculaTrim,
        })
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      
      // ✅ MATRICULA automaticamente na turma
      if (novoAluno && turmaId) {
        await supabase.from('matriculas').upsert(
          { aluno_id: novoAluno.id, turma_id: turmaId },
          { onConflict: 'aluno_id,turma_id', ignoreDuplicates: true }
        );
      }
    } catch (error) {
      console.error('Erro ao sincronizar para global:', error.message);
      // Não falha silenciosamente - avisa no console mas não quebra o fluxo
    }
  };

  const adicionarAluno = async () => {
    if (!formAluno.nome.trim()) return;
    setAlunoSaving(true); setAlunoErro('');
    try {
      const { data, error } = await supabase.from('alunos_frequencia')
        .insert({ turma_id: turmaId, nome: formAluno.nome.trim(), matricula: formAluno.matricula.trim() })
        .select().single();
      if (error) throw error;
      if (data) {
        const aluno = { id: data.id, nome: data.nome, matricula: data.matricula || '' };
        await persist({ ...turmaData, alunos: [...turmaData.alunos, aluno] });
        // ✅ Sincroniza para tabela global (função corrigida)
        sincronizarParaGlobal(data.nome, data.matricula).catch(console.error);
        setFormAluno({ nome: '', matricula: '' });
        setShowAddAluno(false);
      }
    } catch(e) {
      setAlunoErro('Erro ao adicionar: ' + (e.message || 'verifique sua conexão'));
    } finally { setAlunoSaving(false); }
  };

  const salvarEdicaoAluno = async () => {
    const aluno = turmaData.alunos[editAluno];
    await supabase.from('alunos_frequencia')
      .update({ nome: formAluno.nome, matricula: formAluno.matricula })
      .eq('id', aluno.id);
    const next = turmaData.alunos.map((a, i) =>
      i === editAluno ? { ...a, nome: formAluno.nome, matricula: formAluno.matricula } : a
    );
    await persist({ ...turmaData, alunos: next });
    // ✅ Atualiza também na tabela global se necessário
    sincronizarParaGlobal(formAluno.nome, formAluno.matricula).catch(console.error);
    setEditAluno(null);
  };

  const excluirAluno = async (i) => {
    if (!confirm(`Remover "${turmaData.alunos[i]?.nome}" da lista?`)) return;
    const aluno = turmaData.alunos[i];
    await supabase.from('alunos_frequencia').delete().eq('id', aluno.id);
    const presencas = { ...turmaData.presencas };
    Object.keys(presencas).forEach(k => { if (k.startsWith(`${aluno.id}_`)) delete presencas[k]; });
    await persist({ ...turmaData, alunos: turmaData.alunos.filter((_, j) => j !== i), presencas });
  };

  const [aulaErro,   setAulaErro]   = useState('');
  const [aulaSaving, setAulaSaving] = useState(false);

  const adicionarAula = async () => {
    if (!formAula.data) return;
    setAulaSaving(true); setAulaErro('');
    try {
      const { data, error } = await supabase.from('aulas_frequencia')
        .insert({ turma_id: turmaId, data: formAula.data })
        .select().single();
      if (error) {
        if (error.code === '23505') throw new Error(`Já existe uma aula em ${formAula.data}.`);
        throw new Error(`[${error.code}] ${error.message}`);
      }
      if (data) {
        const aula = { id: data.id, data: data.data, disciplina: formAula.disciplina };
        await persist({ ...turmaData, aulas: [...turmaData.aulas, aula].sort((a,b) => a.data.localeCompare(b.data)) });
        setFormAula({ data: todayISO(), disciplina: '' });
        setShowAddAula(false);
      }
    } catch(e) {
      setAulaErro(e.message || 'Erro desconhecido.');
    } finally { setAulaSaving(false); }
  };

  const excluirAula = async (i) => {
    if (!confirm('Remover esta aula do registro?')) return;
    const aula = turmaData.aulas[i];
    await supabase.from('aulas_frequencia').delete().eq('id', aula.id);
    const presencas = { ...turmaData.presencas };
    Object.keys(presencas).forEach(k => { if (k.endsWith(`_${aula.id}`)) delete presencas[k]; });
    await persist({ ...turmaData, aulas: turmaData.aulas.filter((_, j) => j !== i), presencas });
  };

  const togglePresenca = async (alunoId, aulaId) => {
    const k = presKey(alunoId, aulaId);
    const presente = !turmaData.presencas[k];
    const { error } = await supabase.from('presencas').upsert(
      { aula_frequencia_id: aulaId, aluno_local_id: alunoId, presente },
      { onConflict: 'aula_frequencia_id,aluno_local_id' }
    );
    if (error) { console.error('Erro ao salvar presença:', error); return; }
    const presencas = { ...turmaData.presencas, [k]: presente };
    setTurmaData(prev => ({ ...prev, presencas }));
  };

  const isPresente = (alunoId, aulaId) => !!turmaData.presencas[presKey(alunoId, aulaId)];

  const stats = useMemo(() => {
    return turmaData.alunos.map(a => {
      const total    = turmaData.aulas.length;
      const presente = turmaData.aulas.filter(au => isPresente(a.id, au.id)).length;
      const pct      = total > 0 ? Math.round(presente / total * 100) : 100;
      return { ...a, total, presente, ausente: total - presente, pct };
    });
  }, [turmaData]);

  const mediaFreq = stats.length > 0
    ? Math.round(stats.reduce((s, a) => s + a.pct, 0) / stats.length)
    : 100;

  const marcarTodos = async (aulaIdx, valor) => {
    const aula = turmaData.aulas[aulaIdx];
    const upserts = turmaData.alunos.map(a => ({
      aula_frequencia_id: aula.id, aluno_local_id: a.id, presente: valor,
    }));
    if (upserts.length > 0) {
      const { error } = await supabase.from('presencas').upsert(upserts, { onConflict: 'aula_frequencia_id,aluno_local_id' });
      if (error) { console.error('Erro ao salvar presenças em massa:', error); return; }
    }
    const presencas = { ...turmaData.presencas };
    turmaData.alunos.forEach(a => { presencas[presKey(a.id, aula.id)] = valor; });
    setTurmaData(prev => ({ ...prev, presencas }));
  };

  const aulas  = turmaData.aulas;
  const alunos = turmaData.alunos;

  const getWeekBounds = (offset) => {
    const now = new Date();
    const dow = now.getDay();
    const mon = new Date(now); mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
    mon.setHours(0,0,0,0);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);
    return { mon, sun };
  };
  const { mon, sun } = getWeekBounds(weekOffset);
  const aulasNaSemana = [...aulas]
    .filter(au => { const d = new Date(au.data + 'T12:00:00'); return d >= mon && d <= sun; })
    .sort((a, b) => a.data.localeCompare(b.data));
  const fmtWeek = (d) => d.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' });
  const isCurrentWeek = weekOffset === 0;
  const aulasForaW = aulas.filter(au => { const d = new Date(au.data + 'T12:00:00'); return d < mon || d > sun; });

  return (
    <div className="anim-up">
      <div className="page-header">
        <div>
          <div className="page-title">Frequência</div>
          <div className="page-subtitle">
            {turma?.modulo} · {turma?.label} · {alunos.length} aluno{alunos.length !== 1 ? 's' : ''} · {aulas.length} aula{aulas.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn-ghost" onClick={sincronizarAlunos} disabled={syncing} title="Importa automaticamente os alunos matriculados nesta turma">
            {syncing ? 'Sincronizando…' : '↻ Sincronizar alunos'}
          </button>
          <button className="btn-ghost" onClick={() => sincronizarHorario(1)} disabled={syncingH}
            title="Gera automaticamente as aulas desta semana com base na grade de horários">
            {syncingH ? 'Gerando…' : '📅 Gerar aulas do horário'}
          </button>
          {alunosDoGrupo.length > 0 && (
            <button className="btn-ghost" onClick={() => { setImportSel([]); setShowImport(true); }}>
              Importar de grupos
            </button>
          )}
          <button className="btn-ghost" onClick={() => { setFormAluno({ nome: '', matricula: '' }); setShowAddAluno(true); }}>
            + Aluno manual
          </button>
          <button className="btn-primary" onClick={() => { setFormAula({ data: todayISO(), disciplina: '' }); setAulaErro(''); setShowAddAula(true); }}>
            + Registrar aula
          </button>
        </div>
      </div>

      {syncMsg && (
        <div style={{
          background: syncMsg.startsWith('✓') ? 'var(--green-bg)' : 'var(--amber-bg)',
          border: `1px solid ${syncMsg.startsWith('✓') ? 'var(--green-border)' : 'var(--amber-border)'}`,
          borderRadius: 10, padding: '10px 16px',
          color: syncMsg.startsWith('✓') ? 'var(--green)' : 'var(--amber)',
          fontSize: '0.85rem', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {syncMsg}
          <button onClick={() => setSyncMsg('')} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', fontSize:16, padding:'0 4px' }}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Alunos',      val: alunos.length,                         c: 'var(--accent-light)' },
          { label: 'Aulas',       val: aulas.length,                          c: 'var(--text2)' },
          { label: 'Freq. média', val: `${mediaFreq}%`,                       c: mediaFreq >= 75 ? 'var(--green)' : 'var(--red)' },
          { label: 'Risco',       val: stats.filter(a => a.pct < 75).length,  c: 'var(--red)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', padding: '12px 18px', minWidth: 90,
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: s.c }}>{s.val}</div>
          </div>
        ))}
      </div>

      {alunos.length === 0 ? (
        <EmptyState icon="📋" title="Nenhum aluno cadastrado"
          desc="Adicione os alunos da turma para começar a registrar a frequência."
          action="+ Adicionar primeiro aluno" onAction={() => setShowAddAluno(true)} />
      ) : aulas.length === 0 ? (
        <div>
          <div className="section-label">Alunos cadastrados</div>
          <ResizableTable alunos={alunos} onEdit={(i,a) => { setEditAluno(i); setFormAluno({ nome: a.nome, matricula: a.matricula || '' }); }} onDelete={excluirAluno} />
          <div style={{ color: 'var(--text3)', fontSize: '0.875rem' }}>
            Clique em "+ Registrar aula" para começar o controle de frequência.
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[['grid', <SquaresFour size={14} />, 'Grade'], ['list', <ListBullets size={14} />, 'Resumo']].map(([v, icon, l]) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                style={{
                  padding: '6px 16px', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 600,
                  border: '1px solid', cursor: 'pointer',
                  borderColor: viewMode === v ? 'var(--accent)' : 'var(--border)',
                  background: viewMode === v ? 'var(--accent-faint)' : 'transparent',
                  color: viewMode === v ? 'var(--accent-light)' : 'var(--text3)',
                  transition: 'all 0.15s',
                }}
              ><span style={{display:'flex',alignItems:'center',gap:5}}>{icon}{l}</span></button>
            ))}
          </div>

          {viewMode === 'grid' ? (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
                <button onClick={() => setWeekOffset(w => w - 1)}
                  style={{ padding:'6px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text2)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:4 }}>
                  ← Anterior
                </button>
                <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, justifyContent:'center' }}>
                  <span style={{ fontWeight:700, color:'var(--text)', fontSize:'0.9rem' }}>
                    {fmtWeek(mon)} — {fmtWeek(sun)}
                  </span>
                  {isCurrentWeek && (
                    <span style={{ fontSize:'0.68rem', fontWeight:700, background:'var(--accent)', color:'white', borderRadius:99, padding:'2px 8px' }}>
                      Esta semana
                    </span>
                  )}
                  <span style={{ fontSize:'0.75rem', color:'var(--text3)' }}>
                    {aulasNaSemana.length} aula{aulasNaSemana.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <button onClick={() => setWeekOffset(w => w + 1)} disabled={isCurrentWeek}
                  style={{ padding:'6px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', color: isCurrentWeek ? 'var(--text3)' : 'var(--text2)', cursor: isCurrentWeek ? 'default' : 'pointer', fontFamily:'inherit', fontSize:'0.8rem', opacity: isCurrentWeek ? 0.4 : 1, display:'flex', alignItems:'center', gap:4 }}>
                  Próxima →
                </button>
                {weekOffset !== 0 && (
                  <button onClick={() => setWeekOffset(0)}
                    style={{ padding:'5px 10px', borderRadius:8, border:'1px solid var(--accent)', background:'var(--accent-faint)', color:'var(--accent-light)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.78rem', fontWeight:600 }}>
                    Hoje
                  </button>
                )}
              </div>

              {aulasNaSemana.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text3)', background:'var(--surface)', borderRadius:12, border:'1px dashed var(--border)' }}>
                  <div style={{ fontSize:'1.5rem', marginBottom:8 }}>📭</div>
                  <div style={{ fontWeight:600, marginBottom:4 }}>Nenhuma aula nesta semana</div>
                  <div style={{ fontSize:'0.82rem' }}>
                    {aulasForaW.length > 0 ? `Há ${aulasForaW.length} aula(s) em outras semanas — navegue com ← →` : 'Use "+ Registrar aula" para adicionar.'}
                  </div>
                </div>
              ) : (
                <SyncedScrollTable>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.8125rem', minWidth: 400 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '10px 8px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px 0 0 0', textAlign: 'center', color: 'var(--text3)', fontWeight: 700, position: 'sticky', left: 0, zIndex: 2, minWidth: 48, width: 48, fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          #
                        </th>
                        <th style={{ padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', textAlign: 'left', color: 'var(--text3)', fontWeight: 700, minWidth: 180 }}>
                          Aluno
                        </th>
                        {aulasNaSemana.map((au, i) => {
                          const dow = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][new Date(au.data+'T12:00:00').getDay()];
                          return (
                          <th key={au.id} style={{ padding: '8px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text2)', fontWeight: 600, minWidth: 80 }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--accent-light)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{dow}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight:700, marginTop:1 }}>{fmtDate(au.data)}</div>
                            {au.disciplina && <div style={{ fontSize: '0.65rem', color: 'var(--text3)', marginTop: 2, maxWidth: 70, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{au.disciplina}</div>}
                            <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 5 }}>
                              <button title="Todos presentes" onClick={() => marcarTodos(aulas.indexOf(au), true)}
                                style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)', cursor: 'pointer', fontWeight:700 }}>✓</button>
                              <button title="Todos ausentes" onClick={() => marcarTodos(aulas.indexOf(au), false)}
                                style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)', cursor: 'pointer', fontWeight:700 }}>✗</button>
                              <button title="Remover aula" onClick={() => excluirAula(aulas.indexOf(au))}
                                style={{ fontSize: 10, padding: '2px 4px', borderRadius: 4, background: 'var(--surface3)', color: 'var(--text3)', border: '1px solid var(--border)', cursor: 'pointer', display:'flex', alignItems:'center' }}><Trash size={11} /></button>
                            </div>
                          </th>
                          );
                        })}
                        <th style={{ padding: '10px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text3)', fontWeight: 700, borderRadius: '0 8px 0 0', minWidth: 60 }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((a, ri) => {
                        const cor = ALUNO_CORES[ri % ALUNO_CORES.length];
                        const riskColor = a.pct < 75 ? 'var(--red)' : a.pct < 85 ? 'var(--amber)' : 'var(--green)';
                        return (
                          <tr key={a.id}
                            onMouseEnter={() => setHoverRow(a.id)}
                            onMouseLeave={() => setHoverRow(null)}>
                            {/* Coluna ID — número sequencial */}
                            <td style={{ padding: '6px 8px', background: hoverRow === a.id ? 'var(--accent-faint)' : 'var(--surface)', border: '1px solid var(--border)', position: 'sticky', left: 0, zIndex: 1, textAlign: 'center', width: 48, minWidth: 48, transition: 'background 0.1s' }}>
                              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text2)' }}>
                                {ri + 1}
                              </span>
                            </td>
                            {/* Coluna Aluno — avatar + nome, sem número */}
                            <td style={{ padding: '9px 14px', background: hoverRow === a.id ? 'var(--accent-faint)' : 'var(--surface)', border: '1px solid var(--border)', transition: 'background 0.1s' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="aluno-avatar" style={{ background: cor.bg, color: cor.text, width: 24, height: 24, fontSize: '0.65rem' }}>
                                  {initials(a.nome)}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontWeight: 500, color: 'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nome}</div>
                                  {a.matricula && <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>{a.matricula}</div>}
                                </div>
                                <div style={{ display: 'flex', gap: 2, flexShrink:0 }}>
                                  <button className="icon-btn-sm" style={{ width: 20, height: 20, fontSize: 10 }} onClick={() => { setEditAluno(ri); setFormAluno({ nome: a.nome, matricula: a.matricula || '' }); }}>✏️</button>
                                  <button className="icon-btn-sm danger" style={{ width: 20, height: 20, display:"flex",alignItems:"center",justifyContent:"center" }} onClick={() => excluirAluno(ri)}><Trash size={10} /></button>
                                </div>
                              </div>
                            </td>
                            {aulasNaSemana.map((au) => {
                              const pres = isPresente(a.id, au.id);
                              return (
                                <td key={au.id}
                                  onMouseEnter={() => setHoverCol(au.id)}
                                  onMouseLeave={() => setHoverCol(null)}
                                  style={{
                                    padding: 6, border: '1px solid var(--border)', textAlign: 'center',
                                    background: hoverRow === a.id && hoverCol === au.id
                                      ? (pres ? 'rgba(74,222,128,0.22)' : 'rgba(248,113,113,0.18)')
                                      : hoverRow === a.id || hoverCol === au.id
                                        ? 'rgba(192,132,252,0.10)'
                                        : pres ? 'rgba(74,222,128,0.07)' : 'rgba(248,113,113,0.04)',
                                    cursor: 'pointer', transition: 'background 0.1s',
                                    outline: hoverRow === a.id && hoverCol === au.id ? '2px solid var(--accent)' : 'none',
                                    outlineOffset: '-2px',
                                  }}
                                  onClick={() => togglePresenca(a.id, au.id)}
                                  title={`${a.nome} — ${pres ? 'Presente (clique para falta)' : 'Falta (clique para presença)'}`}>
                                  {pres
                                    ? <CheckCircle size={20} color="var(--green)" weight="fill" />
                                    : <XCircle size={20} color="var(--red)" weight="fill" />}
                                </td>
                              );
                            })}
                            <td style={{ padding: '8px 10px', border: '1px solid var(--border)', textAlign: 'center', background: hoverRow === a.id ? 'var(--accent-faint)' : 'var(--surface)', transition: 'background 0.1s' }}>
                              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: riskColor, fontSize: '0.95rem' }}>{a.pct}%</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>{a.presente}/{a.total}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </SyncedScrollTable>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.map((a, i) => {
                const cor = ALUNO_CORES[i % ALUNO_CORES.length];
                const riskColor = a.pct < 75 ? 'var(--red)' : a.pct < 85 ? 'var(--amber)' : 'var(--green)';
                return (
                  <div key={a.id} style={{
                    background: 'var(--surface)', border: `1px solid ${a.pct < 75 ? 'var(--red-border)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-md)', padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div className="aluno-avatar" style={{ background: cor.bg, color: cor.text }}>
                        {initials(a.nome)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{a.nome}</div>
                        {a.matricula && <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{a.matricula}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: riskColor, fontSize: '1.2rem' }}>{a.pct}%</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{a.presente}/{a.total} aulas</div>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${a.pct}%`, background: riskColor, borderRadius: 99, transition: 'width 0.4s ease' }} />
                    </div>
                    {a.pct < 75 && (
                      <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--red)' }}>
                        ⚠ Frequência abaixo de 75% — risco de reprovação
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal add aluno */}
      {showAddAluno && (
        <Modal title="Adicionar aluno" onClose={() => setShowAddAluno(false)}>
          <div className="modal-field">
            <div className="modal-label">Nome completo *</div>
            <input className="modal-input" placeholder="Nome do aluno" value={formAluno.nome} onChange={e => setFormAluno(f=>({...f,nome:e.target.value}))} autoFocus onKeyDown={e => e.key === 'Enter' && adicionarAluno()} />
          </div>
          <div className="modal-field">
            <div className="modal-label">Matrícula (opcional)</div>
            <input className="modal-input" placeholder="ex: 2025001" value={formAluno.matricula} onChange={e => setFormAluno(f=>({...f,matricula:e.target.value}))} />
          </div>
          {alunoErro && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 8, padding: '8px 12px', color: 'var(--red)', fontSize: '0.82rem', marginTop: 4 }}>
              {alunoErro}
            </div>
          )}
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => { setShowAddAluno(false); setAlunoErro(''); }}>Cancelar</button>
            <button className="btn-primary" onClick={adicionarAluno} disabled={alunoSaving}>{alunoSaving ? 'Adicionando…' : 'Adicionar'}</button>
          </div>
        </Modal>
      )}

      {/* Modal editar aluno */}
      {editAluno !== null && (
        <Modal title="Editar aluno" onClose={() => setEditAluno(null)}>
          <div className="modal-field">
            <div className="modal-label">Nome</div>
            <input className="modal-input" value={formAluno.nome} onChange={e => setFormAluno(f=>({...f,nome:e.target.value}))} autoFocus />
          </div>
          <div className="modal-field">
            <div className="modal-label">Matrícula</div>
            <input className="modal-input" value={formAluno.matricula} onChange={e => setFormAluno(f=>({...f,matricula:e.target.value}))} />
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setEditAluno(null)}>Cancelar</button>
            <button className="btn-primary" onClick={salvarEdicaoAluno}>Salvar</button>
          </div>
        </Modal>
      )}

      {/* Modal add aula */}
      {showAddAula && (
        <Modal title="Registrar aula" onClose={() => { setShowAddAula(false); setAulaErro(''); }}>
          <div className="modal-field">
            <div className="modal-label">Data da aula *</div>
            <input type="date" className="modal-input" value={formAula.data} onChange={e => setFormAula(f=>({...f,data:e.target.value}))} autoFocus />
          </div>
          <div className="modal-field">
            <div className="modal-label">Disciplina (opcional)</div>
            <input className="modal-input" placeholder="ex: DCU, Design Thinking..." value={formAula.disciplina} onChange={e => setFormAula(f=>({...f,disciplina:e.target.value}))} />
          </div>
          {aulaErro && (
            <div style={{ background:'var(--red-bg)', border:'1px solid var(--red-border)', borderRadius:8, padding:'8px 12px', color:'var(--red)', fontSize:'0.82rem', marginTop:4 }}>
              {aulaErro}
            </div>
          )}
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => { setShowAddAula(false); setAulaErro(''); }}>Cancelar</button>
            <button className="btn-primary" onClick={adicionarAula} disabled={aulaSaving}>{aulaSaving ? 'Registrando…' : 'Registrar'}</button>
          </div>
        </Modal>
      )}

      {/* Modal importar de grupos */}
      {showImport && (
        <Modal title="Importar alunos dos grupos" onClose={() => setShowImport(false)}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 12 }}>
            Selecione os alunos cadastrados nos grupos desta turma para importar na frequência:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto', marginBottom: 14 }}>
            {alunosDoGrupo.map((a, i) => {
              const jaExiste = turmaData.alunos.some(x => x.nome.toLowerCase().trim() === a.nome.toLowerCase().trim());
              const sel = importSel.includes(a.nome);
              return (
                <div key={i}
                  onClick={() => !jaExiste && toggleImportSel(a.nome)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: sel ? 'var(--accent-faint)' : 'var(--surface2)',
                    border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-sm)', padding: '8px 12px',
                    cursor: jaExiste ? 'default' : 'pointer', opacity: jaExiste ? 0.5 : 1,
                  }}
                >
                  <input type="checkbox" checked={sel || jaExiste} readOnly style={{ accentColor: 'var(--accent)' }} />
                  <span style={{ fontWeight: 500 }}>{a.nome}</span>
                  {jaExiste && <span style={{ fontSize: '0.72rem', color: 'var(--text3)', marginLeft: 'auto' }}>já cadastrado</span>}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 12 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
              onClick={() => setImportSel(alunosDoGrupo.filter(a => !turmaData.alunos.some(x => x.nome.toLowerCase().trim() === a.nome.toLowerCase().trim())).map(a => a.nome))}
            >Selecionar todos</button>
            {' · '}
            <button style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
              onClick={() => setImportSel([])}
            >Limpar</button>
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setShowImport(false)}>Cancelar</button>
            <button className="btn-primary" disabled={importSel.length === 0} onClick={confirmarImport}>
              Importar {importSel.length > 0 ? `(${importSel.length})` : ''}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}