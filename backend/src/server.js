import "dotenv/config";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Joi from "joi";
import { query } from "./db.js";
import { requireAuth } from "./auth.js";

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/auth/register", async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    fullName: Joi.string().max(200).allow("", null)
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: "bad_request", details: error.details });

  const passwordHash = await bcrypt.hash(value.password, 12);

  try {
    const r = await query(
      `INSERT INTO users(email, password_hash, full_name)
       VALUES ($1,$2,$3)
       RETURNING id, email, full_name, created_at`,
      [value.email, passwordHash, value.fullName || null]
    );
    return res.status(201).json({ user: r.rows[0] });
  } catch (e) {
    if (String(e?.code) === "23505") return res.status(409).json({ error: "email_taken" });
    return res.status(500).json({ error: "server_error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: "bad_request" });

  const userRes = await query(
    `SELECT id, email, password_hash
     FROM users
     WHERE email=$1 AND is_active=true`,
    [value.email]
  );
  const user = userRes.rows[0];
  if (!user) return res.status(401).json({ error: "invalid_credentials" });

  const ok = await bcrypt.compare(value.password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return res.json({ token });
});

app.get("/api/me", requireAuth, async (req, res) => {
  const u = await query(
    `SELECT id, email, full_name, created_at
     FROM users
     WHERE id=$1`,
    [req.user.sub]
  );
  return res.json({ user: u.rows[0] || null });
});

app.get("/api/products", async (_req, res) => {
  const r = await query(
    `SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        v.id AS variant_id,
        v.sku,
        v.price_cents,
        v.currency,
        v.stock_qty
     FROM products p
     JOIN product_variants v ON v.product_id = p.id
     WHERE p.is_active=true AND v.is_active=true
     ORDER BY p.created_at DESC
     LIMIT 100`,
    []
  );

  const items = r.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    variant: {
      id: row.variant_id,
      sku: row.sku,
      priceCents: row.price_cents,
      currency: row.currency,
      stockQty: row.stock_qty
    }
  }));

  return res.json({ items });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API listening on :${port}`));

