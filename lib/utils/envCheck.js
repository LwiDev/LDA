import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

/**
 * Vérifie si AdminTemplate est disponible (localement ou via GitHub token)
 * @returns {Object} { source: 'local' | 'github' | null, path: string | null }
 */
export function checkAdminTemplate() {
  const localTemplate = path.resolve("../AdminTemplate");
  const token = process.env.GITHUB_TOKEN;

  if (fs.existsSync(localTemplate)) {
    return { source: "local", path: localTemplate };
  } else if (token) {
    return { source: "github", path: null };
  }

  return { source: null, path: null };
}

/**
 * Vérifie les prérequis globaux et affiche des messages clairs
 * @param {Object} options - Options de vérification
 * @param {boolean} options.requireTemplate - Si AdminTemplate est requis
 * @returns {boolean} true si tout est OK, false sinon
 */
export function checkEnvironment(options = {}) {
  const { requireTemplate = false } = options;

  if (requireTemplate) {
    const template = checkAdminTemplate();

    if (!template.source) {
      console.error(
        "\n❌ Aucun template AdminTemplate trouvé.\n"
      );
      console.error("Solutions :");
      console.error("  1. Place ton dossier AdminTemplate à côté du CLI (/Users/lwi/Dev/AdminTemplate)");
      console.error("  2. Configure GITHUB_TOKEN dans ton fichier .env\n");
      return false;
    }
  }

  return true;
}

/**
 * Vérifie et retourne la source AdminTemplate
 * Arrête l'exécution si non disponible
 * @returns {Object} { source: 'local' | 'github', path: string | null }
 */
export function getAdminTemplateOrExit() {
  const template = checkAdminTemplate();

  if (!template.source) {
    console.error(
      "\n❌ Aucun template AdminTemplate trouvé.\n"
    );
    console.error("Solutions :");
    console.error("  1. Place ton dossier AdminTemplate à côté du CLI");
    console.error("  2. Configure GITHUB_TOKEN dans ton fichier .env\n");
    process.exit(1);
  }

  return template;
}
