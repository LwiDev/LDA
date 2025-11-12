import { intro, outro, spinner } from "@clack/prompts";
import fs from "fs-extra";
import path from "path";

const RADIX_COLORS = [
  "tomato", "red", "ruby", "crimson", "pink", "plum", "purple", "violet",
  "iris", "indigo", "blue", "cyan", "teal", "jade", "green", "grass",
  "brown", "bronze", "gold", "sky", "mint", "lime", "yellow", "amber", "orange"
];

export async function runTheme(color) {
  intro(`🎨 Changement du thème vers "${color}"...`);

  // Vérifier que la couleur est valide
  if (!RADIX_COLORS.includes(color)) {
    console.error(`\n❌ Couleur "${color}" invalide.\n`);
    console.error("Couleurs Radix disponibles :");
    console.error(RADIX_COLORS.join(", "));
    console.error("\n");
    process.exit(1);
  }

  const s = spinner();

  // Vérifier qu'on est dans un projet SvelteKit
  if (!fs.existsSync("src")) {
    console.error("\n❌ Ce n'est pas un projet SvelteKit valide.");
    console.error("Assure-toi d'exécuter cette commande depuis la racine d'un projet SvelteKit.\n");
    process.exit(1);
  }

  // Mettre à jour src/lib/stores/demoConfig.ts si existe
  const demoConfigPath = path.join("src/lib/stores/demoConfig.ts");
  if (fs.existsSync(demoConfigPath)) {
    s.start("📝 Mise à jour de demoConfig.ts...");
    try {
      let content = fs.readFileSync(demoConfigPath, "utf-8");

      // Remplacer la valeur de accent
      content = content.replace(
        /accent:\s*"[^"]+"/,
        `accent: "${color}"`
      );

      fs.writeFileSync(demoConfigPath, content, "utf-8");
      s.stop("✅ demoConfig.ts mis à jour");
    } catch (error) {
      s.stop("⚠️  Erreur lors de la mise à jour de demoConfig.ts");
    }
  }

  // Mettre à jour src/app.html si existe
  const appHtmlPath = path.join("src/app.html");
  if (fs.existsSync(appHtmlPath)) {
    s.start("📝 Mise à jour de app.html...");
    try {
      let content = fs.readFileSync(appHtmlPath, "utf-8");

      // Remplacer data-theme
      content = content.replace(
        /data-theme="[^"]+"/,
        `data-theme="${color}"`
      );

      fs.writeFileSync(appHtmlPath, content, "utf-8");
      s.stop("✅ app.html mis à jour");
    } catch (error) {
      s.stop("⚠️  Erreur lors de la mise à jour de app.html");
    }
  }

  // Mettre à jour src/admin.config.ts si existe
  const adminConfigPath = path.join("src/admin.config.ts");
  if (fs.existsSync(adminConfigPath)) {
    s.start("📝 Mise à jour de admin.config.ts...");
    try {
      let content = fs.readFileSync(adminConfigPath, "utf-8");

      // Remplacer la valeur de theme
      content = content.replace(
        /theme:\s*"[^"]+"/,
        `theme: "${color}"`
      );

      fs.writeFileSync(adminConfigPath, content, "utf-8");
      s.stop("✅ admin.config.ts mis à jour");
    } catch (error) {
      s.stop("⚠️  Erreur lors de la mise à jour de admin.config.ts");
    }
  }

  console.log(`\n🎨 Thème changé pour "${color}" !\n`);
  console.log("💡 Redémarre ton serveur de dev pour voir les changements.\n");

  outro("✨ Thème mis à jour !");
}
