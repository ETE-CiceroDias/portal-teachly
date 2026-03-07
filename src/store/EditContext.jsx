// store/EditContext.jsx
// Contexto global de edição — qualquer componente pode registrar
// campos editáveis e salvá-los no banco via uma única função.
import { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

const EditCtx = createContext(null);
export const useEdit = () => useContext(EditCtx);

export function EditProvider({ children }) {
  const [editMode, setEditMode] = useState(false);

  // Salva qualquer campo numa tabela do Supabase
  const saveField = useCallback(async ({ tabela, id, campo, valor }) => {
    if (!id) return;
    const { error } = await supabase.from(tabela).update({ [campo]: valor }).eq('id', id);
    if (error) console.error('EditContext save error:', error);
  }, []);

  return (
    <EditCtx.Provider value={{ editMode, setEditMode, saveField }}>
      {children}
    </EditCtx.Provider>
  );
}

// ── Componente EditableText — usa o contexto ──────────────────
// Quando editMode=true, vira input/textarea inline
// Quando editMode=false, renderiza o texto normal
export function ET({ // EditableText
  value,
  onChange,
  onBlurSave,
  tag: Tag = 'span',
  multiline = false,
  placeholder = 'Clique para editar...',
  style = {},
  className = '',
  ...props
}) {
  const { editMode } = useEdit();
  const [local, setLocal] = useState(value);

  const handleBlur = () => {
    if (onBlurSave && local !== value) onBlurSave(local);
  };

  if (!editMode) {
    return (
      <Tag className={className} style={style} {...props}>
        {value || <span style={{ opacity:0.4, fontStyle:'italic' }}>{placeholder}</span>}
      </Tag>
    );
  }

  if (multiline) {
    return (
      <textarea
        value={local}
        onChange={e => { setLocal(e.target.value); onChange?.(e.target.value); }}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        style={{
          background:'transparent', border:'none',
          borderBottom:'1px dashed var(--accent)',
          outline:'none', fontFamily:'inherit',
          fontSize:'inherit', color:'inherit',
          lineHeight:'inherit', resize:'none',
          width:'100%', ...style,
        }}
      />
    );
  }

  return (
    <input
      value={local}
      onChange={e => { setLocal(e.target.value); onChange?.(e.target.value); }}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      style={{
        background:'transparent', border:'none',
        borderBottom:'1px dashed var(--accent)',
        outline:'none', fontFamily:'inherit',
        fontSize:'inherit', color:'inherit',
        width:'100%', ...style,
      }}
    />
  );
}
