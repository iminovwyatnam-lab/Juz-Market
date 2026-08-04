// src/admin/components/ProductModal.jsx
import { useEffect, useState } from 'react';

const API_ORIGIN = 'http://localhost:4000';

export default function ProductModal({ product, categories, onClose, onSave }){
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    setName(product ? product.name : '');
    setCategory(product ? product.category : (categories[0] || ''));
    setPrice(product ? product.price : '');
    setStock(product ? product.stock : '');
    setDescription(product ? (product.description || '') : '');
    setImageFile(null);
    setPreview(product && product.image ? `${API_ORIGIN}${product.image}` : null);
  }, [product, categories]);

  function handleFileChange(e){
    const file = e.target.files[0];
    if(!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleSave(){
    if(!name.trim()){ alert('Введите название товара'); return; }
    if(!category){ alert('Сначала создайте и выберите категорию'); return; }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('category', category);
    formData.append('price', Number(price) || 0);
    formData.append('stock', Number(stock) || 0);
    formData.append('description', description);
    if(imageFile) formData.append('image', imageFile);

    onSave(formData);
  }

  return (
    <div className="adm-modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="adm-modal-card">
        <button className="adm-modal-close" onClick={onClose}>&times;</button>
        <h2>{product ? 'Изменить товар' : 'Новый товар'}</h2>

        <label className="adm-field">
          <span className="adm-modal-label">Фото товара</span>
          {preview && (
            <img src={preview} alt="Превью товара" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10, marginTop: 6, marginBottom: 8 }} />
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </label>

        <label className="adm-field">
          <span className="adm-modal-label">Название</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Яблоки Голден" />
        </label>

        <label className="adm-field">
          <span className="adm-modal-label">Описание</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Коротко опиши товар" rows={3} />
        </label>

        <label className="adm-field">
          <span className="adm-modal-label">Категория</span>
          {categories.length === 0 ? (
            <>
              <select disabled><option>Сначала создайте категорию</option></select>
              <span className="adm-field-hint">Нет ни одной категории — создай её кнопкой "+ Категория".</span>
            </>
          ) : (
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </label>

        <div className="adm-field-row">
          <label className="adm-field">
            <span className="adm-modal-label">Цена (сум)</span>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
          </label>
          <label className="adm-field">
            <span className="adm-modal-label">Остаток</span>
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
          </label>
        </div>

        <button className="adm-btn-primary" style={{ width: '100%' }} onClick={handleSave}>
          Сохранить товар
        </button>
      </div>
    </div>
  );
}
