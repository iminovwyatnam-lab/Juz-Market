export function normalizeSearch(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

// Небольшие опечатки и перестановка соседних букв: «телефно» → «телефон».
function distance(a, b) {
  const rows = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i++) rows[i][0] = i;
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[a.length][b.length];
}

export function searchProducts(products, query = '') {
  const normalized = normalizeSearch(query).slice(0, 160);
  if (!normalized) return products;
  const terms = normalized.split(' ').filter(Boolean);
  return products.map((product, index) => {
    const title = normalizeSearch(product.name || product.title);
    const text = normalizeSearch([title, product.category, product.brand, product.model, product.shortDescription,
      product.description || product.desc, product.sellerName,
      ...(Array.isArray(product.specifications) ? product.specifications.map(item => `${item.name} ${item.value}`) : Object.entries(product.specifications || {}).map(([name, value]) => `${name} ${value}`))].join(' '));
    const words = text.split(' ');
    let score = title === normalized ? 1000 : title.includes(normalized) ? 500 : 0;
    for (const term of terms) {
      if (title.includes(term)) { score += 100; continue; }
      if (text.includes(term)) { score += 40; continue; }
      const maxDistance = term.length >= 8 ? 2 : term.length >= 4 ? 1 : 0;
      if (!maxDistance || !words.some(word => Math.abs(word.length - term.length) <= maxDistance && distance(term, word) <= maxDistance)) return null;
      score += 10;
    }
    return { product, score, index };
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.index - b.index).map(item => item.product);
}
