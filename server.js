// ══════════════════════════════════════════════════════════════════
//  BETHEL 7 — Le Réveil des Sentinelles
//  Serveur Express — Version Render.com
// ══════════════════════════════════════════════════════════════════

const express = require("express");
const fs      = require("fs");
const path    = require("path");

const app        = express();
const PORT       = process.env.PORT || 3000;
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "bethel7admin";
const DATA_DIR   = path.join(__dirname, "data");
const PUBLIC_DIR = fs.existsSync(path.join(__dirname, "public")) ? path.join(__dirname, "public") : __dirname;
const TYPES      = ["participants", "benevoles", "soutiens", "prieres"];

// ── Initialisation dossiers ─────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
TYPES.forEach(t => {
  const f = path.join(DATA_DIR, `${t}.json`);
  if (!fs.existsSync(f)) fs.writeFileSync(f, "[]");
});

// ── Middleware ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// ── Helpers ─────────────────────────────────────────────────────────
function getData(type) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${type}.json`), "utf8")); }
  catch { return []; }
}
function saveData(type, data) {
  fs.writeFileSync(path.join(DATA_DIR, `${type}.json`), JSON.stringify(data, null, 2));
}
function checkAdmin(req, res) {
  const pw = req.query.password || req.headers["x-admin-password"];
  if (pw !== ADMIN_PASS) { res.status(401).json({ error:"Mot de passe incorrect" }); return false; }
  return true;
}

// ── Routes publiques ────────────────────────────────────────────────

// Statistiques
app.get("/api/stats", (req, res) => {
  const stats = {};
  TYPES.forEach(t => stats[t] = getData(t).length);
  res.json(stats);
});

// Inscription
app.post("/api/register/:type", (req, res) => {
  const { type } = req.params;
  if (!TYPES.includes(type)) return res.status(400).json({ error:"Type invalide" });
  const body = req.body;
  if (!body || !Object.keys(body).length) return res.status(400).json({ error:"Données manquantes" });
  const list  = getData(type);
  const entry = { ...body, id:Date.now(), date:new Date().toLocaleString("fr-FR", { timeZone:"Europe/Paris" }) };
  list.push(entry);
  saveData(type, list);
  console.log(`[Bethel7] ${type} — ${body.prenom||"Anonyme"} ${body.nom||""}`);
  res.json({ success:true, total:list.length });
});

// ── Routes admin (protégées) ────────────────────────────────────────

// Voir toutes les inscriptions
app.get("/api/admin/:type", (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { type } = req.params;
  if (!TYPES.includes(type)) return res.status(400).json({ error:"Type invalide" });
  res.json(getData(type));
});

// Supprimer une inscription
app.delete("/api/admin/:type/:id", (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { type, id } = req.params;
  if (!TYPES.includes(type)) return res.status(400).json({ error:"Type invalide" });
  const filtered = getData(type).filter(e => e.id.toString() !== id);
  saveData(type, filtered);
  res.json({ success:true });
});

// Export CSV
app.get("/api/export/:type", (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { type } = req.params;
  if (!TYPES.includes(type)) return res.status(400).json({ error:"Type invalide" });
  const list = getData(type);
  if (!list.length) return res.send("Aucune donnée");
  const keys = Object.keys(list[0]).filter(k => k !== "id");
  const csv  = [
    keys.join(";"),
    ...list.map(row => keys.map(k => `"${(row[k]||"").toString().replace(/"/g,'""')}"`).join(";")),
  ].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="bethel7_${type}.csv"`);
  res.send("\uFEFF" + csv);
});

// ── Démarrage ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║  ✦ BETHEL 7 — Le Réveil des Sentinelles     ║");
  console.log(`║  Serveur     →  http://localhost:${PORT}         ║`);
  console.log(`║  Admin       →  http://localhost:${PORT}/admin.html ║`);
  console.log(`║  Mot de passe: ${ADMIN_PASS.padEnd(30)}║`);
  console.log("╚══════════════════════════════════════════════╝\n");
});
