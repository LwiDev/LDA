import { intro, outro, spinner, confirm, note } from "@clack/prompts";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import { getAdminTemplateOrExit } from "../utils/envCheck.js";

const DEFAULT_CONFIG = {
  sync: {
    include: [
      "src/lib/layouts",
      "src/lib/components/ui",
      "src/lib/stores",
      "src/lib/utils",
      "src/lib/theme.css"
    ],
    exclude: [
      "src/routes/admin",
      "src/lib/models",
      "src/lib/server"
    ]
  }
};

/**
 * Charge la configuration de synchronisation
 */
function loadSyncConfig() {
  const configPath = path.resolve(".ldarc");

  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      return config.sync || DEFAULT_CONFIG.sync;
    } catch (error) {
      console.warn("⚠️  Erreur lors de la lecture de .ldarc, utilisation de la config par défaut");
      return DEFAULT_CONFIG.sync;
    }
  }

  return DEFAULT_CONFIG.sync;
}

/**
 * Vérifie si un fichier doit être exclu
 */
function shouldExclude(filePath, excludePatterns) {
  return excludePatterns.some(pattern => filePath.includes(pattern));
}

/**
 * Compare deux fichiers
 */
function filesAreDifferent(file1, file2) {
  if (!fs.existsSync(file1) || !fs.existsSync(file2)) {
    return true;
  }

  const content1 = fs.readFileSync(file1, "utf-8");
  const content2 = fs.readFileSync(file2, "utf-8");

  return content1 !== content2;
}

/**
 * Collecte tous les fichiers à synchroniser
 */
function collectFilesToSync(templatePath, projectPath, includePatterns, excludePatterns) {
  const filesToSync = [];

  for (const pattern of includePatterns) {
    const sourcePath = path.join(templatePath, pattern);

    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    const stat = fs.statSync(sourcePath);

    if (stat.isFile()) {
      // C'est un fichier unique
      const targetPath = path.join(projectPath, pattern);

      if (shouldExclude(pattern, excludePatterns)) {
        continue;
      }

      if (filesAreDifferent(sourcePath, targetPath)) {
        filesToSync.push({
          source: sourcePath,
          target: targetPath,
          relativePath: pattern
        });
      }
    } else if (stat.isDirectory()) {
      // C'est un dossier, parcourir récursivement
      const files = fs.readdirSync(sourcePath, { recursive: true });

      for (const file of files) {
        const fullSourcePath = path.join(sourcePath, file);
        const fullTargetPath = path.join(projectPath, pattern, file);
        const relativePath = path.join(pattern, file);

        // Ignorer les dossiers
        if (fs.statSync(fullSourcePath).isDirectory()) {
          continue;
        }

        if (shouldExclude(relativePath, excludePatterns)) {
          continue;
        }

        if (filesAreDifferent(fullSourcePath, fullTargetPath)) {
          filesToSync.push({
            source: fullSourcePath,
            target: fullTargetPath,
            relativePath: relativePath
          });
        }
      }
    }
  }

  return filesToSync;
}

/**
 * Crée une sauvegarde d'un fichier
 */
function backupFile(filePath, backupDir) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const relativePath = path.relative(process.cwd(), filePath);
  const backupPath = path.join(backupDir, relativePath);

  fs.ensureDirSync(path.dirname(backupPath));
  fs.copySync(filePath, backupPath);
}

export async function runSync(options) {
  intro("🔄 Synchronisation du projet avec AdminTemplate...");

  const isDryRun = options.dry || false;
  const isForce = options.force || false;
  const isSilent = options.silent || false;

  // Vérifier qu'on est dans un projet SvelteKit
  if (!fs.existsSync("src")) {
    console.error("\n❌ Ce n'est pas un projet SvelteKit valide.");
    console.error("Assure-toi d'exécuter cette commande depuis la racine d'un projet SvelteKit.\n");
    process.exit(1);
  }

  const s = spinner();

  // 1. Récupérer AdminTemplate
  const template = getAdminTemplateOrExit();
  let templatePath;

  if (template.source === "local") {
    templatePath = template.path;
    s.start("✅ AdminTemplate trouvé localement");
    s.stop("✅ AdminTemplate trouvé localement");
  } else {
    // Cloner temporairement AdminTemplate
    const tmpTemplatePath = path.resolve(".tmp-admin-template");

    if (fs.existsSync(tmpTemplatePath)) {
      fs.removeSync(tmpTemplatePath);
    }

    s.start("📥 Clonage d'AdminTemplate depuis GitHub...");
    try {
      const token = process.env.GITHUB_TOKEN;
      execSync(
        `git clone --depth 1 https://${token}@github.com/LwiDev/AdminTemplate ${tmpTemplatePath}`,
        { stdio: "pipe" }
      );
      templatePath = tmpTemplatePath;
      s.stop("✅ AdminTemplate cloné");
    } catch (error) {
      s.stop("❌ Erreur lors du clonage");
      console.error(error);
      process.exit(1);
    }
  }

  // 2. Charger la configuration
  const syncConfig = loadSyncConfig();

  if (!isSilent) {
    note(
      `Dossiers inclus: ${syncConfig.include.join(", ")}\nDossiers exclus: ${syncConfig.exclude.join(", ")}`,
      "Configuration de synchronisation"
    );
  }

  // 3. Collecter les fichiers à synchroniser
  s.start("🔍 Analyse des différences...");
  const filesToSync = collectFilesToSync(
    templatePath,
    process.cwd(),
    syncConfig.include,
    syncConfig.exclude
  );
  s.stop(`🔍 ${filesToSync.length} fichier(s) trouvé(s) avec des différences`);

  if (filesToSync.length === 0) {
    console.log("\n✅ Votre projet est déjà à jour !\n");

    // Nettoyer le dossier temporaire si nécessaire
    if (template.source === "github" && fs.existsSync(templatePath)) {
      fs.removeSync(templatePath);
    }

    outro("✨ Aucune mise à jour nécessaire");
    return;
  }

  // Mode dry-run : afficher ce qui serait fait
  if (isDryRun) {
    console.log("\n📋 Mode simulation - Fichiers qui seraient mis à jour :\n");
    for (const file of filesToSync) {
      console.log(`  • ${file.relativePath}`);
    }
    console.log("");

    // Nettoyer le dossier temporaire si nécessaire
    if (template.source === "github" && fs.existsSync(templatePath)) {
      fs.removeSync(templatePath);
    }

    outro("✨ Simulation terminée");
    return;
  }

  // 4. Créer le dossier de sauvegarde
  const timestamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const backupDir = path.resolve(".backup/lda-sync", timestamp);
  fs.ensureDirSync(backupDir);

  // 5. Synchroniser les fichiers
  let updatedCount = 0;
  let ignoredCount = 0;

  for (const file of filesToSync) {
    let shouldUpdate = isForce;

    // Demander confirmation si pas en mode force ni silent
    if (!isForce && !isSilent) {
      const answer = await confirm({
        message: `⚠️  ${file.relativePath} a changé. Souhaitez-vous le mettre à jour ?`
      });

      shouldUpdate = answer;
    } else if (isSilent) {
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      // Sauvegarder le fichier actuel
      backupFile(file.target, backupDir);

      // Copier le nouveau fichier
      fs.ensureDirSync(path.dirname(file.target));
      fs.copySync(file.source, file.target);

      console.log(`✅ ${file.relativePath} mis à jour`);
      updatedCount++;
    } else {
      console.log(`⚠️  Ignoré : ${file.relativePath}`);
      ignoredCount++;
    }
  }

  // Nettoyer le dossier temporaire si nécessaire
  if (template.source === "github" && fs.existsSync(templatePath)) {
    fs.removeSync(templatePath);
  }

  // 6. Afficher le résumé
  console.log(`\n🔄 Synchronisation du projet avec AdminTemplate terminée !`);
  console.log(`✅ ${updatedCount} fichier(s) mis à jour`);
  if (ignoredCount > 0) {
    console.log(`⚠️  ${ignoredCount} fichier(s) ignoré(s)`);
  }
  console.log(`💾 Sauvegardes dans .backup/lda-sync/${timestamp}/\n`);

  outro("✨ Sync terminé avec succès");
}
