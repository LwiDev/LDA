# 🚀 Setup – LwiDev Admin CLI (v2)

## 🎯 Objectif

Créer le **CLI LDA** (`lwidev-admin-cli`) qui permet de générer, configurer et automatiser la création de panneaux d’administration basés sur le projet `AdminTemplate`.

Ce CLI doit :
- copier ou cloner le repo `AdminTemplate` depuis GitHub,
- générer le fichier `.env`, la connexion MongoDB et la clé `AUTH_SECRET`,
- permettre la création automatique de modules CRUD (pages, modèles, actions),
- générer des thèmes et layouts personnalisés,
- inclure un mode **preview** (vitrine client),
- fonctionner sur **Mac, Windows, Linux**, et avec **bun / pnpm / npm**.

---

## 🧱 Étape 1 — Initialisation du projet CLI

1. Crée un nouveau dossier `lda` :
   ```bash
   mkdir lda && cd lda
   ```

2. Initialise un projet Node :
   ```bash
   bun init -y
   ```
   ou
   ```bash
   pnpm init
   ```

3. Crée la structure suivante :
   ```
   lda/
   ├─ bin/
   │  └─ lda.js
   ├─ lib/
   │  ├─ commands/
   │  │  ├─ init.ts
   │  │  ├─ crud.ts
   │  │  ├─ theme.ts
   │  │  ├─ preview.ts
   │  │  └─ deploy.ts (futur)
   │  ├─ utils/
   │  │  ├─ generatePalette.ts
   │  │  ├─ copyTemplate.ts
   │  │  ├─ env.ts
   │  │  └─ prompt.ts
   ├─ templates/
   │  ├─ crud/
   │  ├─ base-site/
   │  └─ admin/
   ├─ package.json
   └─ README.md
   ```

4. Installe les dépendances :
   ```bash
   bun add commander @clack/prompts fs-extra mustache colorjs.io dotenv
   ```

---

## ⚙️ Étape 2 — Configuration du CLI

1. Dans `package.json`, ajoute :
   ```json
   {
     "name": "lda",
     "version": "1.0.0",
     "bin": {
       "lda": "./bin/lda.js"
     },
     "type": "module"
   }
   ```

2. Rends le fichier exécutable :
   ```bash
   chmod +x bin/lda.js
   ```

3. Contenu de base de `bin/lda.js` :
   ```js
   #!/usr/bin/env node
   import { Command } from "commander";
   import { runInit } from "../lib/commands/init.js";
   import { runCrud } from "../lib/commands/crud.js";
   import { runTheme } from "../lib/commands/theme.js";
   import { runPreview } from "../lib/commands/preview.js";

   const program = new Command();

   program
     .name("lda")
     .description("LwiDev Admin CLI")
     .version("1.0.0");

   program.command("init").description("Créer un nouveau projet").action(runInit);
   program.command("crud").description("Générer une section CRUD complète").action(runCrud);
   program.command("theme <color>").description("Changer la couleur principale du thème").action(runTheme);
   program.command("preview").description("Lancer le mode vitrine / démo client").action(runPreview);

   program.parse();
   ```

---

## 🧠 Étape 3 — Accès au template AdminTemplate

Les commandes `lda init` et `lda preview` doivent d’abord **tenter d’utiliser le dossier local `AdminTemplate`**, puis **cloner depuis GitHub avec un token privé** si absent.

Le token GitHub (`GITHUB_TOKEN`) est lu depuis ton fichier `.env`.

```ts
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const tempDir = ".preview";
const localTemplate = path.resolve("../AdminTemplate");
const token = process.env.GITHUB_TOKEN;

if (fs.existsSync(localTemplate)) {
  console.log("📦 Copie du template local AdminTemplate...");
  fs.copySync(localTemplate, tempDir);
} else if (token) {
  console.log("🔐 Clonage via token GitHub...");
  execSync(`git clone https://${token}@github.com/LwiDev/AdminTemplate ${tempDir}`, {
    stdio: "inherit"
  });
} else {
  console.error("❌ Aucun template trouvé. Place ton dossier AdminTemplate à côté du CLI ou configure GITHUB_TOKEN dans ton .env");
  process.exit(1);
}
```

---

## 🧩 Étape 4 — Commande `lda preview`

Fonctions :
- Vérifie si un dossier `.preview` existe
  - ✅ S’il existe, il le réutilise directement.
  - ❌ Sinon, il copie localement `AdminTemplate` ou le clone via token GitHub.
- Ajoute des modules de démonstration :
  - `users`, `products`, `orders`, `settings`
- Crée un petit fichier `mockData.ts` avec des données fictives.
- Désactive temporairement BetterAuth pour ne pas bloquer l’accès.
- Lance le serveur sur le port `5555` avec la commande `pnpm run dev -- --port 5555`.
- Ouvre le navigateur sur `http://localhost:5555`.

### Exemple (simplifié) :
```ts
// lib/commands/preview.ts
import { intro, outro, spinner } from "@clack/prompts";
import fs from "fs-extra";
import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

export async function runPreview() {
  intro("🧭 Lancement du mode Preview...");

  const tempDir = ".preview";
  const localTemplate = path.resolve("../AdminTemplate");
  const token = process.env.GITHUB_TOKEN;

  if (!fs.existsSync(tempDir)) {
    if (fs.existsSync(localTemplate)) {
      console.log("📦 Copie du template local AdminTemplate...");
      fs.copySync(localTemplate, tempDir);
    } else if (token) {
      console.log("🔐 Clonage via token GitHub...");
      execSync(`git clone https://${token}@github.com/LwiDev/AdminTemplate ${tempDir}`, {
        stdio: "inherit"
      });
    } else {
      console.error("❌ Aucun template trouvé. Place ton dossier AdminTemplate à côté du CLI ou configure GITHUB_TOKEN dans ton .env");
      process.exit(1);
    }
  }

  const s = spinner();
  s.start("Démarrage du serveur de démo...");
  execSync(`cd ${tempDir} && pnpm install && pnpm run dev -- --port 5555`, {
    stdio: "inherit"
  });
  s.stop("🚀 Serveur prêt sur http://localhost:5555");
  outro("Mode démo en cours !");
}
```

### But du mode Preview :
Ce mode sert de **vitrine client** pour présenter :
- Les layouts (sidebar, header, hybrid)
- Les thèmes et couleurs
- L’auth visible mais mockée
- Les modules CRUD typiques (`users`, `products`, `orders`)

---

## ✅ Étape finale — Tests

1. Crée un `.env` dans ton dossier `lda` :
   ```bash
   GITHUB_TOKEN=ghp_ton_token_personnel
   ```
2. Installe le CLI globalement :
   ```bash
   bun install -g .
   ```
3. Teste :
   ```bash
   lda init
   lda crud produits
   lda theme teal
   lda preview
   ```

---

> 🧩 **Note pour Claude Code** :
> - Implémente la logique de copie locale ou clone via token dans `lda init` et `lda preview`.
> - Ne jamais supprimer `.preview` automatiquement.
> - Code clair, modulaire, compatibl