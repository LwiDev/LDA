import { intro, outro, spinner, text } from "@clack/prompts";
import fs from "fs-extra";
import path from "path";

export async function runCrud(name) {
  intro(`📦 Génération d'une section CRUD "${name}"...`);

  // Demander le slug anglais
  const slug = await text({
    message: "Quel est le slug anglais (ex: products pour Produits) ?",
    placeholder: name.toLowerCase(),
    defaultValue: name.toLowerCase()
  });

  if (!slug || typeof slug !== 'string') {
    console.error("\n❌ Slug invalide.\n");
    process.exit(1);
  }

  const s = spinner();

  // Vérifier qu'on est dans un projet SvelteKit
  if (!fs.existsSync("src/routes")) {
    console.error("\n❌ Ce n'est pas un projet SvelteKit valide.");
    console.error("Assure-toi d'exécuter cette commande depuis la racine d'un projet SvelteKit.\n");
    process.exit(1);
  }

  // Créer le dossier de routes
  const routePath = path.join("src/routes/admin", slug);
  if (fs.existsSync(routePath)) {
    console.error(`\n❌ Le dossier "${routePath}" existe déjà.\n`);
    process.exit(1);
  }

  s.start(`📁 Création du dossier ${routePath}...`);
  fs.mkdirSync(routePath, { recursive: true });
  s.stop("✅ Dossier créé");

  // Créer +page.server.ts
  s.start("📝 Création de +page.server.ts...");
  const pageServerContent = `import { ${slug} } from "$lib/server/models/${slug}";

export async function load() {
  const items = await ${slug}.getAll();

  return {
    ${slug}: items
  };
}

export const actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get("name");

    await ${slug}.create({ name });

    return { success: true };
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id");

    await ${slug}.delete(id);

    return { success: true };
  }
};
`;
  fs.writeFileSync(path.join(routePath, "+page.server.ts"), pageServerContent, "utf-8");
  s.stop("✅ +page.server.ts créé");

  // Créer +page.svelte
  s.start("📝 Création de +page.svelte...");
  const pageSvelteContent = `<script>
  export let data;
</script>

<h2 class="text-2xl font-semibold mb-4">${name}</h2>

<div class="mb-6">
  <form method="POST" action="?/create" class="flex gap-2">
    <input
      type="text"
      name="name"
      placeholder="Nouveau nom..."
      class="border px-3 py-2 rounded"
      required
    />
    <button type="submit" class="bg-accent-9 text-white px-4 py-2 rounded hover:bg-accent-10">
      Ajouter
    </button>
  </form>
</div>

<table class="min-w-full border border-gray-200 text-sm">
  <thead class="bg-accent-3/30">
    <tr>
      <th class="p-2 text-left">ID</th>
      <th class="p-2 text-left">Nom</th>
      <th class="p-2 text-left">Créé le</th>
      <th class="p-2 text-left">Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each data.${slug} as item}
      <tr class="border-t">
        <td class="p-2">{item.id}</td>
        <td class="p-2">{item.name}</td>
        <td class="p-2">{new Date(item.createdAt).toLocaleDateString()}</td>
        <td class="p-2">
          <form method="POST" action="?/delete" class="inline">
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" class="text-red-500 hover:underline">
              Supprimer
            </button>
          </form>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#if data.${slug}.length === 0}
  <p class="text-center text-gray-500 mt-4">Aucun élément trouvé.</p>
{/if}
`;
  fs.writeFileSync(path.join(routePath, "+page.svelte"), pageSvelteContent, "utf-8");
  s.stop("✅ +page.svelte créé");

  // Créer le modèle
  const modelsPath = path.join("src/lib/server/models", `${slug}.ts`);
  s.start(`📝 Création du modèle ${slug}.ts...`);

  if (!fs.existsSync("src/lib/server/models")) {
    fs.mkdirSync("src/lib/server/models", { recursive: true });
  }

  const modelContent = `import { db } from "../db";

export const ${slug} = {
  async getAll() {
    const collection = db.collection("${slug}");
    return await collection.find().toArray();
  },

  async getById(id: string) {
    const collection = db.collection("${slug}");
    return await collection.findOne({ _id: id });
  },

  async create(data: { name: string }) {
    const collection = db.collection("${slug}");
    const item = {
      name: data.name,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await collection.insertOne(item);
    return { ...item, id: result.insertedId };
  },

  async update(id: string, data: Partial<{ name: string }>) {
    const collection = db.collection("${slug}");
    await collection.updateOne(
      { _id: id },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return await this.getById(id);
  },

  async delete(id: string) {
    const collection = db.collection("${slug}");
    await collection.deleteOne({ _id: id });
    return true;
  }
};
`;
  fs.writeFileSync(modelsPath, modelContent, "utf-8");
  s.stop("✅ Modèle créé");

  console.log(`\n✅ CRUD "${name}" créé avec succès !\n`);
  console.log("Fichiers créés :");
  console.log(`  - ${routePath}/+page.server.ts`);
  console.log(`  - ${routePath}/+page.svelte`);
  console.log(`  - ${modelsPath}\n`);
  console.log("💡 N'oublie pas d'ajouter un lien vers /${slug} dans ta sidebar !\n");

  outro("✨ CRUD prêt !");
}
