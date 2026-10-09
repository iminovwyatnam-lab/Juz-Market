import { useState } from 'react';

export default function CatalogSearch({ query, onSearch }) {
  const [value, setValue] = useState(query);
  return <form className="catalog-search" role="search" onSubmit={event => { event.preventDefault(); onSearch(value.trim()); }}>
    <input id="catalog-search" type="search" aria-label="Поиск товаров в каталоге" placeholder="Название товара, бренд или категория" maxLength={160} value={value} onChange={event => setValue(event.target.value)} />
    <button type="submit">Найти</button>
    {query && <button type="button" className="catalog-search-clear" onClick={() => { setValue(''); onSearch(''); }}>Сбросить</button>}
  </form>;
}
