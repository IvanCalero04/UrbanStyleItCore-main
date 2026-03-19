INSERT INTO categories (name, slug) VALUES
  ('Hombre', 'hombre'),
  ('Mujer', 'mujer'),
  ('Accesorios', 'accesorios')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description) VALUES
  ('Chaqueta Techwear V1', 'chaqueta-techwear-v1', 'Chaqueta ligera con estética cyber y bolsillos funcionales.'),
  ('Pantalón Cargo Modular', 'pantalon-cargo-modular', 'Corte urbano con módulos y ajuste cómodo.'),
  ('Gorra Urban Core', 'gorra-urban-core', 'Accesorio minimal con identidad de sistema.'),
  ('Sudadera Oversize Neural', 'sudadera-oversize-neural', 'Tejido premium, drop shoulder, look futurista.')
ON CONFLICT (slug) DO NOTHING;

-- Variantes (1 por producto para arrancar)
INSERT INTO product_variants (product_id, sku, price_cents, currency, stock_qty)
SELECT p.id, CONCAT('SKU-', upper(replace(p.slug,'-','_'))), v.price_cents, 'EUR', v.stock_qty
FROM products p
JOIN (VALUES
  ('chaqueta-techwear-v1', 12900, 25),
  ('pantalon-cargo-modular', 8900, 40),
  ('gorra-urban-core', 2900, 100),
  ('sudadera-oversize-neural', 5900, 30)
) AS v(slug, price_cents, stock_qty)
ON v.slug = p.slug
ON CONFLICT (sku) DO NOTHING;

-- Categorías ↔ productos (mapping simple)
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id
FROM products p
JOIN categories c ON (
  (p.slug IN ('chaqueta-techwear-v1','pantalon-cargo-modular','sudadera-oversize-neural') AND c.slug IN ('hombre','mujer'))
  OR
  (p.slug IN ('gorra-urban-core') AND c.slug IN ('accesorios'))
)
ON CONFLICT DO NOTHING;
