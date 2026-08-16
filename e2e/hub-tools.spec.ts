import { test, expect, type Page } from '@playwright/test';

async function createProfile(page: Page) {
  // Le portail peut migrer automatiquement `/legacy-profile.json` en local.
  // Le test doit commencer sans profil historique afin de couvrir la vraie
  // création puis la persistance de la fiche.
  await page.route('**/legacy-profile.json', (route) => route.fulfill({ status: 404, body: '{}' }));
  await page.addInitScript(() => {
    if (sessionStorage.getItem('__studio_hub_e2e_clean') === '1') return;
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('__studio_hub_e2e_clean', '1');
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Créer ma fiche personnage/i }).click();
  await page.getByLabel('Nom d’affichage').fill('Test Hub');
  await page.getByRole('button', { name: /Enregistrer la fiche/i }).click();
  await expect(page.getByRole('heading', { name: /Bienvenue, Test Hub/i })).toBeVisible();
}

async function installFakeFileSystem() {
  class FakeFileHandle {
    kind = 'file';
    constructor(public name: string, private bytes: Uint8Array) {}
    async getFile() {
      return new File([this.bytes], this.name);
    }
    async createWritable() {
      return {
        write: async (value: ArrayBuffer | string) => {
          this.bytes = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value);
        },
        close: async () => undefined,
      };
    }
  }

  class FakeDirectoryHandle {
    kind = 'directory';
    children = new Map<string, FakeDirectoryHandle | FakeFileHandle>();
    constructor(public name: string) {}
    async *entries() {
      for (const entry of this.children.entries()) yield entry;
    }
    async getDirectoryHandle(name: string, options: { create?: boolean } = {}) {
      const existing = this.children.get(name);
      if (existing?.kind === 'directory') return existing;
      if (!options.create) throw new Error(`Directory not found: ${name}`);
      const directory = new FakeDirectoryHandle(name);
      this.children.set(name, directory);
      return directory;
    }
    async getFileHandle(name: string, options: { create?: boolean } = {}) {
      const existing = this.children.get(name);
      if (existing?.kind === 'file') return existing;
      if (!options.create) throw new Error(`File not found: ${name}`);
      const file = new FakeFileHandle(name, new Uint8Array());
      this.children.set(name, file);
      return file;
    }
    async queryPermission() { return 'granted'; }
    async requestPermission() { return 'granted'; }
  }

  const workspace = new FakeDirectoryHandle('Atelier de test');
  const source = new FakeDirectoryHandle('Source OP-1');
  const target = new FakeDirectoryHandle('Cible de restauration');
  const tape = await source.getDirectoryHandle('tape', { create: true });
  const album = await source.getDirectoryHandle('album', { create: true });
  const drum = await source.getDirectoryHandle('drum', { create: true });
  const synth = await source.getDirectoryHandle('synth', { create: true });
  await (await tape.getFileHandle('track_1.aif', { create: true })).createWritable().then((writable) => writable.write('tape-test').then(() => writable.close()));
  await (await album.getFileHandle('side_a.aif', { create: true })).createWritable().then((writable) => writable.write('album-test').then(() => writable.close()));
  await (await drum.getFileHandle('kick.aif', { create: true })).createWritable().then((writable) => writable.write('drum-test').then(() => writable.close()));
  await (await synth.getFileHandle('lead.aif', { create: true })).createWritable().then((writable) => writable.write('synth-test').then(() => writable.close()));
  let pickerIndex = 0;
  (window as Window & { showDirectoryPicker: () => Promise<FakeDirectoryHandle>; __vaultE2E?: { target: FakeDirectoryHandle } }).showDirectoryPicker = async () => {
    const picked = [workspace, source, target][pickerIndex];
    pickerIndex += 1;
    if (!picked) throw new Error('No fake directory left');
    return picked;
  };
  (window as Window & { __vaultE2E?: { target: FakeDirectoryHandle } }).__vaultE2E = { target };
}

test('la fiche persistante ouvre le Hub des sept outils', async ({ page }) => {
  await createProfile(page);
  await expect(page.locator('.tools-grid .tool-card')).toHaveCount(7);

  for (const title of [
    'OP‑1 Studio',
    'EP‑133 Studio',
    'Éditeur d’image',
    'Éditeur de samples',
    'Services OP‑1',
    'Sons & transferts EP‑133',
    'Jeux & entraînement',
  ]) {
    await expect(page.locator('.tools-grid .tool-card').filter({ hasText: title })).toBeVisible();
  }

  await page.reload();
  await expect(page.getByRole('button', { name: /Ouvrir mes outils/i })).toBeVisible();
  await page.getByRole('button', { name: /Ouvrir mes outils/i }).click();
  await expect(page.getByRole('heading', { name: /Bienvenue, Test Hub/i })).toBeVisible();
});

test('les cartes spécialisées transmettent leur écran cible au bon studio', async ({ page }) => {
  await createProfile(page);

  const launches = [
    { title: 'OP‑1 Studio', target: /5175\// },
    { title: 'EP‑133 Studio', target: /5177\// },
    { title: 'Éditeur d’image', target: /5175\/.*hubTool=editor/ },
    { title: 'Éditeur de samples', target: /5175\/.*hubTool=sounds/ },
    { title: 'Services OP‑1', target: /5175\/.*hubTool=services/ },
    { title: 'Sons & transferts EP‑133', target: /5177\/.*hubTool=sounds/ },
    { title: 'Jeux & entraînement', target: /5177\/.*hubTool=game/ },
  ];

  for (const launch of launches) {
    const popupPromise = page.waitForEvent('popup');
    await page.locator('.tools-grid .tool-card').filter({ hasText: launch.title }).getByRole('button').click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    await expect(popup).toHaveURL(launch.target);
    await popup.close();
  }
});

test('le coffre local sauvegarde et restaure une sélection sans machine', async ({ page }) => {
  await page.addInitScript(installFakeFileSystem);
  await createProfile(page);

  await page.locator('.vault-workspace').getByRole('button', { name: 'Connecter' }).click();
  await expect(page.getByText('Espace Atelier de test connecté.')).toBeVisible();

  const backupCard = page.locator('.vault-card').first();
  await backupCard.getByRole('button', { name: 'Choisir la machine' }).click();
  await expect(backupCard.getByText('Source connectée : Source OP-1')).toBeVisible();
  const backupCategories = backupCard.locator('input[type="checkbox"]');
  await backupCategories.nth(1).uncheck();
  await backupCategories.nth(2).uncheck();
  await backupCategories.nth(3).uncheck();
  await backupCard.getByRole('button', { name: 'Sauvegarder la sélection' }).click();
  await expect(page.getByText(/Sauvegarde créée : 1 fichiers/)).toBeVisible({ timeout: 10_000 });

  const restoreCard = page.locator('.vault-card').nth(1);
  await restoreCard.getByRole('button', { name: 'Choisir la cible' }).click();
  page.once('dialog', (dialog) => void dialog.accept());
  await restoreCard.getByRole('button', { name: 'Restaurer la sélection' }).click();
  await expect(page.getByText(/Restauration terminée : 1 fichiers/)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.vault-progress')).toHaveCount(0);
  expect(await page.evaluate(() => {
    const target = (window as Window & { __vaultE2E?: { target: { children: Map<string, unknown> } } }).__vaultE2E?.target;
    return Boolean(target?.children.has('tape'));
  })).toBe(true);
});
