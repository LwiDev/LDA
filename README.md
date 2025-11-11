# LDA - LwiDev Assistant

CLI pour générer et configurer des panneaux d'administration basés sur AdminTemplate.

## Installation

1. Cloner le projet et installer les dépendances :
```bash
cd lda-cli
pnpm install
```

2. Configurer le token GitHub (optionnel) :
```bash
cp .env.example .env
# Éditer .env et ajouter votre token GitHub
```

3. Installer le CLI globalement :
```bash
pnpm install -g .
```

## Configuration

Le CLI peut fonctionner de deux manières :

1. **Copie locale** : Si le dossier `AdminTemplate` est présent à côté de `lda-cli`, il sera copié directement.
2. **Clone GitHub** : Si le dossier local n'existe pas, le CLI utilisera le token GitHub pour cloner le repo privé.

### Token GitHub

Pour générer un token GitHub :
1. Aller sur https://github.com/settings/tokens
2. Créer un nouveau token avec les permissions `repo`
3. Ajouter le token dans votre fichier `.env`

## Commandes

### `lda preview`

Lance un serveur de démo sur le port 5555 avec le template AdminTemplate.

```bash
lda preview
```

**Fonctionnement :**
- Vérifie si `.preview` existe déjà (réutilisation)
- Sinon, copie locale ou clone via GitHub
- Installe les dépendances avec pnpm
- Lance le serveur sur http://localhost:5555

### `lda init` (à venir)

Créer un nouveau projet basé sur AdminTemplate.

### `lda crud` (à venir)

Générer une section CRUD complète.

### `lda theme <color>` (à venir)

Changer la couleur principale du thème.

## Développement

Pour tester le CLI en mode développement :

```bash
node bin/lda.js preview
```

## Structure du projet

```
lda-cli/
├─ bin/
│  └─ lda.js              # Point d'entrée du CLI
├─ lib/
│  ├─ commands/
│  │  ├─ init.js          # Commande init
│  │  ├─ crud.js          # Commande crud
│  │  ├─ theme.js         # Commande theme
│  │  └─ preview.js       # Commande preview
│  └─ utils/              # Utilitaires (à venir)
├─ templates/             # Templates de génération
├─ .env.example           # Exemple de configuration
├─ package.json
└─ README.md
```
