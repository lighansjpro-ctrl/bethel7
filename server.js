// ══════════════════════════════════════════════════════════════════
//  BETHEL 7 — Le Réveil des Sentinelles
//  Serveur Express + MongoDB Atlas — Données permanentes
// ══════════════════════════════════════════════════════════════════

const express         = require("express");
const { MongoClient } = require("mongodb");
const path            = require("path");
const fs              = require("fs");

const app        = express();
const PORT       = process.env.PORT || 3000;
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "bethel7admin";
const MONGO_URI  = process.env.MONGO_URI;
const PUBLIC_DIR = fs.existsSync(path.join(__dirname, "public"))
  ? path.join(__dirname, "public") : __dirname;
const TYPES = ["participants", "benevoles", "soutiens", "prieres"];

// ── Connexion MongoDB ───────────────────────────────────────────────
let db;
async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db("bethel7");
  console.log("✅ Connecté à MongoDB Atlas");
}

// ── Middleware ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// ── Helpers ─────────────────────────────────────────────────────────
function checkAdmin(req, res) {
  const pw = req.query.password || req.headers["x-admin-password"];
  if (pw !== ADMIN_PASS) { res.status(401).json({ error:"Mot de passe incorrect" }); return false; }
  return true;
}

// ── Routes publiques ────────────────────────────────────────────────

app.get("/api/stats", async (req, res) => {
  try {
    const stats = {};
    for (const t of TYPES) stats[t] = await db.collection(t).countDocuments();
    res.json(stats);
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

app.post("/api/register/:type", async (req, res) => {
  try {
    const { type } = req.params;
    if (!TYPES.includes(type)) return res.status(400).json({ error:"Type invalide" });
    const body = req.body;
    if (!body || !Object.keys(body).length) return res.status(400).json({ error:"Données manquantes" });
    const entry = { ...body, date:new Date().toLocaleString("fr-FR",{timeZone:"Europe/Paris"}), createdAt:new Date() };
    await db.collection(type).insertOne(entry);
    const total = await db.collection(type).countDocuments();
    console.log(`[Bethel7] ${type} — ${body.prenom||"Anonyme"} ${body.nom||""}`);
    res.json({ success:true, total });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

// ── Routes admin (protégées) ────────────────────────────────────────

app.get("/api/admin/:type", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const { type } = req.params;
    if (!TYPES.includes(type)) return res.status(400).json({ error:"Type invalide" });
    const list = await db.collection(type).find({}).sort({ createdAt:-1 }).toArray();
    res.json(list);
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

app.delete("/api/admin/:type/:id", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const { type, id } = req.params;
    if (!TYPES.includes(type)) return res.status(400).json({ error:"Type invalide" });
    const { ObjectId } = require("mongodb");
    await db.collection(type).deleteOne({ _id:new ObjectId(id) });
    res.json({ success:true });
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

app.get("/api/export/:type", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const { type } = req.params;
    if (!TYPES.includes(type)) return res.status(400).json({ error:"Type invalide" });
    const list = await db.collection(type).find({}).sort({ createdAt:-1 }).toArray();
    if (!list.length) return res.send("Aucune donnée");
    const keys = Object.keys(list[0]).filter(k => !["_id","createdAt"].includes(k));
    const csv = [
      keys.join(";"),
      ...list.map(row => keys.map(k => `"${(row[k]||"").toString().replace(/"/g,'""')}"`).join(";"))
    ].join("\n");
    res.setHeader("Content-Type","text/csv; charset=utf-8");
    res.setHeader("Content-Disposition",`attachment; filename="bethel7_${type}.csv"`);
    res.send("\uFEFF" + csv);
  } catch(e) { res.status(500).json({ error:"Erreur serveur" }); }
});

// ── Démarrage ────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("\n╔══════════════════════════════════════════════╗");
    console.log("║  ✦ BETHEL 7 — Le Réveil des Sentinelles     ║");
    console.log(`║  Serveur  →  http://localhost:${PORT}            ║`);
    console.log("╚══════════════════════════════════════════════╝\n");
  });
}).catch(err => {
  console.error("❌ Erreur MongoDB:", err.message);
  process.exit(1);
});
