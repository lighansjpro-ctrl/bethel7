const { getStore } = require("@netlify/blobs");

const TYPES      = ["participants", "benevoles", "soutiens", "prieres"];
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "bethel7admin";

function corsHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  };
}

function ok(body, extra)  { return { statusCode:200, headers:{...corsHeaders(),...(extra||{})}, body:JSON.stringify(body) }; }
function err(code, msg)   { return { statusCode:code, headers:corsHeaders(), body:JSON.stringify({ error:msg }) }; }

async function getData(store, type) {
  try { const r = await store.get(type, { type:"text" }); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
async function saveData(store, type, data) { await store.set(type, JSON.stringify(data)); }

function body(event) {
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body,"base64").toString() : (event.body||"{}");
    return JSON.parse(raw);
  } catch { return {}; }
}

function path(event) {
  let p = event.path || "";
  p = p.replace(/^\/.netlify\/functions\/api/,"").replace(/^\/api/,"");
  return p || "/";
}

function adminOk(event) {
  const pw = (event.queryStringParameters||{}).password || (event.headers||{})["x-admin-password"];
  return pw === ADMIN_PASS;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode:200, headers:corsHeaders(), body:"" };

  const store  = getStore("bethel7");
  const method = event.httpMethod;
  const p      = path(event);

  try {
    // GET /stats
    if (p === "/stats" && method === "GET") {
      const stats = {};
      for (const t of TYPES) stats[t] = (await getData(store, t)).length;
      return ok(stats);
    }

    // POST /register/:type
    if (p.startsWith("/register/") && method === "POST") {
      const type = p.split("/")[2];
      if (!TYPES.includes(type)) return err(400, "Type invalide");
      const b = body(event);
      if (!b || !Object.keys(b).length) return err(400, "Données manquantes");
      const list = await getData(store, type);
      list.push({ ...b, id:Date.now(), date:new Date().toLocaleString("fr-FR",{timeZone:"Europe/Paris"}) });
      await saveData(store, type, list);
      console.log(`[Bethel7] ${type} — ${b.prenom||"Anonyme"} ${b.nom||""}`);
      return ok({ success:true, total:list.length });
    }

    // Routes admin protégées
    if (!adminOk(event)) return err(401, "Mot de passe incorrect");

    // GET /admin/:type
    if (p.startsWith("/admin/") && method === "GET") {
      const type = p.split("/").filter(Boolean)[1];
      if (!TYPES.includes(type)) return err(400, "Type invalide");
      return ok(await getData(store, type));
    }

    // DELETE /admin/:type/:id
    if (p.startsWith("/admin/") && method === "DELETE") {
      const parts = p.split("/").filter(Boolean);
      const type = parts[1], id = parts[2];
      if (!TYPES.includes(type)) return err(400, "Type invalide");
      const filtered = (await getData(store, type)).filter(e => e.id.toString() !== id);
      await saveData(store, type, filtered);
      return ok({ success:true });
    }

    // GET /export/:type (CSV)
    if (p.startsWith("/export/") && method === "GET") {
      const type = p.split("/")[2];
      if (!TYPES.includes(type)) return err(400, "Type invalide");
      const list = await getData(store, type);
      if (!list.length) return { statusCode:200, headers:{"Content-Type":"text/plain"}, body:"Aucune donnée" };
      const keys = Object.keys(list[0]).filter(k => k !== "id");
      const csv  = [
        keys.join(";"),
        ...list.map(row => keys.map(k => `"${(row[k]||"").toString().replace(/"/g,'""')}"`).join(";")),
      ].join("\n");
      return { statusCode:200, headers:{
        "Content-Type":"text/csv; charset=utf-8",
        "Content-Disposition":`attachment; filename="bethel7_${type}.csv"`,
      }, body:"\uFEFF" + csv };
    }

    return err(404, "Route introuvable");

  } catch(e) {
    console.error("[Bethel7] Erreur:", e);
    return err(500, "Erreur serveur");
  }
};
