// src/admin/components/CategoryModal.jsx
import { useState } from 'react';

export default function CategoryModal({ categories, onClose, onCreate, onDelete }){
  const [name, setName] = useState('');

  function handleSave(){
    const trimmed = name.trim();
    if(!trimmed){ alert('Введите название категории'); return; }
    if(categories.includes(trimmed)){ alert('Такая категория уже есть'); return; }
    onCreate(trimmed);
    setName('');
  }

  return (
    <div className="adm-modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="adm-modal-card">
        <button className="adm-modal-close" onClick={onClose}>&times;</button>
        <h2>Категории товаров</h2>

        <label className="adm-field">
          <span className="adm-modal-label">Новая категория</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Напитки" />
        </label>
        <button className="adm-btn-primary" style={{ width: '100%', marginBottom: 18 }} onClick={handleSave}>
          Добавить категорию
        </button>

        <span className="adm-modal-label">Существующие категории</span>
        <ul className="adm-modal-items">
          {categories.length === 0 ? (
            <li><span className="adm-muted">Категорий пока нет</span></li>
          ) : categories.map(c => (
            <li key={c}>
              <span>{c}</span>
              <button className="adm-cat-del" onClick={() => onDelete(c)}>Удалить</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
