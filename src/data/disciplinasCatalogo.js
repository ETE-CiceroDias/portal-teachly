// data/disciplinasCatalogo.js
// Catálogo oficial de disciplinas da ETE Cícero Dias
// Extraído da planilha de carga horária dos professores

export const CATALOGO_DG = [
  { nome: 'Computação Gráfica - Imagens e Vetores', sigla: 'CGIV', cor: '#c084fc' },
  { nome: 'Planejamento Visual',                    sigla: 'PLAV', cor: '#a855f7' },
  { nome: 'Projeto de Vida',                        sigla: 'PROJVIDA', cor: '#e879f9' },
  { nome: 'Eletiva II - EAD',                       sigla: 'ELE2', cor: '#818cf8' },
  { nome: 'Motion Design',                          sigla: 'MDS', cor: '#f472b6' },
  { nome: 'Projeto Integrador 3',                   sigla: 'PI3', cor: '#fb923c' },
  { nome: 'Técnicas Atualizadas em Design',         sigla: 'TEAT', cor: '#fbbf24' },
  { nome: 'Desenho e Ilustração',                   sigla: 'DSI', cor: '#60a5fa' },
  { nome: 'História do Design Gráfico',             sigla: 'HIDG', cor: '#34d399' },
  { nome: 'Projeto Integrador 1',                   sigla: 'PI1', cor: '#a78bfa' },
  { nome: 'Design Contemporâneo',                   sigla: 'DCT', cor: '#f87171' },
  { nome: 'Empreendedorismo e Inovação',            sigla: 'EI', cor: '#4ade80' },
  { nome: 'Mídias Digitais',                        sigla: 'MDG', cor: '#2dd4bf' },
  { nome: 'Projeto de Design - Identidade Visual e Sinalização', sigla: 'PDIS', cor: '#c084fc' },
  { nome: 'Atividades Complementares I',            sigla: 'AC1', cor: '#60a5fa' },
  { nome: 'Habilidades Socioemocionais e Comportamento Empreendedor', sigla: 'HSCEE', cor: '#fbbf24' },
  { nome: 'Atividades Complementares III',          sigla: 'AC3', cor: '#fb923c' },
];

export const CATALOGO_DS = [
  { nome: 'Projeto Integrador 1',                   sigla: 'PI1', cor: '#a78bfa' },
  { nome: 'Lógica e Pensamento Computacional',      sigla: 'LPC', cor: '#60a5fa' },
  { nome: 'Programação em Novas Tecnologias (Desktop)', sigla: 'PNTD', cor: '#34d399' },
  { nome: 'Administração de Bancos de Dados (Cloud)', sigla: 'ADBA', cor: '#818cf8' },
  { nome: 'Ética e Segurança da Informação',        sigla: 'ETSE', cor: '#f87171' },
  { nome: 'Atividades Complementares I',            sigla: 'AC1', cor: '#60a5fa' },
  { nome: 'Habilidades Socioemocionais e Comportamento Empreendedor', sigla: 'HSCEE', cor: '#fbbf24' },
  { nome: 'Atividades Complementares III',          sigla: 'AC3', cor: '#fb923c' },
  { nome: 'Design Centrado no Usuário',             sigla: 'DCU', cor: '#7c3aed' },
  { nome: 'Design Thinking',                        sigla: 'ATK', cor: '#c084fc' },
  { nome: 'Design de Interfaces Mobile',            sigla: 'DEIN', cor: '#e879f9' },
  { nome: 'Programação em Novas Tecnologias (Mobile)', sigla: 'PRONO', cor: '#f472b6' },
  { nome: 'Administração de Banco de Dados',        sigla: 'ABD', cor: '#34d399' },
  { nome: 'Programação em Novas Tecnologias (Desktop)', sigla: 'PNTD', cor: '#4ade80' },
  { nome: 'Projeto Integrador 3',                   sigla: 'PI3', cor: '#fb923c' },
  { nome: 'Empreendedorismo e Inovação',            sigla: 'EI', cor: '#2dd4bf' },
];

// Unificado e sem duplicatas — para quando área = 'ambos'
export const CATALOGO_TODOS = [
  ...CATALOGO_DS,
  ...CATALOGO_DG.filter(d => !CATALOGO_DS.some(x => x.sigla === d.sigla)),
];

// Por curso
export function getCatalogoByCurso(curso) {
  if (curso === 'DG') return CATALOGO_DG;
  if (curso === 'DS') return CATALOGO_DS;
  return CATALOGO_TODOS;
}

// Por área (onboarding)
export function getCatalogoByArea(area) {
  if (area === 'design') return CATALOGO_DG;
  if (area === 'ds')     return CATALOGO_DS;
  return CATALOGO_TODOS;
}