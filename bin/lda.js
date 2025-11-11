#!/usr/bin/env node

import { Command } from "commander";
import { runInit } from "../lib/commands/init.js";
import { runCrud } from "../lib/commands/crud.js";
import { runTheme } from "../lib/commands/theme.js";
import { runPreview } from "../lib/commands/preview.js";

const program = new Command();

program
  .name("lda")
  .description("LwiDev Assistant")
  .version("1.0.0");

program
  .command("init")
  .description("Créer un nouveau projet")
  .action(runInit);

program
  .command("crud")
  .description("Générer une section CRUD complète")
  .action(runCrud);

program
  .command("theme <color>")
  .description("Changer la couleur principale du thème")
  .action(runTheme);

program
  .command("preview")
  .description("Lancer le mode vitrine / démo client")
  .action(runPreview);

program.parse();
