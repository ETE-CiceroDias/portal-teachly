// data/turmas.js — Configuração das turmas

export const TURMAS = {
  mod1a: {
    key: 'mod1a',
    label: 'Turma A',
    modulo: 'Módulo 1',
    dotClass: 'mod1a',
    cor: '#c084fc',
    ano: '2025',
    periodo: 'Março – Julho',
    disciplinas: ['dcu', 'dt', 'pi', 'prog'],
    hasDesafio: true,
  },
  mod1b: {
    key: 'mod1b',
    label: 'Turma B',
    modulo: 'Módulo 1',
    dotClass: 'mod1b',
    cor: '#e879f9',
    ano: '2025',
    periodo: 'Março – Julho',
    disciplinas: ['dcu', 'dt', 'pi', 'prog'],
    hasDesafio: true,
  },
  mod3: {
    key: 'mod3',
    label: 'Turma Única',
    modulo: 'Módulo 3',
    dotClass: 'mod3',
    cor: '#fbbf24',
    ano: '2025',
    periodo: 'Março – Julho',
    disciplinas: ['dim', 'prog3'],
    hasDesafio: false,
  },
};

// Disciplinas disponíveis por módulo
export const DISCIPLINAS_MOD1 = ['dcu', 'dt', 'pi', 'prog'];
export const DISCIPLINAS_MOD3 = ['dim', 'prog3'];

// Cores para grupos (avatars)
export const GRUPO_CORES = [
  { bg: 'rgba(192,132,252,0.2)',  text: '#c084fc' },
  { bg: 'rgba(232,121,249,0.2)',  text: '#e879f9' },
  { bg: 'rgba(251,191,36,0.2)',   text: '#fbbf24' },
  { bg: 'rgba(248,113,113,0.2)',  text: '#f87171' },
  { bg: 'rgba(74,222,128,0.2)',   text: '#4ade80' },
  { bg: 'rgba(96,165,250,0.2)',   text: '#60a5fa' },
];

// Cores para avatares de alunos
export const ALUNO_CORES = [
  { bg: 'rgba(192,132,252,0.18)', text: '#c084fc' },
  { bg: 'rgba(232,121,249,0.15)', text: '#e879f9' },
  { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24' },
  { bg: 'rgba(248,113,113,0.15)', text: '#f87171' },
  { bg: 'rgba(74,222,128,0.15)',  text: '#4ade80' },
  { bg: 'rgba(96,165,250,0.15)',  text: '#60a5fa' },
  { bg: 'rgba(251,146,60,0.15)',  text: '#fb923c' },
  { bg: 'rgba(45,212,191,0.15)',  text: '#2dd4bf' },
];
