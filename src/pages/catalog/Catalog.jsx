import { translate as t, useLanguage } from '../../preferences/preferences';
import { useSearchParams } from 'react-router-dom';
import CategorySidebar from '../../components/catalog/CategorySidebar';
import Products from '../../components/main/Products';
import '../../components/catalog/catalog.css';

export default function Catalog() {
    useLanguage();
    // выбранная категория хранится в адресе: /catalog?category=Обувь
    // — так работает кнопка «назад» и можно делиться ссылкой
    const [params, setParams] = useSearchParams();
    const active = params.get('category');
    const query = (params.get('q') || '').slice(0, 160);

    function handleSelect(name) {
        const next = new URLSearchParams(params);
        if (name) next.set('category', name); else next.delete('category');
        setParams(next);
    }

    return (
        <div className="catalog-page">
            <CategorySidebar active={active} onSelect={handleSelect} />

            <section className="catalog-content">
                <h1 className="catalog-title">{t(active) || t("Все товары")}</h1>
                <Products category={active} query={query} />
            </section>
        </div>
    );
}
