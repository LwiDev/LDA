import { intro, outro, spinner } from "@clack/prompts";
import fs from "fs-extra";
import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export async function runPreview() {
  intro("🧭 Lancement du mode Preview...");

  const tempDir = ".preview";
  const localTemplate = path.resolve("../AdminTemplate");
  const demoPreviewPath = path.join(localTemplate, "demo/preview");
  const token = process.env.GITHUB_TOKEN;

  // Déterminer la source du template
  let templateSource = null;

  if (fs.existsSync(localTemplate)) {
    templateSource = "local";
  } else if (token) {
    templateSource = "github";
  } else {
    console.error(
      "\n❌ Aucun template trouvé. Place ton dossier AdminTemplate à côté du CLI ou configure GITHUB_TOKEN dans ton .env\n"
    );
    process.exit(1);
  }

  // Supprimer .preview s'il existe déjà pour repartir sur une base propre
  if (fs.existsSync(tempDir)) {
    const s = spinner();
    s.start("🧹 Nettoyage du dossier .preview existant...");
    fs.removeSync(tempDir);
    s.stop("✅ Dossier .preview nettoyé");
  }

  // 1. Copier tout AdminTemplate vers .preview
  const s = spinner();

  if (templateSource === "local") {
    s.start("📦 Copie du template AdminTemplate...");
    try {
      fs.copySync(localTemplate, tempDir);
      s.stop("✅ AdminTemplate copié");
    } catch (error) {
      s.stop("❌ Erreur lors de la copie");
      console.error(error);
      process.exit(1);
    }
  } else if (templateSource === "github") {
    s.start("🔐 Clonage depuis GitHub...");
    try {
      execSync(
        `git clone --depth 1 https://${token}@github.com/LwiDev/AdminTemplate ${tempDir}`,
        { stdio: "inherit" }
      );
      s.stop("✅ AdminTemplate cloné depuis GitHub");
    } catch (error) {
      s.stop("❌ Erreur lors du clonage");
      console.error(error);
      process.exit(1);
    }
  }

  // 2. Vérifier si demo/preview existe et fusionner son contenu dans .preview/src/
  const previewDemoInCopy = path.join(tempDir, "demo/preview");

  if (fs.existsSync(previewDemoInCopy)) {
    const s2 = spinner();
    s2.start("🧩 Fusion du mode démo dans .preview/src/...");
    try {
      const previewSrc = path.join(tempDir, "src");

      // Copier lib si existe
      const demoLib = path.join(previewDemoInCopy, "lib");
      if (fs.existsSync(demoLib)) {
        fs.copySync(demoLib, path.join(previewSrc, "lib"), { overwrite: true });
      }

      // Copier routes si existe
      const demoRoutes = path.join(previewDemoInCopy, "routes");
      if (fs.existsSync(demoRoutes)) {
        fs.copySync(demoRoutes, path.join(previewSrc, "routes"), { overwrite: true });
      }

      // Copier les fichiers à la racine de demo/preview vers src/ (comme hooks.server.ts)
      const demoFiles = fs.readdirSync(previewDemoInCopy);
      for (const file of demoFiles) {
        const filePath = path.join(previewDemoInCopy, file);
        // Copier seulement les fichiers (pas les dossiers) avec extensions .ts, .js, .svelte
        if (fs.statSync(filePath).isFile() && /\.(ts|js|svelte)$/.test(file)) {
          fs.copySync(filePath, path.join(previewSrc, file), { overwrite: true });
        }
      }

      s2.stop("✅ Mode démo fusionné");
    } catch (error) {
      s2.stop("⚠️  Erreur lors de la fusion");
      console.error(error);
    }
  } else {
    console.error("\n⚠️  Aucun dossier demo/preview trouvé dans AdminTemplate.");
    console.error("Veuillez l'ajouter avant d'utiliser lda preview.\n");
    process.exit(1);
  }

  // 3. Installation des dépendances
  const s3 = spinner();
  s3.start("📦 Installation des dépendances...");
  try {
    execSync(`cd ${tempDir} && pnpm install`, {
      stdio: "inherit"
    });
    s3.stop("✅ Dépendances installées");
  } catch (error) {
    s3.stop("⚠️  Erreur lors de l'installation");
    console.error(error);
  }

  // Messages de succès
  console.log("\n🧱 Mode démo fusionné avec AdminTemplate");
  console.log("🌐 Serveur de démo sur http://localhost:5555");
  console.log("💡 Pour arrêter le serveur, utilisez Ctrl+C\n");

  // 4. Démarrage du serveur de démo
  try {
    execSync(`cd ${tempDir} && pnpm run dev --port 5555`, {
      stdio: "inherit"
    });
  } catch (error) {
    // L'utilisateur a probablement fait Ctrl+C
    console.log("\n👋 Serveur arrêté");
  }

  outro("Mode démo terminé !");
}
