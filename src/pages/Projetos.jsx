import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { Trash, PencilSimple, Plus, FolderOpen, X } from '@phosphor-icons/react';
import { ProjetoCard } from '../components/ProjetoCard.jsx';
import { FormProjeto } from '../components/FormProjeto.jsx';

function EmptyState({ icon, title, description, action }) {
  return (
    <div className="projetos-empty">
      <div className="projetos-empty-icon">{icon}</div>
      <h3 className="projetos-empty-title">{title}</h3>
      <p className="projetos-empty-desc">{description}</p>
      {action && (
        <button className="projetos-empty-btn" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

export function Projetos({ activeTurmaId, turmaLabel, turmaModulo, userId }) {
  const [projetos, setProjetos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [novoModal, setNovoModal] = useState(false);
  const [edicao, setEdicao] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  
  useEffect(() => {
    if (!activeTurmaId) { 
      setProjetos([]);
      setCarregando(false);
      return; 
    }
    carregarProjetos();
  }, [activeTurmaId]);
  
  const carregarProjetos = async () => {
    setCarregando(true);
    try {
      let query = supabase
        .from('projetos')
        .select('*')
        .eq('turma_id', activeTurmaId)
        .eq('visivel', true)
        .order('criado_em', { ascending: false });
      
      if (filtro !== 'todos') {
        query = query.eq('status', filtro);
      }
      
      const { data, error } = await query;
      if (!error) setProjetos(data || []);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setCarregando(false);
    }
  };
  
  const criarProjeto = async (form) => {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .insert([{
          ...form,
          turma_id: activeTurmaId,
          professor_id: userId
        }])
        .select();
      
      if (!error) {
        setProjetos([data[0], ...projetos]);
        setNovoModal(false);
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };
  
  const atualizarProjeto = async (id, form) => {
    try {
      const { error } = await supabase
        .from('projetos')
        .update(form)
        .eq('id', id);
      
      if (!error) {
        setProjetos(projetos.map(p => p.id === id ? { ...p, ...form } : p));
        setEdicao(null);
        setNovoModal(false);
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };
  
  const deletarProjeto = async (id) => {
    if (!confirm('Tem certeza que quer deletar este projeto?')) return;
    
    try {
      const { error } = await supabase
        .from('projetos')
        .update({ visivel: false })
        .eq('id', id);
      
      if (!error) setProjetos(projetos.filter(p => p.id !== id));
    } catch (err) {
      console.error('Erro:', err);
    }
  };
  
  const stats = {
    total: projetos.length,
    planejamento: projetos.filter(p => p.status === 'planejamento').length,
    em_progresso: projetos.filter(p => p.status === 'em_progresso').length,
    concluído: projetos.filter(p => p.status === 'concluído').length
  };
  
  if (carregando) {
    return <div style={{ padding: '2rem' }}>Carregando...</div>;
  }
  
  return (
    <div className="projetos-container">
      <div className="projetos-header">
        <div className="projetos-header-left">
          <h1>Projetos</h1>
          <p>
            {turmaModulo && turmaLabel ? `${turmaModulo} · ${turmaLabel} · ` : ''}
            {stats.total} projeto{stats.total !== 1 ? 's' : ''}
            {stats.em_progresso > 0 && ` · ${stats.em_progresso} em andamento`}
          </p>
        </div>
        <button 
          className="projetos-btn-novo"
          onClick={() => {
            setEdicao(null);
            setNovoModal(true);
          }}
        >
          <Plus size={20} />
          Novo Projeto
        </button>
      </div>
      
      <div className="projetos-filtros">
        {[
          { label: 'Todos', value: 'todos' },
          { label: '🏗️ Planejamento', value: 'planejamento', count: stats.planejamento },
          { label: '⚙️ Em Progresso', value: 'em_progresso', count: stats.em_progresso },
          { label: '✅ Concluído', value: 'concluído', count: stats.concluído }
        ].map(f => (
          <button
            key={f.value}
            className={`${filtro === f.value ? "active" : ""}`}
            onClick={() => setFiltro(f.value)}
          >
            {f.label} {f.count !== undefined && `(${f.count})`}
          </button>
        ))}
      </div>
      
      {projetos.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={64} color="currentColor" />}
          title="Nenhum projeto"
          description={filtro === 'todos' 
            ? "Crie seu primeiro projeto para começar a gerenciar entregas e avaliações." 
            : `Nenhum projeto com status "${filtro}" no momento.`}
          action={{
            label: 'Criar Projeto',
            onClick: () => {
              setEdicao(null);
              setNovoModal(true);
            }
          }}
        />
      ) : (
        <div className="projetos-grid">
          {projetos.map(p => (
            <ProjetoCard 
              key={p.id} 
              projeto={p}
              onEdit={() => { setEdicao(p); setNovoModal(true); }}
              onDelete={() => deletarProjeto(p.id)}
            />
          ))}
        </div>
      )}
      
      {novoModal && (
        <FormProjeto
          projeto={edicao}
          onSave={(form) => {
            if (edicao) atualizarProjeto(edicao.id, form);
            else criarProjeto(form);
          }}
          onClose={() => { setNovoModal(false); setEdicao(null); }}
        />
      )}
    </div>
  );
}