# ✦ BETHEL 7 — Le Réveil des Sentinelles
## Plateforme d'inscription — Guide de mise en ligne Netlify

---

## 📁 Structure du projet

```
bethel7/
├── netlify.toml              ← Configuration Netlify
├── index.html                ← Plateforme d'inscription (page principale)
├── admin.html                ← Tableau de bord admin
└── flyer.webp                ← Affiche de l'événement
```

---

## 🚀 Mise en ligne en 10 minutes (sans coder)

### ÉTAPE 1 — Créer un compte GitHub (gratuit)
1. Allez sur **github.com**
2. Cliquez **Sign up** → créez un compte gratuit
3. Vérifiez votre e-mail

### ÉTAPE 2 — Créer un dépôt et uploader les fichiers
1. Sur GitHub, cliquez le bouton vert **New** (ou **+** → New repository)
2. Nommez-le : `bethel7-inscription`
3. Laissez tout par défaut → cliquez **Create repository**
4. Sur la page du dépôt → cliquez **uploading an existing file**
5. **Glissez-déposez TOUS les fichiers ET dossiers** de ce projet
6. Cliquez **Commit changes**

### ÉTAPE 3 — Créer un compte Netlify (gratuit)
1. Allez sur **netlify.com**
2. Cliquez **Sign up** → connectez-vous avec votre compte GitHub
3. Autorisez Netlify à accéder à GitHub

### ÉTAPE 4 — Déployer le site
1. Sur Netlify → cliquez **Add new site** → **Import an existing project**
2. Choisissez **GitHub**
3. Sélectionnez le dépôt `bethel7-inscription`
4. Vérifiez les paramètres :
   - **Base directory** : laisser vide
   - **Build command** : laisser vide
   - **Publish directory** : `.`
5. Cliquez **Deploy site**
6. Attendez 1–2 minutes → votre site est en ligne ! 🎉

### ÉTAPE 5 — Configurer le mot de passe admin
1. Dans Netlify → allez dans **Site configuration** → **Environment variables**
2. Cliquez **Add a variable**
3. Clé : `ADMIN_PASSWORD`  Valeur : *votre mot de passe choisi*
4. Cliquez **Save** → puis **Trigger deploy** pour redeployer

### ÉTAPE 6 — (Optionnel) Personnaliser votre URL
1. Dans Netlify → **Site configuration** → **Domain management**
2. Cliquez **Options** → **Edit site name**
3. Changez en : `bethel7-sentinelles` (ou ce que vous voulez)
4. Votre URL devient : **bethel7-sentinelles.netlify.app**

---

## 🔐 Accès Admin

URL admin : **https://votre-site.netlify.app/admin.html**

Fonctionnalités :
- Voir toutes les inscriptions en temps réel
- Rechercher par nom, email, etc.
- Exporter en CSV (compatible Excel / Google Sheets)
- Supprimer une inscription

Mot de passe par défaut : `bethel7admin`
*(changez-le dans les variables d'environnement Netlify !)*

---

## 📋 Les 4 formulaires

| Formulaire | Ce qui est collecté |
|---|---|
| ✶ J'y serai | Nom, email, téléphone, ville, nombre de places, source |
| 🤝 Je sers | Nom, email, téléphone, domaines de service, disponibilité, motivation |
| ✦ Je soutiens | Nom, email, téléphone, type de soutien, contact préféré, message |
| 🙏 Prière | Catégorie, requête, urgence, anonyme ou non, accord de prière |

---

## 💾 Stockage des données

Les inscriptions sont stockées dans **Netlify Blobs** — le système de stockage
natif de Netlify, inclus gratuitement. Aucune base de données externe requise.

---

## ❓ Problèmes fréquents

**Le site s'affiche mais les formulaires ne fonctionnent pas**
→ Vérifiez que le dossier `netlify/functions/` a bien été uploadé sur GitHub

**Erreur 404 sur /api/stats**
→ Vérifiez que `netlify.toml` est présent à la racine du projet

**Mot de passe admin refusé**
→ Vérifiez la variable `ADMIN_PASSWORD` dans Netlify → Environment variables

**Erreur « Deploy directory 'bethel7-netlify/public' does not exist »**
→ Les fichiers du site se trouvent à la racine du dépôt, pas dans un dossier
`bethel7-netlify/public`. Dans Netlify → **Build & Deploy → Build Settings**,
laissez **Base directory** et **Build command** vides, puis définissez
**Publish directory** sur `.`. Le fichier `netlify.toml` à la racine contient
également ce réglage et doit rester inclus dans le dépôt.

---

*Bethel 7 — Le Réveil des Sentinelles · Lighans Jordy Great Ministries*
