import { EmptyState } from '../components/EmptyState.jsx';
// pages/AtividadesProjetos.jsx
import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { ORG_ID } from '../data/ids.js';
import { TURMAS } from '../data/turmas.js';
import {
  Trash, PencilSimple, X, CalendarBlank,
  CheckCircle, Trophy, ArrowSquareOut, TextAlignLeft,
  ListChecks, Star, BookOpen, Lightbulb, LinkedinLogo
} from '@phosphor-icons/react';

const EMAIL_NOTIF = 'samarasilvia.educa@gmail.com';

const VITRINE_STORAGE_KEY = 'teachly_vitrine_config';
const VITRINE_DEFAULT_CONFIG = {
  titulo: '🎨 Vitrine UX/UI na Prática',
  pontos: '1',
  prazo: '',
  descricao: 'Análise crítica de um app real, redesign no Figma e publicação como estudo de caso no LinkedIn. Integra DCU e DT.',
  criterio1: 'Análise e Justificativa Teórica',
  peso1: '0,3 pt',
  criterio2: 'Qualidade da Solução e Prototipação',
  peso2: '0,4 pt',
  criterio3: 'Posicionamento e Estrutura do Post',
  peso3: '0,3 pt',
  hashtag: '#UXnaPraticaETECD',
};

const fmtDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const diffDays = (iso) => {
  if (!iso) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(iso + 'T00:00:00');
  return Math.round((target - today) / 86400000);
};

// ─── Projeto fixo: Vitrine UX/UI ────────────────────────────────
const VITRINE_ID = '__vitrine_ux__';
const VITRINE = {
  id: VITRINE_ID,
  tipo: 'projeto',
  titulo: '🎨 Vitrine UX/UI na Prática',
  descricao: 'Desafio extra que integra DCU e Design Thinking: os alunos analisam um app real, propõem um redesign no Figma e publicam um estudo de caso no LinkedIn. Vale 1 ponto extra.',
  imagem: '',
  link: '',
  turmas: [],
  prazo: '',
  aviso_dias: 3,
  notificado: false,
  __vitrine: true,
};

// ─── Conteúdo rico da Vitrine ───────────────────────────────────
function VitrineContent({ config = {} }) {
  const c = { ...VITRINE_DEFAULT_CONFIG, ...config };
  const passos = [
    {
      num: '01', titulo: 'A Escolha e o Olhar Crítico',
      sub: 'Análise UX/UI',
      desc: 'Escolha um aplicativo ou site real brasileiro que você usa no dia a dia e encontre uma oportunidade de melhoria. Pense como um Designer Centrado no Usuário:',
      items: [
        'Identifique a quebra de pelo menos uma das 10 Heurísticas de Nielsen (ex: H1 - visibilidade do status, H3 - controle do usuário, H8 - estética e minimalismo)',
        'Onde a jornada do usuário trava? A interface é confusa ou esteticamente poluída?',
        'Existe falha de affordance (o botão não parece clicável)?',
      ],
    },
    {
      num: '02', titulo: 'O Redesign',
      sub: 'Foco na Solução',
      desc: 'Use a empatia (pilar do DT) para entender por que esse problema frustra o usuário. Pense em uma solução focada na usabilidade e na experiência.',
      items: [],
    },
    {
      num: '03', titulo: 'A Mão na Massa',
      sub: 'Prototipação no Figma',
      desc: 'Crie um protótipo redesenhando apenas a tela ou o fluxo que você decidiu melhorar. Você não precisa fazer o app inteiro!',
      items: [
        'Mostre como sua solução seria implementada na prática',
        'Aplique boa hierarquia visual e contraste (Bloco 1 de DCU)',
        'Use o Figma, que já estamos trabalhando na disciplina de DT',
      ],
    },
    {
      num: '04', titulo: 'Posicionamento no Mercado',
      sub: 'LinkedIn',
      desc: 'Faça uma postagem profissional no LinkedIn apresentando o seu estudo de caso (o "antes" e o seu "depois"). Estrutura sugerida do post:',
      items: [
        '🎣 Gancho: "Como melhorar a experiência do usuário no [Nome do App]?"',
        '😣 O Problema: "Analisando o app, percebi uma quebra na heurística de [Nome]..."',
        '💡 A Solução: "Para resolver isso, desenvolvi um protótipo focado em..."',
        '🎓 O Contexto: Mencione DCU e DT do curso de Desenvolvimento de Sistemas da ETE Cícero Dias',
      ],
    },
  ];

  const rubrica = [
    {
      titulo: c.criterio1,
      valor: c.peso1,
      cor: '#60a5fa',
      pontua: 'O aluno identificou um problema real de interface e justificou tecnicamente — citando Heurísticas de Nielsen, falhas de affordance, hierarquia visual (Gestalt) ou problemas de contraste/acessibilidade.',
      zera: 'Justificativas baseadas em achismo ("achei feio") sem embasamento técnico de DCU.',
    },
    {
      titulo: c.criterio2,
      valor: c.peso2,
      cor: '#c084fc',
      pontua: 'O protótipo resolve de forma lógica e clara a dor apontada. A tela redesenhada tem nível de média/alta fidelidade com cuidado com espaçamento, alinhamento e hierarquia.',
      zera: 'O redesign não resolve o problema original, adiciona mais ruído visual (violando H8) ou foi feito de forma desleixada ignorando o que foi ensinado no Bloco 3 de DT.',
    },
    {
      titulo: c.criterio3,
      valor: c.peso3,
      cor: '#0a66c2',
      pontua: 'Texto engajador com lógica clara (Problema > Empatia/DT > Solução). Imagens claras (carrossel ou Antes/Depois). Hashtag ' + c.hashtag + ', @ETE Cícero Dias, professora e empresa marcados.',
      zera: 'Faltaram marcações/hashtag, erros graves de português ou imagem jogada sem contexto (sem storytelling).',
    },
  ];

  const checklist = [
    'Postou no LinkedIn dentro do prazo',
    'O texto explica claramente o problema (A dor) e a solução',
    'O protótipo no Figma apresenta melhoria real em relação ao original',
    `Usou a hashtag oficial: ${c.hashtag}`,
    'Marcou a ETE Cícero Dias, a professora e a empresa do app',
  ];

  const [checkState, setCheckState] = useState(checklist.map(() => false));
  const checked = checkState.filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Hero badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg, #c084fc18, #60a5fa10)', border: '1px solid #c084fc33', borderRadius: 14, padding: '16px 20px' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #c084fc, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Trophy size={22} color="white" weight="fill" />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#c084fc', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Desafio Extra · Vale 1,0 Ponto</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text2)', lineHeight: 1.5 }}>
            Integração de <strong style={{ color: 'var(--text)' }}>DCU</strong> e <strong style={{ color: 'var(--text)' }}>Design Thinking</strong> — análise crítica de um produto real, redesign no Figma e publicação no LinkedIn.
          </div>
        </div>
      </div>

      {/* Timing */}
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Lightbulb size={16} color="var(--amber)" weight="fill" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text2)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>Momento ideal para lançar:</strong> início do Bloco 3 (por volta de Junho/Julho). Nesse ponto eles já dominam as Heurísticas de Nielsen (DCU) e estão começando a usar o Figma (DT) — serve como aquecimento antes do protótipo final da ODS.
        </div>
      </div>

      {/* Passos */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14, color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase' }}>
          <BookOpen size={14} /> O Desafio Passo a Passo
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {passos.map((p) => (
            <div key={p.num} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: p.items.length || p.desc ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-faint)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-light)' }}>{p.num}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{p.titulo}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{p.sub}</div>
                </div>
              </div>
              {(p.desc || p.items.length > 0) && (
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.desc && <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text2)', lineHeight: 1.6 }}>{p.desc}</p>}
                  {p.items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--accent-light)', fontSize: '0.75rem', marginTop: 3, flexShrink: 0 }}>▸</span>
                      <span style={{ fontSize: '0.83rem', color: 'var(--text2)', lineHeight: 1.55 }}>{it}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Marcações obrigatórias */}
      <div style={{ background: 'rgba(10,102,194,0.06)', border: '1px solid rgba(10,102,194,0.2)', borderRadius: 12, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, color: '#0a66c2', fontSize: '0.75rem', fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase' }}>
          <LinkedinLogo size={14} weight="fill" /> Marcações Obrigatórias no Post
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            'Marque a empresa dona do app/site analisado',
            'Marque a escola: @ETE Cícero Dias',
            'Marque a professora no LinkedIn',
            'Hashtag oficial: #UXnaPraticaETECD',
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: '#0a66c2', fontSize: '0.8rem', flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: '0.84rem', color: 'var(--text2)' }}>{m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rubrica */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14, color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase' }}>
          <Star size={14} weight="fill" /> Rubrica de Avaliação Interna
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rubrica.map((r) => (
            <div key={r.titulo} style={{ background: 'var(--surface)', border: `1px solid ${r.cor}33`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: `${r.cor}0d`, borderBottom: `1px solid ${r.cor}22` }}>
                <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.88rem' }}>{r.titulo}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: r.cor, background: `${r.cor}22`, border: `1px solid ${r.cor}44`, borderRadius: 99, padding: '2px 10px' }}>{r.valor}</span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>✅ O que pontua</div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.6 }}>{r.pontua}</p>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--red)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>❌ O que zera</div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.6 }}>{r.zera}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dicas de correção rápida */}
      <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 12, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, color: 'var(--amber)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase' }}>
          <Lightbulb size={14} weight="fill" /> Dicas para Correção Rápida
        </div>
        <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--text2)' }}>Para não tomar muito o seu tempo, você pode corrigir de forma visual. Bateu o olho no LinkedIn:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            'Tem a hashtag e as marcações? → Sim = garante a base do critério 3',
            'O texto cita um conceito de aula (Heurística/Gestalt)? → Sim = garante o critério 1',
            'A imagem do redesign está nítida e faz sentido? → Sim = garante o critério 2',
          ].map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--amber)', flexShrink: 0, fontSize: '0.8rem', marginTop: 2 }}>💡</span>
              <span style={{ fontSize: '0.83rem', color: 'var(--text2)', lineHeight: 1.5 }}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Checklist interativo */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase' }}>
            <ListChecks size={14} /> Checklist de Avaliação
          </div>
          <span style={{ fontSize: '0.78rem', color: checked === checklist.length ? 'var(--green)' : 'var(--text3)', fontWeight: 700 }}>
            {checked}/{checklist.length} {checked === checklist.length ? '✅ Completo!' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {checklist.map((item, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: checkState[i] ? 'var(--green-bg)' : 'var(--surface)', border: `1px solid ${checkState[i] ? 'var(--green-border)' : 'var(--border)'}`, borderRadius: 10, transition: 'all 0.15s' }}>
              <input
                type="checkbox"
                checked={checkState[i]}
                onChange={() => setCheckState(s => s.map((v, j) => j === i ? !v : v))}
                style={{ width: 16, height: 16, accentColor: 'var(--green)', cursor: 'pointer', flexShrink: 0 }}
              />
              <span style={{ fontSize: '0.85rem', color: checkState[i] ? 'var(--green)' : 'var(--text2)', textDecoration: checkState[i] ? 'line-through' : 'none', transition: 'all 0.15s' }}>
                {item}
              </span>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Modal genérico ─────────────────────────────────────────────
function Modal({ title, onClose, children, wide, fullscreen }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={
          fullscreen
            ? { maxWidth: 820, width: '97vw', maxHeight: '94vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }
            : wide
            ? { maxWidth: 600, width: '95vw' }
            : {}
        }
        onClick={e => e.stopPropagation()}
      >
        {fullscreen ? (
          <>
            <div style={{ padding: '18px 26px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, borderRadius: 6, display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 26px 28px' }}>
              {children}
            </div>
          </>
        ) : (
          <>
            <div className="modal-title">{title}</div>
            {children}
          </>
        )}
      </div>
    </div>
  );
}

const TIPOS = [
  { value: 'atividade', label: '📝 Atividade', cor: '#60a5fa' },
  { value: 'projeto',   label: '🚀 Projeto',   cor: '#c084fc' },
  { value: 'prova',     label: '📊 Prova/Avaliação', cor: '#f87171' },
  { value: 'entrega',   label: '📦 Entrega',   cor: '#fbbf24' },
];

const DEFAULT_FORM = {
  titulo: '', tipo: 'atividade', descricao: '', imagem: '', link: '',
  turmas: [], prazo: '', aviso_dias: 3, notificado: false,
};

// ─── Modal de detalhes da Vitrine ───────────────────────────────
function VitrineModal({ onClose }) {
  const [editando, setEditando] = useState(false);
  const [config, setConfig] = useState(() => {
    try {
      const s = localStorage.getItem(VITRINE_STORAGE_KEY);
      return s ? { ...VITRINE_DEFAULT_CONFIG, ...JSON.parse(s) } : VITRINE_DEFAULT_CONFIG;
    } catch { return VITRINE_DEFAULT_CONFIG; }
  });
  const [form, setForm] = useState(config);

  const salvarConfig = () => {
    setConfig(form);
    try { localStorage.setItem(VITRINE_STORAGE_KEY, JSON.stringify(form)); } catch {}
    setEditando(false);
  };

  const inputStyle = { width: '100%', padding: '7px 11px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };

  return (
    <Modal title="" onClose={onClose} fullscreen>
      <div style={{ margin: '0 -26px 22px', height: 6, background: 'linear-gradient(90deg, #c084fc, #818cf888)' }} />

      {/* Header com botão editar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: '0.72rem', background: '#c084fc22', color: '#c084fc', border: '1px solid #c084fc44', borderRadius: 99, padding: '3px 10px', fontWeight: 700 }}>🚀 Projeto</span>
            <span style={{ fontSize: '0.72rem', background: 'rgba(251,191,36,0.1)', color: 'var(--amber)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 99, padding: '3px 10px', fontWeight: 700 }}>⭐ Desafio Extra · {config.pontos} Ponto{config.pontos !== '1' ? 's' : ''}</span>
            {config.prazo && <span style={{ fontSize: '0.72rem', background: 'var(--surface2)', color: 'var(--text3)', border: '1px solid var(--border)', borderRadius: 99, padding: '3px 10px' }}>📅 {fmtDate(config.prazo)}</span>}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.2 }}>
            {config.titulo}
          </h2>
        </div>
        <button onClick={() => { setForm(config); setEditando(true); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
          <PencilSimple size={13} /> Editar
        </button>
      </div>

      {/* Modal de edição */}
      {editando && (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', marginBottom: 24 }}>
          <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 14, fontSize: '0.9rem' }}>✏️ Editar configurações da Vitrine</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10 }}>
              <div>
                <div className="modal-label">Título</div>
                <input style={inputStyle} value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
              </div>
              <div>
                <div className="modal-label">Pontos extras</div>
                <input style={{ ...inputStyle, width: 70 }} value={form.pontos} onChange={e => setForm(f => ({ ...f, pontos: e.target.value }))} placeholder="1" />
              </div>
              <div>
                <div className="modal-label">Prazo</div>
                <input type="date" style={{ ...inputStyle, width: 140 }} value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} />
              </div>
            </div>
            <div>
              <div className="modal-label">Descrição curta (aparece no card)</div>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div>
              <div className="modal-label" style={{ marginBottom: 8 }}>Critérios da Rubrica</div>
              {[1,2,3].map(i => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 8, marginBottom: 8 }}>
                  <input style={inputStyle} placeholder={`Nome do Critério ${i}`} value={form[`criterio${i}`]} onChange={e => setForm(f => ({ ...f, [`criterio${i}`]: e.target.value }))} />
                  <input style={inputStyle} placeholder="Peso (ex: 0,3 pt)" value={form[`peso${i}`]} onChange={e => setForm(f => ({ ...f, [`peso${i}`]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div>
              <div className="modal-label">Hashtag oficial</div>
              <input style={inputStyle} value={form.hashtag} onChange={e => setForm(f => ({ ...f, hashtag: e.target.value }))} placeholder="#UXnaPraticaETECD" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn-primary" onClick={salvarConfig}>Salvar</button>
            <button className="btn-ghost" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <VitrineContent config={config} />
    </Modal>
  );
}

// ─── Modal de detalhes genérico ─────────────────────────────────
function DetailModal({ item, onClose, onEdit, onDelete, buildMailto }) {
  const tipoInfo = (t) => TIPOS.find(x => x.value === t) || TIPOS[0];
  const tp = tipoInfo(item.tipo);
  const d = diffDays(item.prazo);
  const urgente = d !== null && d <= (item.aviso_dias || 3) && d >= 0;
  const vencido = d !== null && d < 0;
  const prazoColor = d === null ? 'var(--text3)' : d < 0 ? 'var(--text3)' : d <= 3 ? 'var(--red)' : d <= 7 ? 'var(--amber)' : 'var(--text2)';
  const prazoLabel = d === null ? '' : d < 0 ? `vencido há ${Math.abs(d)}d` : d === 0 ? 'hoje!' : `em ${d}d`;

  return (
    <Modal title="" onClose={onClose} fullscreen>
      {item.imagem ? (
        <div style={{ margin: '0 -26px 22px', height: 200, overflow: 'hidden' }}>
          <img src={item.imagem} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ) : (
        <div style={{ margin: '0 -26px 22px', height: 6, background: `linear-gradient(90deg, ${tp.cor}cc, ${tp.cor}33)` }} />
      )}

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ fontSize: '0.72rem', background: `${tp.cor}22`, color: tp.cor, border: `1px solid ${tp.cor}44`, borderRadius: 99, padding: '3px 10px', fontWeight: 700 }}>{tp.label}</span>
        {urgente && <span style={{ fontSize: '0.72rem', background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)', borderRadius: 99, padding: '3px 10px', fontWeight: 700 }}>🔔 Urgente</span>}
        {vencido && <span style={{ fontSize: '0.72rem', background: 'rgba(100,80,120,0.12)', color: 'var(--text3)', border: '1px solid var(--border)', borderRadius: 99, padding: '3px 10px' }}>Encerrado</span>}
        {(item.turmas || []).map(tk => {
          const t = TURMAS[tk];
          return t ? <span key={tk} style={{ fontSize: '0.72rem', background: 'var(--surface3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 99, padding: '3px 10px' }}>{t.modulo} · {t.label}</span> : null;
        })}
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 12px', lineHeight: 1.25 }}>{item.titulo}</h2>

      {item.prazo && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px' }}>
          <CalendarBlank size={14} color={prazoColor} />
          <span style={{ fontSize: '0.875rem', color: prazoColor, fontWeight: 600 }}>{fmtDate(item.prazo)}</span>
          {prazoLabel && <span style={{ fontSize: '0.75rem', color: d <= 3 && d >= 0 ? 'var(--red)' : 'var(--text3)', background: d <= 3 && d >= 0 ? 'var(--red-bg)' : 'var(--surface3)', border: `1px solid ${d <= 3 && d >= 0 ? 'var(--red-border)' : 'var(--border)'}`, borderRadius: 99, padding: '1px 8px', fontWeight: 600 }}>({prazoLabel})</span>}
        </div>
      )}

      {item.descricao && (
        <>
          <div style={{ height: 1, background: 'var(--border)', margin: '0 0 18px' }} />
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
              <TextAlignLeft size={13} /> Descrição
            </div>
            <p style={{ color: 'var(--text2)', fontSize: '0.9rem', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{item.descricao}</p>
          </div>
        </>
      )}

      {item.link && (
        <>
          <div style={{ height: 1, background: 'var(--border)', margin: '0 0 18px' }} />
          <a href={item.link} target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent-faint)', border: '1px solid var(--accent)', color: 'var(--accent-light)', padding: '10px 18px', borderRadius: 10, fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', marginBottom: 22 }}>
            <ArrowSquareOut size={15} /> Abrir slide / material
          </a>
        </>
      )}

      <div style={{ height: 1, background: 'var(--border)', margin: '8px 0 20px' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onDelete(item.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, border: '1px solid var(--red-border)', background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            <Trash size={13} /> Excluir
          </button>
          <button onClick={() => onEdit(item)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            <PencilSimple size={13} /> Editar
          </button>
        </div>
        <a href={buildMailto(item)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-faint)', border: '1px solid var(--accent)', color: 'var(--accent-light)', padding: '7px 16px', borderRadius: 9, fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
          📧 Enviar lembrete por email
        </a>
      </div>
    </Modal>
  );
}

// ─── Página principal ──────────────────────────────────────────
export function AtividadesProjetos() {
  const [items, setItems] = useState([]);
  const [showVitrine, setShowVitrine] = useState(false);

  useEffect(() => {
    supabase.from('atividades').select('*').order('prazo')
      .then(({ data }) => setItems(data || []));
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]   = useState(null);
  const [form, setForm]       = useState(DEFAULT_FORM);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroTurma, setFiltroTurma] = useState('todas');
  const [viewId, setViewId]   = useState(null);

  const openNew = () => { setEditId(null); setForm(DEFAULT_FORM); setShowForm(true); };
  const openEdit = (item) => { setEditId(item.id); setForm({ ...item }); setShowForm(true); setViewId(null); };

  const salvar = async () => {
    if (!form.titulo.trim()) return;
    if (editId) {
      await supabase.from('atividades').update(form).eq('id', editId);
      setItems(its => its.map(i => i.id === editId ? { ...form, id: editId } : i));
    } else {
      const { data: saved } = await supabase.from('atividades')
        .insert({ ...form, organizacao_id: ORG_ID }).select().single();
      if (saved) setItems(its => [...its, saved]);
    }
    setShowForm(false);
  };

  const excluir = (id) => {
    if (!confirm('Excluir este item?')) return;
    setItems(its => its.filter(i => i.id !== id));
    setViewId(null);
    supabase.from('atividades').delete().eq('id', id);
  };

  const toggleTurma = (tk) => {
    setForm(f => ({ ...f, turmas: f.turmas.includes(tk) ? f.turmas.filter(t => t !== tk) : [...f.turmas, tk] }));
  };

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (filtroTipo !== 'todos' && i.tipo !== filtroTipo) return false;
      if (filtroTurma !== 'todas' && !i.turmas?.includes(filtroTurma)) return false;
      return true;
    }).sort((a, b) => {
      if (!a.prazo && !b.prazo) return 0;
      if (!a.prazo) return 1;
      if (!b.prazo) return -1;
      return a.prazo.localeCompare(b.prazo);
    });
  }, [items, filtroTipo, filtroTurma]);

  const alertas = useMemo(() => items.filter(i => {
    if (!i.prazo) return false;
    const d = diffDays(i.prazo);
    return d !== null && d >= 0 && d <= (i.aviso_dias || 3) && !i.notificado;
  }), [items]);

  const buildMailto = (item) => {
    const prazoFmt = fmtDate(item.prazo);
    const turmasStr = (item.turmas || []).map(t => TURMAS[t]?.label || t).join(', ') || 'Todas';
    const subject = encodeURIComponent(`[Teachly] Lembrete: ${item.titulo} — Prazo ${prazoFmt}`);
    const body = encodeURIComponent(`Olá Samara! 👋\n\nLembrete automático do Teachly:\n\n📌 ${item.titulo}\n📋 Tipo: ${TIPOS.find(t => t.value === item.tipo)?.label || item.tipo}\n👥 Turmas: ${turmasStr}\n📅 Prazo: ${prazoFmt}\n\n${item.descricao ? `Descrição:\n${item.descricao}\n\n` : ''}${item.link ? `🔗 Link: ${item.link}\n\n` : ''}—\nEnviado via Teachly · ETE Cícero Dias`);
    return `mailto:${EMAIL_NOTIF}?subject=${subject}&body=${body}`;
  };

  const marcarNotificado = (id) => setItems(its => its.map(i => i.id === id ? { ...i, notificado: true } : i));

  const viewItem = viewId ? items.find(i => i.id === viewId) : null;
  const tipoInfo = (t) => TIPOS.find(x => x.value === t) || TIPOS[0];

  // Mostrar o card da Vitrine só quando filtro não bloqueia
  const showVitrineCard = filtroTipo === 'todos' || filtroTipo === 'projeto';

  return (
    <div className="anim-up">
      <div className="page-header">
        <div>
          <div className="page-title">Atividades & Projetos</div>
          <div className="page-subtitle">Cadastre, organize e acompanhe prazos com lembretes por email</div>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nova atividade</button>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alertas.map(item => {
            const d = diffDays(item.prazo);
            return (
              <div key={item.id} style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid var(--red-border)', borderRadius: 'var(--r-md)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 20 }}>🔔</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: 'var(--red)' }}>{item.titulo}</span>
                  <span style={{ color: 'var(--text3)', fontSize: '0.8rem', marginLeft: 8 }}>— prazo em {d === 0 ? 'hoje!' : `${d} dia${d > 1 ? 's' : ''}`} ({fmtDate(item.prazo)})</span>
                </div>
                <a href={buildMailto(item)} style={{ background: 'var(--accent-faint)', border: '1px solid var(--accent)', color: 'var(--accent-light)', padding: '5px 12px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  📧 Enviar lembrete por email
                </a>
                <button onClick={() => marcarNotificado(item.id)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', padding: '5px 10px', borderRadius: 99, fontSize: '0.75rem', cursor: 'pointer' }}>
                  ✓ Dispensar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--r-sm)', padding: '6px 12px', fontSize: '0.8125rem', cursor: 'pointer' }}>
          <option value="todos">Todos os tipos</option>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filtroTurma} onChange={e => setFiltroTurma(e.target.value)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--r-sm)', padding: '6px 12px', fontSize: '0.8125rem', cursor: 'pointer' }}>
          <option value="todas">Todas as turmas</option>
          {Object.values(TURMAS).map(t => <option key={t.key} value={t.key}>{t.modulo} · {t.label}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text3)', display: 'flex', alignItems: 'center' }}>
          {filtered.length + (showVitrineCard ? 1 : 0)} item{(filtered.length + (showVitrineCard ? 1 : 0)) !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14 }}>

        {/* Card fixo: Vitrine UX/UI */}
        {showVitrineCard && (
          <div
            onClick={() => setShowVitrine(true)}
            style={{
              background: 'var(--surface)',
              border: '1px solid #c084fc44',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'border-color 0.15s, transform 0.12s, box-shadow 0.15s',
              display: 'flex',
              flexDirection: 'column',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = '#c084fc'; e.currentTarget.style.boxShadow = '0 8px 24px #c084fc22'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#c084fc44'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ height: 4, background: 'linear-gradient(90deg, #c084fc, #818cf8)', flexShrink: 0 }} />
            <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: '0.7rem', background: '#c084fc22', color: '#c084fc', border: '1px solid #c084fc44', borderRadius: 99, padding: '2px 8px', fontWeight: 700 }}>🚀 Projeto</span>
                <span style={{ fontSize: '0.7rem', background: 'rgba(251,191,36,0.1)', color: 'var(--amber)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 99, padding: '2px 8px', fontWeight: 700 }}>⭐ +1 Ponto</span>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 5, lineHeight: 1.3, fontSize: '0.95rem' }}>
                🎨 Vitrine UX/UI na Prática
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.55 }}>
                Análise crítica de um app real, redesign no Figma e publicação como estudo de caso no LinkedIn. Integra DCU e DT.
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', background: 'var(--surface3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 99, padding: '1px 7px' }}>DCU</span>
                <span style={{ fontSize: '0.7rem', background: 'var(--surface3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 99, padding: '1px 7px' }}>Design Thinking</span>
                <span style={{ fontSize: '0.7rem', background: 'var(--surface3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 99, padding: '1px 7px' }}>Figma</span>
                <span style={{ fontSize: '0.7rem', background: 'var(--surface3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 99, padding: '1px 7px' }}>LinkedIn</span>
              </div>
            </div>
            <div style={{ padding: '9px 16px', borderTop: '1px solid #c084fc22', background: 'linear-gradient(90deg, #c084fc08, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 600 }}>Ver rubrica e passos</span>
              <ArrowSquareOut size={13} color="#c084fc" />
            </div>
          </div>
        )}

        {/* Cards das atividades */}
        {filtered.map(item => {
          const tp = tipoInfo(item.tipo);
          const d = diffDays(item.prazo);
          const urgente = d !== null && d <= (item.aviso_dias || 3) && d >= 0;
          const vencido = d !== null && d < 0;
          return (
            <div
              key={item.id}
              onClick={() => setViewId(item.id)}
              style={{
                background: 'var(--surface)',
                border: `1px solid ${urgente ? 'var(--red-border)' : vencido ? 'rgba(120,100,150,0.3)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color 0.15s, transform 0.12s, box-shadow 0.15s',
                opacity: vencido ? 0.65 : 1,
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = tp.cor + '88'; e.currentTarget.style.boxShadow = `0 8px 24px ${tp.cor}22`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = urgente ? 'var(--red-border)' : vencido ? 'rgba(120,100,150,0.3)' : 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ height: 4, background: `linear-gradient(90deg, ${tp.cor}, ${tp.cor}44)`, flexShrink: 0 }} />
              {item.imagem && <img src={item.imagem} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block', flexShrink: 0 }} />}
              <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', background: `${tp.cor}22`, color: tp.cor, border: `1px solid ${tp.cor}44`, borderRadius: 99, padding: '2px 8px', fontWeight: 700, whiteSpace: 'nowrap' }}>{tp.label}</span>
                  {urgente && <span style={{ fontSize: '0.7rem', background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)', borderRadius: 99, padding: '2px 8px', fontWeight: 700 }}>🔔 Urgente</span>}
                  {vencido && <span style={{ fontSize: '0.7rem', background: 'rgba(100,80,120,0.15)', color: 'var(--text3)', border: '1px solid var(--border)', borderRadius: 99, padding: '2px 8px' }}>Encerrado</span>}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 5, lineHeight: 1.3, fontSize: '0.95rem' }}>{item.titulo}</div>
                {item.descricao && <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.55 }}>{item.descricao}</div>}
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                  {(item.turmas || []).map(tk => { const t = TURMAS[tk]; return t ? <span key={tk} style={{ fontSize: '0.7rem', background: 'var(--surface3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 99, padding: '1px 7px' }}>{t.modulo} · {t.label}</span> : null; })}
                </div>
                {item.prazo && (
                  <div style={{ fontSize: '0.78rem', color: d < 0 ? 'var(--text3)' : d <= 3 ? 'var(--red)' : d <= 7 ? 'var(--amber)' : 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CalendarBlank size={12} />
                    {fmtDate(item.prazo)}
                    {d !== null && d >= 0 && <span>({d === 0 ? 'hoje' : `${d}d`})</span>}
                    {d !== null && d < 0 && <span>(vencido)</span>}
                  </div>
                )}
              </div>
              <div style={{ padding: '9px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>Ver detalhes</span>
                <ArrowSquareOut size={13} color="var(--text3)" />
              </div>
            </div>
          );
        })}

        {/* Empty state se não tem nada */}
        {filtered.length === 0 && !showVitrineCard && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0' }}>
            <EmptyState icon="📋" title="Nenhuma atividade cadastrada"
              desc="Crie atividades, projetos, provas e entregas para acompanhar os prazos das suas turmas."
              action="+ Criar primeira atividade" onAction={openNew} />
          </div>
        )}
      </div>

      {/* Modal da Vitrine */}
      {showVitrine && <VitrineModal onClose={() => setShowVitrine(false)} />}

      {/* Modal detalhes genérico */}
      {viewItem && (
        <DetailModal item={viewItem} onClose={() => setViewId(null)} onEdit={openEdit} onDelete={excluir} buildMailto={buildMailto} />
      )}

      {/* Modal Formulário */}
      {showForm && (
        <Modal title={editId ? 'Editar atividade' : 'Nova atividade'} onClose={() => setShowForm(false)} wide>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="modal-field">
              <div className="modal-label">Título *</div>
              <input className="modal-input" placeholder="Ex: Entrega do Projeto Final" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} autoFocus />
            </div>
            <div className="modal-field">
              <div className="modal-label">Tipo</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TIPOS.map(t => (
                  <button key={t.value} onClick={() => setForm(f => ({ ...f, tipo: t.value }))}
                    style={{ padding: '5px 12px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600, border: `1px solid ${form.tipo === t.value ? t.cor : 'var(--border)'}`, background: form.tipo === t.value ? `${t.cor}22` : 'transparent', color: form.tipo === t.value ? t.cor : 'var(--text3)', cursor: 'pointer' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-field">
              <div className="modal-label">Descrição</div>
              <textarea className="modal-input" rows={3} style={{ resize: 'vertical' }} placeholder="Descreva os objetivos, critérios de avaliação..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="modal-field">
                <div className="modal-label">Link de slide/material</div>
                <input className="modal-input" placeholder="https://..." value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
              </div>
              <div className="modal-field">
                <div className="modal-label">URL da imagem (opcional)</div>
                <input className="modal-input" placeholder="https://..." value={form.imagem} onChange={e => setForm(f => ({ ...f, imagem: e.target.value }))} />
              </div>
            </div>
            <div className="modal-field">
              <div className="modal-label">Turmas</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.values(TURMAS).map(t => (
                  <button key={t.key} onClick={() => toggleTurma(t.key)}
                    style={{ padding: '6px 14px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600, border: `1px solid ${form.turmas?.includes(t.key) ? 'var(--accent)' : 'var(--border)'}`, background: form.turmas?.includes(t.key) ? 'var(--accent-faint)' : 'transparent', color: form.turmas?.includes(t.key) ? 'var(--accent-light)' : 'var(--text3)', cursor: 'pointer' }}>
                    {t.modulo} · {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="modal-field">
                <div className="modal-label">Prazo</div>
                <input type="date" className="modal-input" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} />
              </div>
              <div className="modal-field">
                <div className="modal-label">Avisar com antecedência (dias)</div>
                <input type="number" className="modal-input" min={1} max={30} value={form.aviso_dias} onChange={e => setForm(f => ({ ...f, aviso_dias: Number(e.target.value), notificado: false }))} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="btn-primary" onClick={salvar}>{editId ? 'Salvar' : 'Criar'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
