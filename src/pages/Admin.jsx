// pages/Admin.jsx — Painel Administrativo Teachly
import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { TURMAS } from '../data/turmas.js';
import { TURMA_IDS } from '../data/ids.js';
import { COURSES } from '../data/courses.js';
import { useOrg } from '../store/OrgContext.jsx';
import { FloppyDisk, ArrowCounterClockwise, FileArrowUp, FileArrowDown, Table, CalendarBlank, BookOpen, Pencil, Trash, Plus, CheckCircle, XCircle, Info } from '@phosphor-icons/react';

const TURMA_LABEL = { mod1a:'Turma A', mod1b:'Turma B', mod3:'Turma Única' };
const hoje = () => new Date().toISOString().slice(0,10);

function download(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function jsonBlob(data) { return new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); }
function csvBlob(rows, headers) {
  const esc = v => { if(v==null)return''; const s=String(v).replace(/"/g,'""'); return s.includes(',')||s.includes('\n')||s.includes('"')?`"${s}"`:s; };
  return new Blob(['\uFEFF'+[headers.join(','),...rows.map(r=>headers.map(h=>esc(r[h])).join(','))].join('\n')],{type:'text/csv;charset=utf-8'});
}
function printPDF(html, titulo) {
  const w = window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${titulo}</title><style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;padding:40px;color:#1a0f2e;background:white}
    h1{font-size:1.4rem;margin-bottom:4px;color:#4c1d95}.meta{font-size:0.78rem;color:#6b7280;margin-bottom:24px}
    h2{font-size:1rem;margin:20px 0 10px;color:#4c1d95;border-bottom:1px solid #e5e7eb;padding-bottom:6px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:0.82rem}
    th{background:#f3f0ff;padding:8px 10px;text-align:left;font-weight:700;color:#4c1d95;border:1px solid #ddd6fe}
    td{padding:7px 10px;border:1px solid #e5e7eb}tr:nth-child(even) td{background:#faf5ff}
    .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:0.72rem;font-weight:700}
    .pres{background:#dcfce7;color:#166534}.ause{background:#fee2e2;color:#991b1b}
    @media print{body{padding:20px}}
  </style></head><body>${html}<script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`);
  w.document.close();
}

// ─── UI primitivos ─────────────────────────────────────────────
function Section({ icon, title, subtitle, children, accent='#7c3aed' }) {
  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden',marginBottom:16}}>
      <div style={{padding:'18px 24px',borderBottom:'1px solid var(--border)',background:`linear-gradient(90deg,${accent}10,transparent)`,display:'flex',alignItems:'center',gap:14}}>
        <div style={{width:40,height:40,borderRadius:10,flexShrink:0,background:`${accent}20`,border:`1px solid ${accent}40`,display:'flex',alignItems:'center',justifyContent:'center',color:accent}}>{icon}</div>
        <div>
          <div style={{fontWeight:700,color:'var(--text)',fontSize:'0.9375rem'}}>{title}</div>
          {subtitle&&<div style={{fontSize:'0.78rem',color:'var(--text3)',marginTop:2}}>{subtitle}</div>}
        </div>
      </div>
      <div style={{padding:'20px 24px'}}>{children}</div>
    </div>
  );
}

function Btn({ onClick, children, variant='primary', disabled, loading, accent='#7c3aed' }) {
  const base = {padding:'9px 18px',borderRadius:10,cursor:disabled||loading?'not-allowed':'pointer',fontWeight:700,fontSize:'0.83rem',display:'inline-flex',alignItems:'center',gap:6,opacity:disabled||loading?0.5:1,transition:'all 0.15s',border:'none',fontFamily:'inherit'};
  if (variant==='primary') return <button disabled={disabled||loading} onClick={onClick} style={{...base,background:`linear-gradient(135deg,${accent},${accent}cc)`,color:'white',boxShadow:`0 4px 14px ${accent}30`}}>{loading?'…':children}</button>;
  return <button disabled={disabled||loading} onClick={onClick} style={{...base,background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text2)'}}>{loading?'…':children}</button>;
}

// Upload via <label> nativo — não depende de ref.current.click()
function UploadBtn({ id, loading: isLoading, accent='#7c3aed', children }) {
  return (
    <label htmlFor={id} style={{
      display:'inline-flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:10,
      cursor:isLoading?'not-allowed':'pointer',fontWeight:700,fontSize:'0.83rem',fontFamily:'inherit',
      background:`linear-gradient(135deg,${accent},${accent}cc)`,color:'white',
      boxShadow:`0 4px 14px ${accent}30`,opacity:isLoading?0.5:1,
      pointerEvents:isLoading?'none':'auto',transition:'all 0.15s',
    }}>{isLoading?'⏳':children}</label>
  );
}

function Log({ entries }) {
  if (!entries.length) return null;
  return (
    <div style={{marginTop:14,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 16px',maxHeight:200,overflowY:'auto'}}>
      {entries.map((e,i)=>(
        <div key={i} style={{fontSize:'0.75rem',fontFamily:'monospace',padding:'2px 0',color:e.type==='ok'?'var(--green)':e.type==='err'?'var(--red)':'var(--accent)',display:'flex',alignItems:'center',gap:6}}>
          {e.type==='ok' ? <CheckCircle size={12} weight="fill" /> : e.type==='err' ? <XCircle size={12} weight="fill" /> : <Info size={12} />}
          {e.msg}
        </div>
      ))}
    </div>
  );
}

// ─── ExportPanel ───────────────────────────────────────────────
function ExportPanel() {
  const [turma,setTurma]=useState('mod1a');
  const [loading,setLoading]=useState({});
  const [log,setLog]=useState([]);
  const addLog=(msg,type='info')=>setLog(l=>[...l,{msg,type}]);
  const setL=(k,v)=>setLoading(p=>({...p,[k]:v}));

  async function fetchAll() {
    const tid=TURMA_IDS[turma];
    const [{data:alunos},{data:aulas},{data:pres},{data:grupos},{data:ativs},{data:eventos},{data:desafio},{data:dAlunos}]=await Promise.all([
      supabase.from('alunos_frequencia').select('*').eq('turma_id',tid),
      supabase.from('aulas_frequencia').select('*').eq('turma_id',tid).order('data'),
      supabase.from('presencas').select('*'),
      supabase.from('grupos').select('*').eq('turma_id',tid),
      supabase.from('atividades').select('*').order('prazo'),
      supabase.from('eventos_calendario').select('*').order('data'),
      supabase.from('desafio_ux').select('*').eq('turma_id',tid).maybeSingle(),
      supabase.from('desafio_ux_alunos').select('*'),
    ]);
    return {alunos,aulas,pres,grupos,atividades:ativs,eventos,desafio,dAlunos};
  }

  async function exportJSON() {
    setL('json',true);setLog([]);addLog('Buscando dados...');
    try { const data=await fetchAll(); download(jsonBlob({meta:{exportado_em:new Date().toISOString(),turma,versao:'1.0',app:'Teachly'},...data}),`teachly-backup-${turma}-${hoje()}.json`); addLog('Backup baixado!','ok'); }
    catch(e){addLog(e.message,'err');} setL('json',false);
  }
  async function exportFreqCSV() {
    setL('csv_freq',true);setLog([]);addLog('Gerando frequência...');
    try {
      const {alunos,aulas,pres}=await fetchAll(); if(!alunos?.length){addLog('Nenhum aluno','err');return;}
      const pm={};(pres||[]).forEach(p=>{pm[`${p.aluno_local_id}_${p.aula_frequencia_id}`]=p.presente;});
      const headers=['Matrícula','Nome',...(aulas||[]).map(a=>`${a.data}${a.disciplina_nome?' - '+a.disciplina_nome:''}`),'Total Presenças','% Frequência'];
      const rows=(alunos||[]).map(al=>{const row={Matrícula:al.matricula||'',Nome:al.nome};let t=0;(aulas||[]).forEach(au=>{const v=pm[`${al.id}_${au.id}`];row[`${au.data}${au.disciplina_nome?' - '+au.disciplina_nome:''}`]=v===true?'P':v===false?'F':'-';if(v===true)t++;});row['Total Presenças']=t;row['% Frequência']=aulas?.length?Math.round(t/aulas.length*100)+'%':'-';return row;});
      download(csvBlob(rows,headers),`teachly-frequencia-${turma}-${hoje()}.csv`); addLog(`${alunos.length} alunos`,'ok');
    } catch(e){addLog(e.message,'err');} setL('csv_freq',false);
  }
  async function exportGruposCSV() {
    setL('csv_grupos',true);setLog([]);addLog('Gerando grupos...');
    try { const {grupos}=await fetchAll();const rows=[];(grupos||[]).forEach((g,gi)=>{(g.membros||[]).forEach(m=>rows.push({Grupo:gi+1,'Nome do Grupo':g.nome||'',Aluno:m.nome,Papel:m.papel||''}));if(!g.membros?.length)rows.push({Grupo:gi+1,'Nome do Grupo':g.nome||'',Aluno:'(vazio)',Papel:''});});download(csvBlob(rows,['Grupo','Nome do Grupo','Aluno','Papel']),`teachly-grupos-${turma}-${hoje()}.csv`);addLog(`${grupos?.length||0} grupos`,'ok'); }
    catch(e){addLog(e.message,'err');} setL('csv_grupos',false);
  }
  async function exportAtivCSV() {
    setL('csv_ativ',true);setLog([]);addLog('Gerando atividades...');
    try { const {atividades}=await fetchAll();download(csvBlob((atividades||[]).map(a=>({Título:a.titulo,Tipo:a.tipo||'',Prazo:a.prazo||'',Descrição:a.descricao||'',Link:a.link||''})),['Título','Tipo','Prazo','Descrição','Link']),`teachly-atividades-${hoje()}.csv`);addLog(`${atividades?.length||0} atividades`,'ok'); }
    catch(e){addLog(e.message,'err');} setL('csv_ativ',false);
  }
  async function exportEventosCSV() {
    setL('csv_eventos',true);setLog([]);addLog('Gerando eventos...');
    try { const {eventos}=await fetchAll();download(csvBlob((eventos||[]).map(e=>({Data:e.data,Hora:e.hora||'',Título:e.titulo,Tipo:e.tipo||'',Turma:e.turma_label||'Geral',Obs:e.obs||''})),['Data','Hora','Título','Tipo','Turma','Obs']),`teachly-eventos-${hoje()}.csv`);addLog(`${eventos?.length||0} eventos`,'ok'); }
    catch(e){addLog(e.message,'err');} setL('csv_eventos',false);
  }
  async function exportDesafioCSV() {
    setL('csv_desafio',true);setLog([]);addLog('Gerando desafio...');
    try { const {desafio,dAlunos}=await fetchAll();if(!desafio){addLog('Sem desafio','err');return;}const alunos=(dAlunos||[]).filter(a=>a.desafio_id===desafio.id);download(csvBlob(alunos.map(a=>({Nome:a.nome,Grupo:a.grupo||'',App:a.app||'',Status:a.status||'pendente',Nota:a.nota||'',LinkedIn:a.linkedin||'',Obs:a.obs||''})),['Nome','Grupo','App','Status','Nota','LinkedIn','Obs']),`teachly-desafio-${turma}-${hoje()}.csv`);addLog(`${alunos.length} alunos`,'ok'); }
    catch(e){addLog(e.message,'err');} setL('csv_desafio',false);
  }
  async function exportFreqPDF() {
    setL('pdf_freq',true);setLog([]);addLog('Gerando PDF...');
    try {
      const {alunos,aulas,pres}=await fetchAll();const pm={};(pres||[]).forEach(p=>{pm[`${p.aluno_local_id}_${p.aula_frequencia_id}`]=p.presente;});
      let html=`<h1>📋 Frequência — ${TURMA_LABEL[turma]||turma}</h1><div class="meta">Exportado em ${new Date().toLocaleDateString('pt-BR')} · Teachly</div>`;
      (aulas||[]).forEach(au=>{const aa=(alunos||[]).map(al=>({...al,presente:pm[`${al.id}_${au.id}`]}));const pr=aa.filter(a=>a.presente===true).length;html+=`<h2>Aula ${au.data}${au.disciplina_nome?' — '+au.disciplina_nome:''} <small style="font-weight:400;color:#6b7280">(${pr}/${aa.length})</small></h2><table><tr><th>#</th><th>Nome</th><th>Matrícula</th><th>Presença</th></tr>${aa.map((al,i)=>`<tr><td>${i+1}</td><td>${al.nome}</td><td>${al.matricula||'-'}</td><td><span class="badge ${al.presente===true?'pres':'ause'}">${al.presente===true?'✓ Presente':'✗ Falta'}</span></td></tr>`).join('')}</table>`;});
      html+=`<h2>Resumo</h2><table><tr><th>Nome</th><th>Presenças</th><th>Faltas</th><th>%</th></tr>${(alunos||[]).map(al=>{let p=0,f=0;(aulas||[]).forEach(au=>{const v=pm[`${al.id}_${au.id}`];if(v===true)p++;else if(v===false)f++;});return`<tr><td>${al.nome}</td><td>${p}</td><td>${f}</td><td>${aulas?.length?Math.round(p/aulas.length*100):0}%</td></tr>`;}).join('')}</table>`;
      printPDF(html,`Frequência ${turma}`);addLog('PDF aberto!','ok');
    } catch(e){addLog(e.message,'err');} setL('pdf_freq',false);
  }
  async function exportGruposPDF() {
    setL('pdf_grupos',true);setLog([]);addLog('Gerando PDF...');
    try { const {grupos}=await fetchAll();let html=`<h1>👥 Grupos — ${TURMA_LABEL[turma]||turma}</h1><div class="meta">Exportado em ${new Date().toLocaleDateString('pt-BR')}</div>`;(grupos||[]).forEach((g,gi)=>{html+=`<h2>Grupo ${gi+1}${g.nome?' — '+g.nome:''}</h2><table><tr><th>#</th><th>Aluno</th><th>Papel</th></tr>${(g.membros||[]).map((m,mi)=>`<tr><td>${mi+1}</td><td>${m.nome}</td><td>${m.papel||'-'}</td></tr>`).join()||'<tr><td colspan="3">Vazio</td></tr>'}</table>`;});printPDF(html,`Grupos ${turma}`);addLog('PDF aberto!','ok'); }
    catch(e){addLog(e.message,'err');} setL('pdf_grupos',false);
  }
  async function exportDesafioPDF() {
    setL('pdf_desafio',true);setLog([]);addLog('Gerando PDF...');
    try { const {desafio,dAlunos}=await fetchAll();if(!desafio){addLog('Sem desafio','err');return;}const alunos=(dAlunos||[]).filter(a=>a.desafio_id===desafio.id);printPDF(`<h1>🏆 Vitrine UX/UI — ${TURMA_LABEL[turma]||turma}</h1><div class="meta">Prazo: ${desafio.prazo||'—'} · Exportado em ${new Date().toLocaleDateString('pt-BR')}</div><table><tr><th>Nome</th><th>Grupo</th><th>App</th><th>Status</th><th>Nota</th><th>Obs</th></tr>${alunos.map(a=>`<tr><td>${a.nome}</td><td>${a.grupo||'-'}</td><td>${a.app||'-'}</td><td><span class="badge ${a.status==='entregue'?'pres':'ause'}">${a.status||'pendente'}</span></td><td>${a.nota||'-'}</td><td>${a.obs||'-'}</td></tr>`).join('')}</table>`,`Desafio ${turma}`);addLog('PDF aberto!','ok'); }
    catch(e){addLog(e.message,'err');} setL('pdf_desafio',false);
  }

  const btnRow={display:'flex',flexWrap:'wrap',gap:8};
  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {Object.entries(TURMAS).map(([k,t])=>(
          <button key={k} onClick={()=>setTurma(k)} style={{padding:'8px 16px',borderRadius:10,cursor:'pointer',fontWeight:600,fontSize:'0.83rem',fontFamily:'inherit',background:turma===k?`${t.cor}22`:'var(--surface2)',border:`1px solid ${turma===k?t.cor+'66':'var(--border)'}`,color:turma===k?t.cor:'var(--text3)'}}>
            <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:t.cor,marginRight:6}}/>{t.modulo} · {t.label}
          </button>
        ))}
      </div>
      <Section icon={<FloppyDisk size={20} weight="duotone" />} title="Backup Completo" subtitle="Exporta tudo em JSON para restaurar depois" accent="#7c3aed">
        <div style={btnRow}><Btn onClick={exportJSON} loading={loading.json}>⬇ Baixar backup JSON</Btn></div>
      </Section>
      <Section icon={<Table size={20} weight="duotone" />} title="Planilhas CSV" subtitle="Google Sheets · Excel · LibreOffice" accent="#60a5fa">
        <div style={btnRow}>
          <Btn variant="ghost" onClick={exportFreqCSV}    loading={loading.csv_freq}>📋 Frequência</Btn>
          <Btn variant="ghost" onClick={exportGruposCSV}  loading={loading.csv_grupos}>👥 Grupos</Btn>
          <Btn variant="ghost" onClick={exportAtivCSV}    loading={loading.csv_ativ}>📝 Atividades</Btn>
          <Btn variant="ghost" onClick={exportEventosCSV} loading={loading.csv_eventos}>📅 Calendário</Btn>
        </div>
      </Section>
      <Section icon={<FileArrowDown size={20} weight="duotone" />} title="PDF para Impressão" subtitle="Abre no navegador para imprimir" accent="#e879f9">
        <div style={btnRow}>
          <Btn variant="ghost" onClick={exportFreqPDF}    loading={loading.pdf_freq}>📋 Frequência PDF</Btn>
          <Btn variant="ghost" onClick={exportGruposPDF}  loading={loading.pdf_grupos}>👥 Grupos PDF</Btn>
        </div>
      </Section>
      <Log entries={log}/>
    </div>
  );
}

// ─── ImportPanel ────────────────────────────────────────────────
function ImportPanel() {
  const { turmas, reload, getAllDiscs } = useOrg();
  const [turma,setTurma] = useState(()=>turmas?.[0]?.key||'mod1a');
  const [loading,setLoading] = useState({});
  const [log,setLog] = useState([]);
  const addLog=(msg,type='info')=>setLog(l=>[...l,{msg,type}]);
  const setL=(k,v)=>setLoading(p=>({...p,[k]:v}));

  // ── Declarados ANTES das funções que os usam ──────────────
  const turmaAtiva        = turmas.find(t=>t.key===turma)||turmas[0];
  const discsParaImportar = (turmaAtiva?.disciplinas||[]).filter((d,i,arr)=>arr.findIndex(x=>x.id===d.id)===i);

  // ── Importar conteúdo de uma disc (courses.js → banco) ───
  async function importarConteudoDisc(disc) {
    const match=Object.values(COURSES).find(c=>c.key===disc.key||c.code===disc.code||c.fullname?.toLowerCase()===disc.label?.toLowerCase()||c.label?.toLowerCase()===disc.label?.toLowerCase());
    if (!match) { addLog(`⚠ Sem plano para "${disc.label}" (key="${disc.key}" code="${disc.code}")`, 'err'); return; }
    setL(`disc_${disc.id}`,true);
    addLog(`Importando "${match.fullname}"...`);
    const {error}=await supabase.from('disciplinas').update({blocos:match.blocos||[],avaliacao:match.avaliacao||'',descricao:match.apresentacao||match.competencias||''}).eq('id',disc.id);
    if(error) addLog(`Erro: ${error.message}`,'err');
    else { addLog(`✓ "${match.fullname}" — ${match.blocos?.length||0} bloco(s)`,'ok'); await reload(); }
    setL(`disc_${disc.id}`,false);
  }

  // ── Importar todas da turma ativa ─────────────────────────
  async function importarTodas() {
    setLog([]); addLog(`Importando ${discsParaImportar.length} disc(s) de ${turmaAtiva?.label||turma}...`);
    for (const d of discsParaImportar) await importarConteudoDisc(d);
    addLog('Concluído!','ok');
  }

  // ── Importar TODAS as disciplinas de TODAS as turmas ─────
  // Usa getAllDiscs() do OrgContext — flatMap já feito lá
  async function importarTodasGlobal() {
    setLog([]);
    const todas = getAllDiscs();
    addLog(`🔍 ${turmas.length} turma(s) · ${todas.length} disciplina(s) no total`);
    turmas.forEach(t=>addLog(`  → ${t.label||t.key}: ${t.disciplinas?.length??0} disc(s)`));
    if (!todas.length) { addLog('⚠ Nenhuma disciplina encontrada. Crie em "Disciplinas & Turmas" primeiro.','err'); return; }
    addLog(`▶ Importando ${todas.length} disciplina(s)...`);
    for (const d of todas) await importarConteudoDisc(d);
    addLog('✅ Importação global concluída!','ok');
  }

  async function importAlunos(e) {
    const file=e.target.files[0]; if(!file)return;
    setL('alunos',true);setLog([]);addLog('Lendo CSV...');
    try {
      const lines=(await file.text()).split('\n').map(l=>l.trim()).filter(Boolean);
      const header=lines[0].split(',').map(h=>h.replace(/^"|"$/g,'').trim().toLowerCase());
      const nomeIdx=header.findIndex(h=>h.includes('nome'));const matIdx=header.findIndex(h=>h.includes('matr'));
      if(nomeIdx===-1){addLog('Coluna "nome" não encontrada','err');setL('alunos',false);return;}
      const tid=turmaAtiva?.id||TURMA_IDS[turma];let ok=0,skip=0;
      for(let i=1;i<lines.length;i++){const cols=lines[i].split(',').map(c=>c.replace(/^"|"$/g,'').trim());const nome=cols[nomeIdx];if(!nome){skip++;continue;}const matr=matIdx>=0?cols[matIdx]:'';const{error}=await supabase.from('alunos_frequencia').insert({turma_id:tid,nome,matricula:matr});if(error&&!error.message.includes('duplicate')){addLog(`Erro "${nome}": ${error.message}`,'err');skip++;}else{ok++;addLog(`+ ${nome}`,'ok');}}
      addLog(`Concluído: ${ok} importados, ${skip} ignorados.`,'ok');
    }catch(err){addLog(err.message,'err');}
    e.target.value=''; setL('alunos',false);
  }

  async function importEventos(e) {
    const file=e.target.files[0]; if(!file)return;
    setL('eventos',true);setLog([]);addLog('Lendo CSV de eventos...');
    try {
      const lines=(await file.text()).split('\n').map(l=>l.trim()).filter(Boolean);
      const header=lines[0].split(',').map(h=>h.replace(/^"|"$/g,'').trim().toLowerCase());
      const get=(cols,...keys)=>{const i=header.findIndex(h=>keys.some(k=>h.includes(k)));return i>=0?cols[i].replace(/^"|"$/g,'').trim():'';};
      let ok=0,skip=0;
      for(let i=1;i<lines.length;i++){const cols=lines[i].split(',');const data=get(cols,'data','date'),titulo=get(cols,'titulo','title','nome','name');if(!data||!titulo){skip++;continue;}const{error}=await supabase.from('eventos_calendario').insert({data,titulo,hora:get(cols,'hora','time'),tipo:get(cols,'tipo','type')||'evento',turma_label:get(cols,'turma')||'Geral',obs:get(cols,'obs','descricao','desc')});if(error){addLog(`Erro: ${error.message}`,'err');skip++;}else{ok++;addLog(`+ ${titulo} (${data})`,'ok');}}
      addLog(`Concluído: ${ok} eventos, ${skip} ignorados.`,'ok');
    }catch(err){addLog(err.message,'err');}
    e.target.value=''; setL('eventos',false);
  }

  async function importJSON(e) {
    const file=e.target.files[0]; if(!file)return;
    setL('json',true);setLog([]);addLog('Lendo JSON...');
    try {
      const json=JSON.parse(await file.text());
      if(!json.meta){addLog('Arquivo inválido','err');setL('json',false);return;}
      const turmaObj=turmas.find(t=>t.key===json.meta.turma||t.id===json.meta.turma);const tid=turmaObj?.id;
      addLog(`Turma: ${json.meta.turma_label||json.meta.turma}`,'info');
      const{data:{user}}=await supabase.auth.getUser();
      if(json.alunos?.length&&tid){const{error}=await supabase.from('alunos_frequencia').insert(json.alunos.map(a=>({turma_id:tid,nome:a.nome,matricula:a.matricula||''})));if(error)addLog(`Alunos: ${error.message}`,'err');else addLog(`✓ ${json.alunos.length} alunos`,'ok');}
      if(json.grupos?.length&&tid){const{error}=await supabase.from('grupos').insert(json.grupos.map(g=>({turma_id:tid,nome:g.nome,descricao:g.descricao||'',membros:g.membros||[],professor_id:user?.id})));if(error)addLog(`Grupos: ${error.message}`,'err');else addLog(`✓ ${json.grupos.length} grupos`,'ok');}
      if(json.atividades?.length){const{error}=await supabase.from('atividades').insert(json.atividades.map(a=>({titulo:a.titulo,tipo:a.tipo||'atividade',descricao:a.descricao||'',prazo:a.prazo||null,link:a.link||'',turmas:a.turmas||[json.meta.turma],professor_id:user?.id,organizacao_id:turmaObj?.organizacao_id||null})));if(error)addLog(`Atividades: ${error.message}`,'err');else addLog(`✓ ${json.atividades.length} atividades`,'ok');}
      if(json.eventos?.length){const{error}=await supabase.from('eventos_calendario').insert(json.eventos.map(ev=>({data:ev.data,titulo:ev.titulo,hora:ev.hora||'',tipo:ev.tipo||'evento',turma_label:ev.turma_label||'Geral',obs:ev.obs||'',professor_id:user?.id,turma_id:tid||null})));if(error)addLog(`Eventos: ${error.message}`,'err');else addLog(`✓ ${json.eventos.length} eventos`,'ok');}
      addLog('Importação concluída! ✅','ok');
    }catch(err){addLog('Erro: '+err.message,'err');}
    e.target.value=''; setL('json',false);
  }

  async function importRecursos(e) {
    const file=e.target.files[0]; if(!file)return;
    setL('recursos',true);setLog([]);addLog('Lendo recursos...');
    try {
      const json=JSON.parse(await file.text());
      if(!json.meta?.disciplina_key||!json.recursos){addLog('Arquivo inválido','err');setL('recursos',false);return;}
      const{disciplina_key,disciplina,codigo}=json.meta;addLog(`Disciplina: ${disciplina||disciplina_key} (${codigo||'?'})`,'info');
      const{data:{user}}=await supabase.auth.getUser();
      const{data:orgData}=await supabase.from('usuarios').select('organizacao_id').eq('id',user?.id).single();
      const{error}=await supabase.from('recursos').insert(json.recursos.map(r=>({professor_id:user?.id,organizacao_id:orgData?.organizacao_id||null,disciplina_key,tipo:r.tipo||'outro',titulo:r.titulo,url:r.url||'',aulas_indicadas:r.aulas_indicadas||[],objetivo:r.objetivo||'',como_usar:r.como_usar||'',onde_encontrar:r.onde_encontrar||'',obs:r.obs||'',tarefa:r.tarefa||'',cor:r.cor||'#7c3aed'})));
      if(error)addLog(`Erro: ${error.message}`,'err');else addLog(`✅ ${json.recursos.length} recursos importados!`,'ok');
    }catch(err){addLog('Erro: '+err.message,'err');}
    e.target.value=''; setL('recursos',false);
  }

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {turmas.map(t=>(
          <button key={t.key} onClick={()=>setTurma(t.key)} style={{padding:'8px 16px',borderRadius:10,cursor:'pointer',fontWeight:600,fontSize:'0.83rem',fontFamily:'inherit',background:turma===t.key?`${t.cor}22`:'var(--surface2)',border:`1px solid ${turma===t.key?t.cor+'66':'var(--border)'}`,color:turma===t.key?t.cor:'var(--text3)'}}>
            <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:t.cor,marginRight:6}}/>{t.modulo} · {t.label}
          </button>
        ))}
      </div>

      <Section icon={<FileArrowUp size={20} weight="duotone" />} title="Importar Lista de Alunos" subtitle="CSV com coluna 'nome' (e opcionalmente 'matricula')" accent="#4ade80">
        <div style={{fontSize:'0.78rem',color:'var(--text3)',marginBottom:12,fontFamily:'monospace',background:'var(--surface2)',borderRadius:8,padding:'8px 12px'}}>
          nome,matricula{'\n'}Ana Silva,2025001{'\n'}João Costa,2025002
        </div>
        <UploadBtn id="up-alunos" loading={loading.alunos} accent="#4ade80">📂 Selecionar CSV de alunos</UploadBtn>
        <input id="up-alunos" type="file" accept=".csv,.txt" style={{display:'none'}} onChange={importAlunos}/>
      </Section>

      <Section icon={<CalendarBlank size={20} weight="duotone" />} title="Importar Eventos do Calendário" subtitle="CSV: data (YYYY-MM-DD), titulo, hora, tipo" accent="#fbbf24">
        <div style={{fontSize:'0.78rem',color:'var(--text3)',marginBottom:12,fontFamily:'monospace',background:'var(--surface2)',borderRadius:8,padding:'8px 12px'}}>
          data,titulo,hora,tipo{'\n'}2025-04-01,Prova DCU,18:40,prova
        </div>
        <UploadBtn id="up-eventos" loading={loading.eventos} accent="#fbbf24">📂 Selecionar CSV de eventos</UploadBtn>
        <input id="up-eventos" type="file" accept=".csv,.txt" style={{display:'none'}} onChange={importEventos}/>
      </Section>

      <Section icon="🔄" title="Restaurar Backup (JSON)" subtitle="Importa dados de um arquivo JSON gerado pelo Teachly" accent="#f59e0b">
        <div style={{background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:10,padding:'10px 14px',fontSize:'0.8rem',color:'#fcd34d',marginBottom:12}}>
          📋 A turma é detectada automaticamente pelo campo <code>meta.turma</code>.
        </div>
        <UploadBtn id="up-json" loading={loading.json} accent="#f59e0b">📂 Selecionar arquivo JSON</UploadBtn>
        <input id="up-json" type="file" accept=".json" style={{display:'none'}} onChange={importJSON}/>
      </Section>

      <Section icon={<BookOpen size={20} weight="duotone" />} title="Importar Conteúdo das Disciplinas" subtitle={`${turmaAtiva?.label||'—'} · courses.js → banco`} accent="#c084fc">
        {discsParaImportar.length===0 ? (
          <div style={{color:'var(--text3)',fontSize:'0.85rem'}}>Nenhuma disciplina nesta turma. Crie em <strong>Disciplinas &amp; Turmas</strong> primeiro.</div>
        ):(
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10,marginBottom:16}}>
              {discsParaImportar.map(disc=>{
                const match=Object.values(COURSES).find(c=>c.key===disc.key||c.code===disc.code||c.fullname?.toLowerCase()===disc.label?.toLowerCase()||c.label?.toLowerCase()===disc.label?.toLowerCase());
                const temPlano=disc.blocos?.length>0;
                return (
                  <div key={disc.id} style={{background:temPlano?'rgba(192,132,252,0.07)':'#0d0618',border:`1px solid ${temPlano?'#c084fc40':'var(--border)'}`,borderRadius:12,padding:'12px 14px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:disc.cor,flexShrink:0}}/>
                      <div style={{fontWeight:700,color:'var(--text)',fontSize:'0.85rem',flex:1}}>{disc.label}</div>
                      {disc.code&&<span style={{fontSize:'0.68rem',fontFamily:'monospace',color:'var(--text3)'}}>{disc.code}</span>}
                    </div>
                    <div style={{fontSize:'0.72rem',marginBottom:10,color:temPlano?'#4ade80':match?'#c084fc':'#f87171'}}>
                      {temPlano?`✓ ${disc.blocos.length} bloco(s) importado(s)`:match?`📋 "${match.fullname}" disponível`:`⚠ Sem correspondência — key="${disc.key}"`}
                    </div>
                    {match&&<Btn onClick={()=>{setLog([]);importarConteudoDisc(disc);}} loading={loading[`disc_${disc.id}`]} variant={temPlano?'ghost':'primary'} accent="#c084fc">{temPlano?'🔄 Reimportar':'📥 Importar plano'}</Btn>}
                  </div>
                );
              })}
            </div>
            <div style={{background:'var(--surface)',border:'1px solid #2a1650',borderRadius:12,padding:'14px 16px',display:'flex',flexWrap:'wrap',gap:10,alignItems:'center'}}>
              <div style={{flex:1,minWidth:160}}>
                <div style={{fontWeight:700,color:'var(--text)',fontSize:'0.83rem',marginBottom:2}}>Importar em lote</div>
                <div style={{fontSize:'0.73rem',color:'var(--text3)'}}>Turma ativa: {discsParaImportar.length} disc(s) · Todas as turmas: {getAllDiscs().length} disc(s)</div>
              </div>
              <Btn onClick={importarTodas} accent="#c084fc">📥 Importar desta turma</Btn>
              <Btn onClick={importarTodasGlobal} accent="#e879f9" variant="ghost">🌐 Importar todas as turmas</Btn>
            </div>
          </>
        )}
      </Section>

      <Section icon={<Info size={20} weight="duotone" />} title="Importar Guia de Recursos (JSON)" subtitle="Vídeos, livros e ferramentas por disciplina" accent="#e879f9">
        <div style={{background:'rgba(232,121,249,0.07)',border:'1px solid rgba(232,121,249,0.2)',borderRadius:10,padding:'10px 14px',fontSize:'0.8rem',color:'#f0abfc',marginBottom:12}}>
          📋 1 arquivo por disciplina. Detectado pelo campo <code>meta.disciplina_key</code>.
        </div>
        <UploadBtn id="up-recursos" loading={loading.recursos} accent="#e879f9">📂 Selecionar arquivo de recursos</UploadBtn>
        <input id="up-recursos" type="file" accept=".json" style={{display:'none'}} onChange={importRecursos}/>
      </Section>

      <Log entries={log}/>
    </div>
  );
}

// ─── ConteudoPanel — editor visual de blocos/aulas ─────────────
function ConteudoPanel() {
  const { turmas, reload } = useOrg();
  const [turmaKey,setTurmaKey] = useState(()=>turmas?.[0]?.key||'');
  const [discId,setDiscId]     = useState('');
  const [blocos,setBlocos]     = useState(null);
  const [saving,setSaving]     = useState(false);
  const [log,setLog]           = useState([]);
  const addLog=(msg,type='info')=>setLog(l=>[...l,{msg,type}]);

  const turmaAtiva = turmas.find(t=>t.key===turmaKey)||turmas[0];
  const discs      = turmaAtiva?.disciplinas||[];
  const discAtiva  = discs.find(d=>d.id===discId)||discs[0];

  function carregarBlocos(disc) {
    if (!disc) return;
    const fonte = disc.blocos?.length ? disc.blocos
      : Object.values(COURSES).find(c=>c.key===disc.key||c.code===disc.code||c.fullname?.toLowerCase()===disc.label?.toLowerCase())?.blocos||[];
    setBlocos(JSON.parse(JSON.stringify(fonte)));
  }
  if (blocos===null&&discAtiva) carregarBlocos(discAtiva);

  function selecionarTurma(key) {
    setTurmaKey(key);
    const disc=turmas.find(t=>t.key===key)?.disciplinas?.[0];
    setDiscId(disc?.id||''); carregarBlocos(disc); setLog([]);
  }
  function selecionarDisc(id) { setDiscId(id); carregarBlocos(discs.find(d=>d.id===id)); setLog([]); }

  async function salvar() {
    if (!discAtiva) return;
    setSaving(true); setLog([]); addLog('Salvando no banco...');
    const{error}=await supabase.from('disciplinas').update({blocos}).eq('id',discAtiva.id);
    if(error) addLog('Erro: '+error.message,'err');
    else { addLog(`✓ ${blocos.length} bloco(s) salvos em "${discAtiva.label}"!`,'ok'); await reload(); }
    setSaving(false);
  }

  function importarDoCourses() {
    const match=Object.values(COURSES).find(c=>c.key===discAtiva?.key||c.code===discAtiva?.code||c.fullname?.toLowerCase()===discAtiva?.label?.toLowerCase());
    if(!match){addLog(`Sem plano em courses.js para "${discAtiva?.label}"`,'err');return;}
    setBlocos(JSON.parse(JSON.stringify(match.blocos||[])));
    addLog(`✓ ${match.blocos?.length||0} bloco(s) carregados — clique em Salvar para persistir`,'ok');
  }

  const editBloco=(bi,k,v)=>setBlocos(b=>b.map((bl,i)=>i===bi?{...bl,[k]:v}:bl));
  const editAula=(bi,ai,k,v)=>setBlocos(b=>b.map((bl,i)=>i===bi?{...bl,aulas:bl.aulas.map((au,j)=>j===ai?{...au,[k]:v}:au)}:bl));
  const addBloco=()=>setBlocos(b=>[...(b||[]),{titulo:'Novo Bloco',foco:'',aulas:[]}]);
  const removeBloco=(bi)=>{if(confirm('Remover bloco e todas as aulas?'))setBlocos(b=>b.filter((_,i)=>i!==bi));};
  const addAula=(bi)=>setBlocos(b=>b.map((bl,i)=>i===bi?{...bl,aulas:[...(bl.aulas||[]),{id:`AULA ${(bl.aulas?.length||0)+1}`,titulo:'Nova aula',teoria:'',pratica:'',recurso:'',obs:'',plano_b:'',conexao:''}]}:bl));
  const removeAula=(bi,ai)=>setBlocos(b=>b.map((bl,i)=>i===bi?{...bl,aulas:bl.aulas.filter((_,j)=>j!==ai)}:bl));

  const fs={width:'100%',background:'var(--surface2)',border:'1px solid #2a1650',borderRadius:8,padding:'8px 12px',color:'var(--text)',fontSize:'0.82rem',fontFamily:'inherit',resize:'vertical',outline:'none',boxSizing:'border-box'};
  const ls={fontSize:'0.72rem',color:'var(--text3)',marginBottom:4,display:'block',fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase'};

  if (!turmaAtiva||discs.length===0) return (
    <div style={{padding:40,textAlign:'center',color:'var(--text3)'}}>
      Nenhuma disciplina encontrada. Crie em <strong>Disciplinas &amp; Turmas</strong> primeiro.
    </div>
  );

  return (
    <div>
      {/* Seletor turma */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        {turmas.map(t=>(
          <button key={t.key} onClick={()=>selecionarTurma(t.key)} style={{padding:'8px 16px',borderRadius:10,cursor:'pointer',fontWeight:600,fontSize:'0.83rem',fontFamily:'inherit',background:turmaKey===t.key?`${t.cor}22`:'#1a0f2e',border:`1px solid ${turmaKey===t.key?t.cor+'66':'#2a1650'}`,color:turmaKey===t.key?t.cor:'#6b5a8a'}}>
            <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:t.cor,marginRight:6}}/>{t.modulo} · {t.label}
          </button>
        ))}
      </div>

      {/* Seletor disciplina */}
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {discs.map(d=>(
          <button key={d.id} onClick={()=>selecionarDisc(d.id)} style={{padding:'7px 14px',borderRadius:10,cursor:'pointer',fontWeight:600,fontSize:'0.8rem',fontFamily:'inherit',background:discAtiva?.id===d.id?`${d.cor}22`:'#0d0618',border:`1px solid ${discAtiva?.id===d.id?d.cor+'66':'#2a1650'}`,color:discAtiva?.id===d.id?d.cor:'#6b5a8a'}}>
            {d.label}{d.code&&<span style={{fontSize:'0.65rem',fontFamily:'monospace',marginLeft:6,opacity:0.6}}>{d.code}</span>}
          </button>
        ))}
      </div>

      {/* Header disciplina ativa */}
      {discAtiva&&(
        <div style={{background:'#120820',border:'1px solid #2a1650',borderRadius:14,padding:'16px 20px',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
            <div>
              <div style={{fontWeight:700,color:'var(--text)',fontSize:'1rem'}}>{discAtiva.label}</div>
              <div style={{fontSize:'0.75rem',color:'var(--text3)',marginTop:2}}>
                {blocos?.length||0} bloco(s) · {blocos?.reduce((s,b)=>s+(b.aulas?.length||0),0)||0} aula(s) · {discAtiva.blocos?.length?'✓ Salvo no banco':'Sem conteúdo salvo'}
              </div>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <Btn onClick={importarDoCourses} variant="ghost" accent="#c084fc">📥 Carregar de courses.js</Btn>
              <Btn onClick={addBloco} variant="ghost" accent="#4ade80">+ Bloco</Btn>
              <Btn onClick={salvar} loading={saving} accent="#7c3aed">💾 Salvar no banco</Btn>
            </div>
          </div>
        </div>
      )}

      <Log entries={log}/>

      {/* Editor de blocos */}
      {(blocos||[]).map((bloco,bi)=>(
        <div key={bi} style={{background:'#120820',border:'1px solid #2a1650',borderRadius:14,marginBottom:16,overflow:'hidden'}}>
          <div style={{padding:'14px 18px',borderBottom:'1px solid #1e0a40',background:'linear-gradient(90deg,#7c3aed10,transparent)',display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:28,height:28,borderRadius:8,background:'#7c3aed20',border:'1px solid #7c3aed40',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#a855f7',fontSize:'0.8rem',flexShrink:0}}>B{bi+1}</div>
            <input value={bloco.titulo||''} onChange={e=>editBloco(bi,'titulo',e.target.value)} style={{...fs,flex:1,padding:'6px 10px',fontWeight:700,fontSize:'0.9rem'}} placeholder="Título do bloco"/>
            <button onClick={()=>removeBloco(bi)} style={{width:28,height:28,borderRadius:8,border:'1px solid rgba(248,113,113,0.3)',background:'rgba(248,113,113,0.08)',cursor:'pointer',color:'#f87171',display:'flex',alignItems:'center',justifyContent:'center'}}><Trash size={13} /></button>
          </div>
          <div style={{padding:'14px 18px'}}>
            <div style={{marginBottom:14}}>
              <label style={ls}>Foco / Descrição do bloco</label>
              <textarea value={bloco.foco||''} onChange={e=>editBloco(bi,'foco',e.target.value)} style={fs} rows={2} placeholder="Objetivo deste bloco..."/>
            </div>
            {(bloco.aulas||[]).map((aula,ai)=>(
              <div key={ai} style={{background:'var(--surface)',border:'1px solid #1e0a40',borderRadius:10,padding:'12px 14px',marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <div style={{width:22,height:22,borderRadius:6,background:'#1e0a40',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:700,color:'var(--text3)',flexShrink:0}}>{ai+1}</div>
                  <input value={aula.id||''} onChange={e=>editAula(bi,ai,'id',e.target.value)} style={{...fs,width:90,padding:'4px 8px',fontFamily:'monospace',fontSize:'0.72rem',color:'#c084fc'}} placeholder="AULA 01"/>
                  <input value={aula.titulo||''} onChange={e=>editAula(bi,ai,'titulo',e.target.value)} style={{...fs,flex:1,padding:'4px 10px',fontWeight:600}} placeholder="Título da aula"/>
                  <button onClick={()=>removeAula(bi,ai)} style={{background:'none',border:'none',cursor:'pointer',color:'#f87171',fontSize:'1rem'}}>✕</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {[['teoria','Teoria'],['pratica','Prática'],['recurso','Recurso'],['obs','Obs'],['plano_b','Plano B'],['conexao','Conexão / PI']].map(([campo,label])=>(
                    <div key={campo}>
                      <label style={ls}>{label}</label>
                      <textarea value={aula[campo]||''} onChange={e=>editAula(bi,ai,campo,e.target.value)} style={fs} rows={2} placeholder={label+'...'}/>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={()=>addAula(bi)} style={{background:'none',border:'1px dashed #2a1650',borderRadius:8,color:'var(--text3)',cursor:'pointer',fontSize:'0.8rem',padding:'8px 16px',width:'100%',fontFamily:'inherit',marginTop:4}}>
              + Adicionar aula ao Bloco {bi+1}
            </button>
          </div>
        </div>
      ))}

      {blocos?.length>0&&(
        <div style={{position:'sticky',bottom:16,display:'flex',justifyContent:'flex-end',paddingTop:8}}>
          <Btn onClick={salvar} loading={saving} accent="#7c3aed">💾 Salvar {blocos.length} bloco(s) no banco</Btn>
        </div>
      )}
    </div>
  );
}

// ─── Admin principal ────────────────────────────────────────────
export function Admin() {
  const [tab,setTab] = useState('export');
  const tabs = [
    { key:'export',   label:'⬇ Exportar',  desc:'JSON · CSV · PDF' },
    { key:'import',   label:'⬆ Importar',  desc:'CSV · JSON · Planos' },
  ];
  return (
    <div className="anim-up">
      <div className="page-header">
        <div>
          <div className="page-title">Painel Administrativo</div>
          <div className="page-subtitle">Exportação · Importação · Editor de conteúdo · Teachly · ETE Cícero Dias</div>
        </div>
      </div>
      <div style={{display:'flex',gap:4,marginBottom:24,background:'#120820',border:'1px solid #2a1650',borderRadius:12,padding:4}}>
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{flex:1,padding:'10px 16px',borderRadius:9,border:'none',cursor:'pointer',background:tab===t.key?'linear-gradient(135deg,#7c3aed,#a855f7)':'transparent',color:tab===t.key?'white':'#6b5a8a',fontWeight:700,fontSize:'0.875rem',fontFamily:'inherit',transition:'all 0.2s'}}>
            {t.label}
            <div style={{fontSize:'0.7rem',fontWeight:400,opacity:0.8,marginTop:2}}>{t.desc}</div>
          </button>
        ))}
      </div>
      {tab==='export'   && <ExportPanel/>}
      {tab==='import'   && <ImportPanel/>}
    </div>
  );
}