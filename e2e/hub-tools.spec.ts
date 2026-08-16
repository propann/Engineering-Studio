import { test, expect, type Page } from '@playwright/test';

function makePcmWav(durationSeconds = 0.1, sampleRate = 44_100) {
  const frames = Math.floor(durationSeconds * sampleRate);
  const bytes = Buffer.alloc(44 + frames * 2);
  bytes.write('RIFF', 0);
  bytes.writeUInt32LE(36 + frames * 2, 4);
  bytes.write('WAVE', 8);
  bytes.write('fmt ', 12);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(sampleRate, 24);
  bytes.writeUInt32LE(sampleRate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36);
  bytes.writeUInt32LE(frames * 2, 40);
  for (let frame = 0; frame < frames; frame += 1) {
    bytes.writeInt16LE(Math.round(Math.sin((frame / sampleRate) * Math.PI * 2 * 220) * 12_000), 44 + frame * 2);
  }
  return bytes;
}

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

test('la fiche survit à une réouverture de contexte navigateur', async ({ page, browser }) => {
  await createProfile(page);
  const savedState = await page.context().storageState();
  const reopenedContext = await browser.newContext({ storageState: savedState });
  const reopenedPage = await reopenedContext.newPage();
  try {
    await reopenedPage.goto('/');
    await expect(reopenedPage.getByRole('button', { name: /Ouvrir mes outils/i })).toBeVisible();
    await reopenedPage.getByRole('button', { name: /Ouvrir mes outils/i }).click();
    await expect(reopenedPage.getByRole('heading', { name: /Bienvenue, Test Hub/i })).toBeVisible();
  } finally {
    await reopenedContext.close();
  }
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

test('le Hub reçoit les statistiques EP-133 depuis une fenêtre autorisée', async ({ page }) => {
  await createProfile(page);
  const popupPromise = page.waitForEvent('popup');
  await page.locator('.tools-grid .tool-card').filter({ hasText: 'EP‑133 Studio' }).getByRole('button').click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  const hubOrigin = await page.evaluate(() => window.location.origin);
  await popup.evaluate((origin) => {
    window.opener?.postMessage({
      source: 'ep133-studio',
      event: {
        schema: 'studio-hub.event.v1',
        type: 'session_update',
        timestamp: new Date().toISOString(),
        machine: 'ep133',
        data: { projectsSaved: 4, samplesPrepared: 12, trainingProgress: 71 },
      },
    }, origin);
  }, hubOrigin);
  const card = page.locator('.studio-card.orange');
  await expect(card.locator('.card-stats')).toContainText('4 projets');
  await expect(card.locator('.card-stats')).toContainText('12 sons');
  await expect(card.locator('.card-stats')).toContainText('71% entraînement');
  await popup.close();
});

test('le Hub reçoit aussi les statistiques OP-1', async ({ page }) => {
  await createProfile(page);
  const popupPromise = page.waitForEvent('popup');
  await page.locator('.tools-grid .tool-card').filter({ hasText: 'OP‑1 Studio' }).getByRole('button').click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  const hubOrigin = await page.evaluate(() => window.location.origin);
  await popup.evaluate((origin) => {
    window.opener?.postMessage({
      source: 'op1-studio',
      event: {
        schema: 'studio-hub.event.v1',
        type: 'session_update',
        timestamp: new Date().toISOString(),
        machine: 'op1',
        data: { projectsSaved: 3, samplesPrepared: 6 },
      },
    }, origin);
  }, hubOrigin);
  const card = page.locator('.studio-card.blue');
  await expect(card.locator('.card-stats')).toContainText('3 projets');
  await expect(card.locator('.card-stats')).toContainText('6 sons');
  await popup.close();
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
  const backupReport = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger le rapport JSON' }).click();
  expect((await backupReport).suggestedFilename()).toMatch(/^studio-hub-backup-op1-/);

  const restoreCard = page.locator('.vault-card').nth(1);
  await restoreCard.getByRole('button', { name: 'Choisir la cible' }).click();
  page.once('dialog', (dialog) => void dialog.accept());
  await restoreCard.getByRole('button', { name: 'Restaurer la sélection' }).click();
  await expect(page.getByText(/Restauration terminée : 1 fichiers/)).toBeVisible({ timeout: 10_000 });
  const restoreReport = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger le rapport JSON' }).click();
  expect((await restoreReport).suggestedFilename()).toMatch(/^studio-hub-restore-op1-/);
  await expect(page.locator('.vault-progress')).toHaveCount(0);
  expect(await page.evaluate(() => {
    const target = (window as Window & { __vaultE2E?: { target: { children: Map<string, unknown> } } }).__vaultE2E?.target;
    return Boolean(target?.children.has('tape'));
  })).toBe(true);
});

test('l’éditeur de samples OP-1 analyse et prépare un AIFF hors ligne', async ({ page }) => {
  await createProfile(page);
  const popupPromise = page.waitForEvent('popup');
  await page.locator('.tools-grid .tool-card').filter({ hasText: 'Éditeur de samples' }).getByRole('button').click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  await expect(popup.locator('#sample-editor-title')).toHaveText('Préparer un sample OP‑1');
  await popup.locator('.sample-editor-panel input[type="file"]').setInputFiles({ name: 'offline-sample.wav', mimeType: 'audio/wav', buffer: makePcmWav() });
  await expect(popup.getByText('offline-sample.wav')).toBeVisible();
  await expect(popup.getByText(/WAV · 1 canal · 16 bits/)).toBeVisible();
  await popup.getByRole('button', { name: 'Préparer l’AIFF' }).click();
  await expect(popup.getByText(/AIFF · 0.10 s · mono · 44,1 kHz/)).toBeVisible();
  await expect(popup.getByText('Nouvelle copie en mémoire, aucune écriture machine.')).toBeVisible();
  await popup.close();
});

test('l’éditeur d’images et les services OP-1 restent locaux', async ({ page }) => {
  await createProfile(page);

  const imagePopupPromise = page.waitForEvent('popup');
  await page.locator('.tools-grid .tool-card').filter({ hasText: 'Éditeur d’image' }).getByRole('button').click();
  const imagePopup = await imagePopupPromise;
  await imagePopup.waitForLoadState('domcontentloaded');
  await expect(imagePopup.locator('.image-studio-page strong').filter({ hasText: 'L’atelier graphique' })).toBeVisible();
  await imagePopup.getByLabel('Texte de l’écran').fill('TEST LOCAL');
  const downloadPromise = imagePopup.waitForEvent('download');
  await imagePopup.getByRole('button', { name: 'Exporter le SVG' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('op1-studio-screen.svg');
  await imagePopup.close();

  const servicesPopupPromise = page.waitForEvent('popup');
  await page.locator('.tools-grid .tool-card').filter({ hasText: 'Services OP‑1' }).getByRole('button').click();
  const servicesPopup = await servicesPopupPromise;
  await servicesPopup.waitForLoadState('domcontentloaded');
  await expect(servicesPopup.getByText('Portail de l’atelier')).toBeVisible();
  await expect(servicesPopup.getByText('Préparation firmware')).toBeVisible();
  await expect(servicesPopup.getByText('Import manuel uniquement')).toBeVisible();
  await servicesPopup.close();
});

test('les outils EP-133 sons et documentation OP-1 s’ouvrent hors machine', async ({ page }) => {
  await createProfile(page);

  const soundsPopupPromise = page.waitForEvent('popup');
  await page.locator('.tools-grid .tool-card').filter({ hasText: 'Sons & transferts EP‑133' }).getByRole('button').click();
  const soundsPopup = await soundsPopupPromise;
  await soundsPopup.waitForLoadState('domcontentloaded');
  await expect(soundsPopup.getByRole('heading', { name: 'SONS & TRANSFERT EP‑133' })).toBeVisible();
  await expect(soundsPopup.getByRole('button', { name: 'CONNECTER EP-133' })).toBeVisible();
  await soundsPopup.close();

  const docsPopupPromise = page.waitForEvent('popup');
  await page.locator('.tools-grid .tool-card').filter({ hasText: 'OP‑1 Studio' }).getByRole('button').click();
  const op1Popup = await docsPopupPromise;
  await op1Popup.waitForLoadState('domcontentloaded');
  await expect(op1Popup.getByRole('heading', { name: 'Votre atelier OP-1.' })).toBeVisible();
  await expect(op1Popup.locator('[data-op1-hydrated="true"]')).toBeVisible();
  await op1Popup.locator('.nav-strip').getByRole('button', { name: 'Documentation', exact: true }).click();
  await expect(op1Popup.getByText('Documentation rapide')).toBeVisible();
  await op1Popup.close();
});

test('Pattern & Song sauvegarde et recharge un projet local hors machine', async ({ page }) => {
  await createProfile(page);
  const popupPromise = page.waitForEvent('popup');
  await page.locator('.tools-grid .tool-card').filter({ hasText: 'EP‑133 Studio' }).getByRole('button').click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  await popup.getByRole('heading', { name: 'PATTERN & SONG STUDIO' }).click();
  await expect(popup.getByText('ÉDITEUR EP‑133 COMPLET')).toBeVisible();

  await popup.locator('summary').filter({ hasText: 'FICHIER' }).click();
  await popup.getByRole('button', { name: 'Ouvrir…' }).click();
  const openDialog = popup.getByRole('dialog', { name: 'OUVRIR UN PROJET' });
  await expect(openDialog).toBeVisible();
  await openDialog.getByRole('button', { name: /DEMO GROOVE/ }).click();
  await expect(popup.locator('.song-arranger')).toBeVisible();

  await popup.locator('summary').filter({ hasText: 'FICHIER' }).click();
  await popup.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  expect(await popup.evaluate(() => JSON.parse(localStorage.getItem('ep133-rhythm-hero:studio-projects:v1') || '[]'))).toHaveLength(1);

  await popup.getByRole('button', { name: 'SONG', exact: true }).click();
  await expect(popup.locator('.song-arranger')).toBeVisible();
  await popup.locator('summary').filter({ hasText: 'FICHIER' }).click();
  await popup.getByRole('button', { name: 'Ouvrir…' }).click();
  const reloadDialog = popup.getByRole('dialog', { name: 'OUVRIR UN PROJET' });
  await reloadDialog.locator('.project-open-list button.active').click();
  await expect(popup.locator('.studio-view-switch button.active')).toHaveText('SONG');
  await popup.close();
});
