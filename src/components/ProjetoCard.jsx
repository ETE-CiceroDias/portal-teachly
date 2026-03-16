import { Trash, PencilSimple, CalendarBlank, Clock } from '@phosphor-icons/react';

const STATUS_CONFIG = {
  planejamento: { cor: 'var(--text3)',  bg: 'var(--surface3)',  border: 'var(--border2)',      emoji: '🏗️',  label: 'Planejamento' },
  em_progresso: { cor: 'var(--amber)',  bg: 'var(--amber-bg)',  border: 'var(--amber-border)', emoji: '⚙️',  label: 'Em Progresso' },
  concluído:    { cor: 'var(--green)',  bg: 'var(--green-bg)',  border: 'var(--green-border)', emoji: '✅', label: 'Concluído'    },
};

export function ProjetoCard({ projeto, onEdit, onDelete }) {
  const status = STATUS_CONFIG[projeto.status] || STATUS_CONFIG.planejamento;

  const fmtDate = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const diasRestantes = (iso) => {
    if (!iso) return null;
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const target = new Date(iso + 'T00:00:00');
    const diff = Math.round((target - hoje) / 86400000);
    if (diff < 0)   return { texto: `${Math.abs(diff)}d atrasado`, urgente: true };
    if (diff === 0) return { texto: 'Hoje!',                       urgente: true };
    if (diff <= 3)  return { texto: `${diff}d restantes`,          urgente: true };
    return               { texto: `${diff}d restantes`,          urgente: false };
  };

  const days = diasRestantes(projeto.data_termino);

  return (
    <div className="projeto-card">
      <div className="projeto-card-head">
        <div className="projeto-card-title">{projeto.nome}</div>
        <span className="projeto-card-status"
          style={{ color: status.cor, background: status.bg, borderColor: status.border }}>
          {status.emoji} {status.label}
        </span>
      </div>

      {projeto.descricao && (
        <p className="projeto-card-desc">{projeto.descricao}</p>
      )}

      <div className="projeto-card-datas">
        <div className="projeto-card-data-item">
          <CalendarBlank size={13} style={{ color: 'var(--text3)' }} />
          <span className="projeto-card-data-label">Início</span>
          <span className="projeto-card-data-val">{fmtDate(projeto.data_inicio)}</span>
        </div>
        <div className="projeto-card-data-divider" />
        <div className="projeto-card-data-item">
          <CalendarBlank size={13} style={{ color: 'var(--text3)' }} />
          <span className="projeto-card-data-label">Término</span>
          <span className="projeto-card-data-val">{fmtDate(projeto.data_termino)}</span>
        </div>
      </div>

      {days && (
        <div className="projeto-card-countdown"
          style={{ color: days.urgente ? 'var(--red)' : 'var(--blue)' }}>
          <Clock size={13} />
          {days.texto}
        </div>
      )}

      <div className="projeto-card-actions">
        <button className="projeto-card-btn-edit" onClick={onEdit}>
          <PencilSimple size={15} /> Editar
        </button>
        <button className="projeto-card-btn-delete" onClick={onDelete}>
          <Trash size={15} />
        </button>
      </div>
    </div>
  );
}