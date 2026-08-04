// src/admin/pages/ProductsPage.jsx
import { useEffect, useState } from 'react';
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getCategories, createCategory, deleteCategory
} from '../adminApi';
import ProductModal from '../components/ProductModal';
import CategoryModal from '../components/CategoryModal';

export default function ProductsPage(){
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  async function refresh(){
    try{
      const [p, c] = await Promise.all([getProducts(), getCategories()]);
      setProducts(p);
      setCategories(c);
      setError(null);
    } catch(e){
      setError('Не удалось связаться с API-сервером — проверь, что запущен `npm start` в папке juz-market-api (порт 4000).');
    }
  }

  useEffect(() => { refresh(); }, []);

  function openNewProduct(){ setEditingProduct(null); setShowProductModal(true); }
  function openEditProduct(p){ setEditingProduct(p); setShowProductModal(true); }

  async function handleSaveProduct(formData){
    try{
      if(editingProduct) await updateProduct(editingProduct.id, formData);
      else await createProduct(formData);
      setShowProductModal(false);
      await refresh();
    } catch(e){
      alert('Не удалось сохранить товар — проверь, что API-сервер запущен.');
    }
  }

  async function handleDeleteProduct(id){
    if(!confirm('Удалить этот товар из каталога?')) return;
    try{ await deleteProduct(id); await refresh(); }
    catch(e){ alert('Не удалось удалить товар.'); }
  }

  async function handleCreateCategory(name){
    try{ await createCategory(name); await refresh(); }
    catch(e){ alert('Не удалось добавить категорию.'); }
  }

  async function handleDeleteCategory(name){
    if(!confirm(`Удалить категорию "${name}"? Товары с этой категорией сохранят её как текст.`)) return;
    try{ await deleteCategory(name); await refresh(); }
    catch(e){ alert('Не удалось удалить категорию.'); }
  }

  return (
    <section>
      <header className="adm-view-head">
        <p className="adm-view-sub">Каталог магазина</p>
        <div className="adm-head-actions">
          <button className="adm-btn-secondary" onClick={() => setShowCategoryModal(true)}>+ Категория</button>
          <button className="adm-btn-primary" onClick={openNewProduct}>+ Добавить товар</button>
        </div>
      </header>

      {error && <p className="adm-field-hint" style={{ marginBottom: 16 }}>{error}</p>}

      <div className="adm-panel">
        <div className="adm-table-wrap">
          <table>
            <thead>
              <tr><th></th><th>Товар</th><th>Категория</th><th>Цена</th><th>Остаток</th><th></th></tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="6" className="adm-empty-row">Товаров пока нет — нажми "+ Добавить товар"</td></tr>
              ) : products.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.image ? (
                      <img src={`http://localhost:4000${p.image}`} alt={p.name} style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <div style={{ width: 42, height: 42, borderRadius: 8, background: 'var(--adm-bg)' }} />
                    )}
                  </td>
                  <td>{p.name}</td>
                  <td className="adm-muted">{p.category}</td>
                  <td className="adm-mono">{p.price.toLocaleString('ru-RU')} сум</td>
                  <td className="adm-mono">{p.stock}</td>
                  <td>
                    <button className="adm-row-btn" onClick={() => openEditProduct(p)}>Изменить</button>
                    <button className="adm-row-btn adm-row-btn-danger" onClick={() => handleDeleteProduct(p.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showProductModal && (
        <ProductModal product={editingProduct} categories={categories} onClose={() => setShowProductModal(false)} onSave={handleSaveProduct} />
      )}
      {showCategoryModal && (
        <CategoryModal categories={categories} onClose={() => setShowCategoryModal(false)} onCreate={handleCreateCategory} onDelete={handleDeleteCategory} />
      )}
    </section>
  );
}
