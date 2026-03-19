CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  email         CITEXT NOT NULL UNIQUE,
  password_hash TEXT   NOT NULL,
  full_name     TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  parent_id  BIGINT REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE products (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_variants (
  id            BIGSERIAL PRIMARY KEY,
  product_id    BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku           TEXT NOT NULL UNIQUE,
  price_cents   INT NOT NULL CHECK (price_cents >= 0),
  currency      CHAR(3) NOT NULL DEFAULT 'EUR',
  stock_qty     INT NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE product_categories (
  product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE TABLE carts (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cart_items (
  id                 BIGSERIAL PRIMARY KEY,
  cart_id            BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_variant_id BIGINT NOT NULL REFERENCES product_variants(id),
  quantity           INT NOT NULL CHECK (quantity > 0),
  UNIQUE (cart_id, product_variant_id)
);

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending','paid','fulfilled','cancelled','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE orders (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES users(id),
  status         order_status NOT NULL DEFAULT 'pending',
  currency       CHAR(3) NOT NULL DEFAULT 'EUR',
  subtotal_cents INT NOT NULL CHECK (subtotal_cents >= 0),
  total_cents    INT NOT NULL CHECK (total_cents >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id                 BIGSERIAL PRIMARY KEY,
  order_id           BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_variant_id BIGINT NOT NULL REFERENCES product_variants(id),
  sku_snapshot       TEXT NOT NULL,
  name_snapshot      TEXT NOT NULL,
  unit_price_cents   INT NOT NULL CHECK (unit_price_cents >= 0),
  quantity           INT NOT NULL CHECK (quantity > 0)
);

CREATE INDEX idx_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
