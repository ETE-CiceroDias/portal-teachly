// store/OrgContext.jsx
// Contexto global que carrega org, turmas e disciplinas do banco.
// Substitui os imports de TURMAS e COURSES hardcoded nas páginas.
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { COURSES } from '../data/courses.js'; // ainda usado para blocos de aula

const OrgCtx = createContext(null);

export function useOrg() {
  const ctx = useContext(OrgCtx);
  if (!ctx) throw new Error('useOrg deve ser usado dentro de OrgProvider');
  return ctx;
}

export function OrgProvider({ user, children }) {
  const [org,       setOrg]       = useState(null);   // organização ativa
  const [turmas,    setTurmas]    = useState([]);      // [{id, key, label, modulo, cor, periodo, ano, hasDesafio, disciplinas:[...]}]
  const [loading,   setLoading]   = useState(true);
  const [pronto,    setPronto]    = useState(false);   // false = precisa de onboarding

  const reload = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    // 1. Busca organização do professor
    const { data: membro } = await supabase
      .from('membros_organizacao')
      .select('organizacao_id, papel')
      .eq('usuario_id', user.id)
      .maybeSingle();

    if (!membro) { setLoading(false); setPronto(false); return; }

    const { data: orgData } = await supabase
      .from('organizacoes')
      .select('*')
      .eq('id', membro.organizacao_id)
      .maybeSingle();

    setOrg(orgData);

    // 2. Busca turmas com suas disciplinas (apenas do professor logado)
    const { data: turmasData } = await supabase
    .from('turmas')
    .select('*, disciplinas!disciplinas_turma_id_fkey(*)')
    .eq('organizacao_id', membro.organizacao_id)
    .eq('professor_id', user.id)
    .order('criado_em');

    // Normaliza para o formato que o app usa
    const normalized = (turmasData || []).map(t => ({
      id:          t.id,
      key:         t.key || t.id,          // key curta (mod1a) ou UUID
      label:       t.label,
      modulo:      t.modulo,
      cor:         t.cor || '#7c3aed',
      periodo:     t.periodo || '',
      ano:         t.ano || '',
      hasDesafio:  t.has_desafio ?? false,
      dotClass:    t.dot_class || '',
      disciplinas: (t.disciplinas || []).map(d => {
          const found = Object.values(COURSES).find(cc =>
            (d.codigo && cc.code === d.codigo) ||
            (d.nome && cc.fullname?.toLowerCase() === d.nome?.toLowerCase())
          );
          const discKey = (d.key && COURSES[d.key]) ? d.key : (found?.key || d.key || d.id);
          return {
            id:       d.id,
            key:      discKey,
            label:    d.nome,
            fullname: d.nome,
            code:     d.codigo || '',
            cor:      d.cor_destaque || '#7c3aed',
            ativa:    d.ativa !== false,
            blocos:   d.blocos?.length ? d.blocos : (COURSES[discKey]?.blocos || []),
          };
        }),
    }));

    setTurmas(normalized);
    setPronto(!!orgData); // pronto se tem org, mesmo sem turmas ainda
    setLoading(false);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  // Helpers que o app inteiro usa
  const getTurma    = (keyOrId) => turmas.find(t => t.key === keyOrId || t.id === keyOrId);
  const getDiscs    = (turmaKey) => getTurma(turmaKey)?.disciplinas || [];
  const getAllDiscs  = () => turmas.flatMap(t => t.disciplinas);

  return (
    <OrgCtx.Provider value={{ org, turmas, loading, pronto, reload, getTurma, getDiscs, getAllDiscs }}>
      {children}
    </OrgCtx.Provider>
  );
}