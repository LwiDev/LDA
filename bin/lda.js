#!/usr/bin/env node

import { Command } from "commander";
import { runInit } from "../lib/commands/init.js";
import { runCrud } from "../lib/commands/crud.js";
import { runTheme } from "../lib/commands/theme.js";
import { runPreview } from "../lib/commands/preview.js";
import { runSync } from "../lib/commands/sync.js";

const program = new Command();

program
  .name("lda")
  .description("LwiDev Assistant")
  .version("1.0.0");

program
  .command("init")
  .description("Crée un nouveau projet SvelteKit avec ou sans panneau d'administration")
  .action(runInit);

program
  .command("crud <name>")
  .description("Générer une section CRUD complète")
  .action(runCrud);

program
  .command("theme <color>")
  .description("Changer la couleur principale du thème")
  .action(runTheme);

program
  .command("preview")
  .description("Lancer le mode vitrine / démo client")
  .option("-p, --port <number>", "Port du serveur de démo", "5555")
  .action(runPreview);

program
  .command("sync")
  .description("Synchronise le projet avec la dernière version de AdminTemplate")
  .option("--force", "Forcer la mise à jour sans confirmation")
  .option("--dry", "Simulation sans modification")
  .option("--silent", "Mode silencieux")
  .action(runSync);

program.parse();
