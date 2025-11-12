import { intro, outro, spinner, text, confirm } from "@clack/prompts";
import fs from "fs-extra";
import { execSync } from "child_process";
import path from "path";

export async function runInit() {
  intro("✨ Création d'un nouveau projet LwiDev");

  // 1. Demander le nom du projet
  const projectName = await text({
    message: "Nom du projet :",
    placeholder: "mon-projet",
    validate: (value) => {
      if (!value) return "Le nom du projet est requis";
      if (!/^[a-z0-9-]+$/.test(value)) {
        return "Le nom doit contenir uniquement des lettres minuscules, chiffres et tirets";
      }
      return undefined;
    }
  });

  if (!projectName || typeof projectName === 'symbol') {
    console.error("\n❌ Création annulée.\n");
    process.exit(1);
  }

  const projectPath = path.resolve(projectName);

  // Vérifier si le projet existe déjà
  if (fs.existsSync(projectPath)) {
    console.error(`\n❌ Le dossier "${projectName}" existe déjà.\n`);
    process.exit(1);
  }

  // 2. Demander si inclure le panneau admin
  const includeAdmin = await confirm({
    message: "Souhaites-tu inclure le panneau d'administration ?",
    initialValue: true
  });

  if (typeof includeAdmin === 'symbol') {
    console.error("\n❌ Création annulée.\n");
    process.exit(1);
  }

  // 3. Demander si inclure une base de données
  const includeDatabase = await confirm({
    message: "Souhaites-tu inclure une base de données ?",
    initialValue: false
  });

  if (typeof includeDatabase === 'symbol') {
    console.error("\n❌ Création annulée.\n");
    process.exit(1);
  }

  const s = spinner();

  // 4. Créer le projet SvelteKit de base
  s.start("📦 Création du projet SvelteKit...");
  try {
    // Créer le projet avec pnpm create svelte
    execSync(
      `pnpm create svelte@latest ${projectName} --template skeleton --types typescript --no-prettier --no-eslint --no-playwright --no-vitest`,
      { stdio: "pipe" }
    );
    s.stop("✅ Projet SvelteKit créé");
  } catch (error) {
    s.stop("❌ Erreur lors de la création du projet");
    console.error(error);
    process.exit(1);
  }

  // 5. Ajouter Tailwind v4
  s.start("🎨 Configuration de Tailwind v4...");
  try {
    // Créer src/app.css avec Tailwind v4
    const tailwindCss = `@import "tailwindcss";
`;
    fs.writeFileSync(path.join(projectPath, "src/app.css"), tailwindCss, "utf-8");

    // Importer app.css dans le layout
    const layoutPath = path.join(projectPath, "src/routes/+layout.svelte");
    if (fs.existsSync(layoutPath)) {
      const layoutContent = `<script>
  import '../app.css';
</script>

<slot />
`;
      fs.writeFileSync(layoutPath, layoutContent, "utf-8");
    }

    // Installer Tailwind CSS v4
    execSync(`cd ${projectPath} && pnpm add -D tailwindcss@next @tailwindcss/vite@next`, {
      stdio: "pipe"
    });

    // Mettre à jour vite.config.ts
    const viteConfigPath = path.join(projectPath, "vite.config.ts");
    if (fs.existsSync(viteConfigPath)) {
      const viteConfig = `import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
\tplugins: [tailwindcss(), sveltekit()]
});
`;
      fs.writeFileSync(viteConfigPath, viteConfig, "utf-8");
    }

    s.stop("✅ Tailwind v4 configuré");
  } catch (error) {
    s.stop("⚠️  Erreur lors de la configuration de Tailwind");
    console.error(error);
  }

  // 6. Si admin = Oui, copier les fichiers AdminTemplate
  if (includeAdmin) {
    s.start("🔧 Installation du panneau d'administration...");
    try {
      const localTemplate = path.resolve("../AdminTemplate");

      if (!fs.existsSync(localTemplate)) {
        s.stop("⚠️  AdminTemplate introuvable localement");
        console.error("\n❌ Le dossier AdminTemplate est requis pour installer le panneau admin.");
        console.error("Place-le à côté du CLI (/Users/lwi/Dev/AdminTemplate)\n");
        process.exit(1);
      }

      // Copier les dossiers nécessaires
      const filesToCopy = [
        { src: "src/routes/admin", dest: "src/routes/admin" },
        { src: "src/lib/components/ui", dest: "src/lib/components/ui" },
        { src: "src/lib/layouts", dest: "src/lib/layouts" },
        { src: "src/lib/stores", dest: "src/lib/stores" },
        { src: "src/lib/utils", dest: "src/lib/utils" },
        { src: "src/lib/theme.css", dest: "src/lib/theme.css" },
        { src: "src/admin.config.ts", dest: "src/admin.config.ts" }
      ];

      for (const file of filesToCopy) {
        const sourcePath = path.join(localTemplate, file.src);
        const targetPath = path.join(projectPath, file.dest);

        if (fs.existsSync(sourcePath)) {
          fs.copySync(sourcePath, targetPath);
        }
      }

      // Mettre à jour admin.config.ts avec le nom du projet
      const adminConfigPath = path.join(projectPath, "src/admin.config.ts");
      if (fs.existsSync(adminConfigPath)) {
        let adminConfig = fs.readFileSync(adminConfigPath, "utf-8");
        adminConfig = adminConfig.replace(
          /siteName:\s*"[^"]+"/,
          `siteName: "${projectName}"`
        );
        fs.writeFileSync(adminConfigPath, adminConfig, "utf-8");
      } else {
        // Créer admin.config.ts si inexistant
        const defaultAdminConfig = `export const adminConfig = {
  siteName: "${projectName}",
  theme: "jade",
  layout: "hybrid"
};
`;
        fs.writeFileSync(adminConfigPath, defaultAdminConfig, "utf-8");
      }

      // Installer les dépendances nécessaires pour le panneau admin
      execSync(`cd ${projectPath} && pnpm add better-auth lucide-svelte`, {
        stdio: "pipe"
      });

      s.stop("✅ Panneau d'administration installé");
    } catch (error) {
      s.stop("⚠️  Erreur lors de l'installation du panneau admin");
      console.error(error);
    }
  }

  // 7. Si base de données = Oui, configurer MongoDB
  if (includeDatabase) {
    s.start("🗄️  Configuration de MongoDB...");
    try {
      // Créer src/lib/server/db.ts
      const dbDir = path.join(projectPath, "src/lib/server");
      fs.ensureDirSync(dbDir);

      const dbContent = `import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new MongoClient(process.env.MONGO_URL!);
export const db = client.db(process.env.MONGO_DB || 'app');
`;
      fs.writeFileSync(path.join(dbDir, "db.ts"), dbContent, "utf-8");

      // Ajouter les variables d'environnement
      const envPath = path.join(projectPath, ".env");
      const envContent = `# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
MONGO_DB=${projectName}
`;
      fs.writeFileSync(envPath, envContent, "utf-8");

      // Installer mongodb
      execSync(`cd ${projectPath} && pnpm add mongodb dotenv`, {
        stdio: "pipe"
      });

      s.stop("✅ MongoDB configuré");
    } catch (error) {
      s.stop("⚠️  Erreur lors de la configuration MongoDB");
      console.error(error);
    }
  }

  // 8. Installer toutes les dépendances
  s.start("📦 Installation des dépendances...");
  try {
    execSync(`cd ${projectPath} && pnpm install`, {
      stdio: "pipe"
    });
    s.stop("✅ Dépendances installées");
  } catch (error) {
    s.stop("⚠️  Erreur lors de l'installation des dépendances");
  }

  // 9. Afficher le résumé
  console.log(`\n🚀 Projet "${projectName}" créé avec succès !`);
  console.log(`🧩 Mode : ${includeAdmin ? "avec panneau d'administration" : "sans panneau d'administration"}`);
  console.log(`🗄️  Base de données : ${includeDatabase ? "MongoDB" : "Aucune"}`);
  console.log("\nProchaines étapes :");
  console.log(`  cd ${projectName}`);
  console.log(`  pnpm run dev\n`);

  outro("✨ Projet prêt !");
}
