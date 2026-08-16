import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

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
          const next = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value);
          const state = (window as Window & { __vaultE2E?: { corruptNextWrite?: boolean } }).__vaultE2E;
          if (state?.corruptNextWrite && next.length) {
            next[0] ^= 0xff;
            state.corruptNextWrite = false;
          }
          this.bytes = next;
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
    async removeEntry(name: string) {
      this.children.delete(name);
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
  (window as Window & { __vaultE2E?: { target: FakeDirectoryHandle; corruptNextWrite?: boolean } }).__vaultE2E = { target, corruptNextWrite: false };
}

test('la fiche persistante ouvre le Hub des outils et du transport MIDI', async ({ page }) => {
  await createProfile(page);
  await expect(page.locator('.tools-grid .tool-card')).toHaveCount(8);

  for (const title of [
    'OP‑1 Studio',
    'EP‑133 Studio',
    'Éditeur d’image',
    'Éditeur de samples',
    'Services OP‑1',
    'Sons & transferts EP‑133',
    'Jeux & entraînement',
    'Synchronisation MIDI',
  ]) {
    await expect(page.locator('.tools-grid .tool-card').filter({ hasText: title })).toBeVisible();
  }

  await expect(page.locator('#midi-sync')).toContainText('Jouer OP‑1 et EP‑133 ensemble');
  await page.locator('.tools-grid .tool-card').filter({ hasText: 'Synchronisation MIDI' }).getByRole('button').click();
  await expect(page.locator('#midi-sync')).toBeInViewport();

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

test('le Hub bloque le routage quand aucune destination n’est connectée', async ({ page }) => {
  await createProfile(page);
  const panel = page.locator('.midi-sync-panel');
  await expect(panel).toContainText('Destinations : 0 sortie');
  await expect(panel.getByRole('button', { name: 'C2' })).toBeDisabled();
  await expect(panel.getByRole('button', { name: 'SÉQUENCE TEST' })).toBeDisabled();
  await expect(panel.getByRole('button', { name: 'PANIC' })).toBeDisabled();
});

test('le transport MIDI central envoie Start, horloge et Stop aux deux sorties', async ({ page }) => {
  await page.addInitScript(() => {
    class FakeOutput {
      state = 'connected';
      sent: { data: number[]; timestamp?: number }[] = [];
      constructor(public id: string, public name: string) {}
      send(data: number[], timestamp?: number) { this.sent.push({ data: Array.from(data), timestamp }); }
    }
    const outputs = [new FakeOutput('op1', 'OP-1 MIDI'), new FakeOutput('ep133', 'EP-133 MIDI')];
    Object.defineProperty(navigator, 'requestMIDIAccess', { configurable: true, value: async () => ({ outputs: new Map(outputs.map((output) => [output.id, output])) }) });
    (window as Window & { __midiOutputs?: FakeOutput[] }).__midiOutputs = outputs;
  });
  await createProfile(page);
  await page.locator('.midi-sync-panel').getByRole('button', { name: /Connecter les machines/i }).click();
  await expect(page.locator('.midi-sync-panel')).toContainText('Les deux sorties sont prêtes');
  await page.locator('.midi-sync-panel').getByRole('button', { name: /Démarrer les deux/i }).click();
  await expect(page.locator('.midi-sync-panel')).toContainText('Synchronisation en cours');
  await page.waitForTimeout(80);
  await page.locator('.midi-sync-panel').getByRole('button', { name: 'Arrêter' }).click();
  const messages = await page.evaluate(() => (window as Window & { __midiOutputs?: { sent: { data: number[]; timestamp?: number }[] }[] }).__midiOutputs?.map((output) => output.sent) ?? []);
  expect(messages).toHaveLength(2);
  for (const sent of messages) {
    expect(sent[0].data).toEqual([0xfa]);
    expect(sent.some((message) => message.data[0] === 0xf8)).toBe(true);
    expect(sent.at(-1)?.data).toEqual([0xfc]);
    expect(sent.every((message) => typeof message.timestamp === 'number')).toBe(true);
    expect(sent.every((message, index) => index === 0 || message.timestamp! >= sent[index - 1].timestamp!)).toBe(true);
  }
  await page.locator('.midi-sync-panel').getByRole('button', { name: 'C2' }).click();
  const notePackets = await page.evaluate(() => (window as Window & { __midiOutputs?: { sent: { data: number[]; timestamp?: number }[] }[] }).__midiOutputs?.map((output) => output.sent.filter((message) => message.data[0] === 0x90 || message.data[0] === 0x80)) ?? []);
  expect(notePackets).toHaveLength(2);
  expect(notePackets.every((messages) => messages.some((message) => message.data[0] === 0x90 && message.data[1] === 36 && message.data[2] === 100))).toBe(true);
  await page.locator('.midi-sync-panel').getByRole('button', { name: 'PANIC' }).click();
  const panicPackets = await page.evaluate(() => (window as Window & { __midiOutputs?: { sent: { data: number[]; timestamp?: number }[] }[] }).__midiOutputs?.map((output) => output.sent.filter((message) => message.data[0] === 0xb0 && (message.data[1] === 123 || message.data[1] === 120))) ?? []);
  expect(panicPackets).toHaveLength(2);
  expect(panicPackets.every((messages) => messages.some((message) => message.data[1] === 123) && messages.some((message) => message.data[1] === 120))).toBe(true);
});

test('le mode contrôleur OP-1 relaie les notes vers EP-133 sans écho', async ({ page }) => {
  await page.addInitScript(() => {
    class FakeOutput {
      state = 'connected';
      sent: { data: number[]; timestamp?: number }[] = [];
      constructor(public id: string, public name: string) {}
      send(data: number[], timestamp?: number) { this.sent.push({ data: Array.from(data), timestamp }); }
    }
    class FakeInput {
      state = 'connected';
      onmidimessage: ((event: { data: number[] }) => void) | null = null;
      constructor(public id: string, public name: string) {}
      emit(data: number[]) { this.onmidimessage?.({ data }); }
    }
    const outputs = [new FakeOutput('op1-out', 'OP-1 MIDI'), new FakeOutput('ep133-out', 'EP-133 MIDI')];
    const inputs = [new FakeInput('op1-in', 'OP-1 MIDI')];
    Object.defineProperty(navigator, 'requestMIDIAccess', { configurable: true, value: async () => ({
      inputs: new Map(inputs.map((input) => [input.id, input])),
      outputs: new Map(outputs.map((output) => [output.id, output])),
    }) });
    (window as Window & { __midiOutputs?: FakeOutput[]; __midiInputs?: FakeInput[] }).__midiOutputs = outputs;
    (window as Window & { __midiOutputs?: FakeOutput[]; __midiInputs?: FakeInput[] }).__midiInputs = inputs;
  });
  await createProfile(page);
  await page.locator('.midi-sync-panel').getByRole('button', { name: /Connecter les machines/i }).click();
  await expect(page.locator('.midi-sync-panel')).toContainText('Les deux sorties et l’entrée OP‑1 sont prêtes');
  await page.locator('.midi-sync-panel').getByRole('button', { name: /Activer contrôleur OP‑1/i }).click();
  await page.evaluate(() => (window as Window & { __midiInputs?: { emit(data: number[]): void }[] }).__midiInputs?.[0].emit([0x93, 48, 90]));
  await page.evaluate(() => (window as Window & { __midiInputs?: { emit(data: number[]): void }[] }).__midiInputs?.[0].emit([0x93, 48, 0]));
  const messages = await page.evaluate(() => (window as Window & { __midiOutputs?: { sent: { data: number[] }[] }[] }).__midiOutputs?.map((output) => output.sent) ?? []);
  expect(messages[0].some((message) => message.data[0] === 0x93)).toBe(false);
  expect(messages[1].some((message) => message.data[0] === 0x93 && message.data[1] === 48 && message.data[2] === 90)).toBe(true);
  expect(messages[1].some((message) => message.data[0] === 0x83 && message.data[1] === 48 && message.data[2] === 0)).toBe(true);
  await page.locator('.midi-sync-panel').getByRole('button', { name: /Désactiver CTRL/i }).click();
  await page.evaluate(() => (window as Window & { __midiInputs?: { emit(data: number[]): void }[] }).__midiInputs?.[0].emit([0x90, 50, 100]));
  const afterDisable = await page.evaluate(() => (window as Window & { __midiOutputs?: { sent: { data: number[] }[] }[] }).__midiOutputs?.[1].sent ?? []);
  expect(afterDisable.some((message) => message.data[1] === 50)).toBe(false);
});

test('le Hub simule le transport sans machine vers les deux studios ouverts', async ({ page }) => {
  await createProfile(page);
  const opPopupPromise = page.waitForEvent('popup');
  await page.locator('.tools-grid .tool-card').filter({ hasText: 'OP‑1 Studio' }).getByRole('button').click();
  const opPopup = await opPopupPromise;
  await opPopup.waitForLoadState('domcontentloaded');
  const epPopupPromise = page.waitForEvent('popup');
  await page.locator('.tools-grid .tool-card').filter({ hasText: 'EP‑133 Studio' }).getByRole('button').click();
  const epPopup = await epPopupPromise;
  await epPopup.waitForLoadState('domcontentloaded');
  for (const popup of [opPopup, epPopup]) {
    await expect.poll(() => popup.evaluate(() => {
      try {
        const cached = JSON.parse(localStorage.getItem('studio-hub:imported-profile') || 'null');
        return cached?.schema === 'studio-hub.cache.v1' && cached?.source === 'studio-hub' && cached?.version === 1;
      } catch {
        return false;
      }
    })).toBe(true);
  }
  for (const popup of [opPopup, epPopup]) {
    await popup.evaluate(() => {
      (window as Window & { __transportMessages?: unknown[] }).__transportMessages = [];
      (window as Window & { __noteMessages?: unknown[] }).__noteMessages = [];
      (window as Window & { __panicMessages?: unknown[] }).__panicMessages = [];
      window.addEventListener('hub:transport', (event) => {
        (window as Window & { __transportMessages?: unknown[] }).__transportMessages?.push((event as CustomEvent).detail);
      });
      window.addEventListener('hub:midi-note', (event) => {
        (window as Window & { __noteMessages?: unknown[] }).__noteMessages?.push((event as CustomEvent).detail);
      });
      window.addEventListener('hub:midi-panic', (event) => {
        (window as Window & { __panicMessages?: unknown[] }).__panicMessages?.push((event as CustomEvent).detail);
      });
    });
  }
  for (const popup of [opPopup, epPopup]) {
    await popup.evaluate(() => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'http://evil.invalid',
        source: null,
        data: {
          type: 'hub:midi-note',
          schema: 'studio-hub.note.v1',
          source: 'studio-hub',
          action: 'note-on',
          note: 36,
          velocity: 100,
          channel: 0,
          timestamp: performance.now(),
        },
      }));
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'http://evil.invalid',
        source: null,
        data: { type: 'hub:midi-panic', schema: 'studio-hub.panic.v1', source: 'studio-hub', timestamp: performance.now() },
      }));
    });
    await expect.poll(() => popup.evaluate(() => (window as Window & { __noteMessages?: unknown[] }).__noteMessages?.length ?? 0)).toBe(0);
    await expect.poll(() => popup.evaluate(() => (window as Window & { __panicMessages?: unknown[] }).__panicMessages?.length ?? 0)).toBe(0);
  }
  const hubOrigin = await page.evaluate(() => window.location.origin);
  for (const popup of [opPopup, epPopup]) {
    await popup.evaluate((origin) => {
      window.dispatchEvent(new MessageEvent('message', {
        origin,
        source: window,
        data: {
          type: 'hub:midi-note',
          schema: 'studio-hub.note.v1',
          source: 'studio-hub',
          action: 'note-on',
          note: 38,
          velocity: 100,
          channel: 0,
          timestamp: performance.now(),
        },
      }));
      window.dispatchEvent(new MessageEvent('message', {
        origin,
        source: window.opener,
        data: { type: 'hub:midi-panic', schema: 'studio-hub.panic.invalid', source: 'studio-hub', timestamp: performance.now() },
      }));
    }, hubOrigin);
    await expect.poll(() => popup.evaluate(() => (window as Window & { __noteMessages?: unknown[] }).__noteMessages?.length ?? 0)).toBe(0);
    await expect.poll(() => popup.evaluate(() => (window as Window & { __panicMessages?: unknown[] }).__panicMessages?.length ?? 0)).toBe(0);
  }
  await page.locator('.midi-sync-panel').getByRole('button', { name: /Tester sans machine/i }).click();
  await expect.poll(() => opPopup.evaluate(() => (window as Window & { __transportMessages?: unknown[] }).__transportMessages?.length ?? 0)).toBe(1);
  await expect.poll(() => epPopup.evaluate(() => (window as Window & { __transportMessages?: unknown[] }).__transportMessages?.length ?? 0)).toBe(1);
  await page.locator('.midi-sync-panel').getByRole('button', { name: 'C2' }).click();
  for (const popup of [opPopup, epPopup]) {
    await expect.poll(() => popup.evaluate(() => (window as Window & { __noteMessages?: unknown[] }).__noteMessages?.length ?? 0)).toBeGreaterThan(0);
    await expect.poll(() => popup.evaluate(() => {
      const messages = (window as Window & { __noteMessages?: { schema?: string; action?: string; note?: number }[] }).__noteMessages ?? [];
      return messages.some((message) => message.schema === 'studio-hub.note.v1' && message.action === 'note-on' && message.note === 36);
    })).toBe(true);
  }
  await page.locator('.midi-sync-panel').getByRole('button', { name: 'PANIC' }).click();
  for (const popup of [opPopup, epPopup]) {
    await expect.poll(() => popup.evaluate(() => (window as Window & { __panicMessages?: unknown[] }).__panicMessages?.length ?? 0)).toBe(1);
    await expect.poll(() => popup.evaluate(() => {
      const messages = (window as Window & { __panicMessages?: { schema?: string }[] }).__panicMessages ?? [];
      return messages.some((message) => message.schema === 'studio-hub.panic.v1');
    })).toBe(true);
  }
  await page.locator('.midi-sync-panel').getByRole('button', { name: 'Arrêter' }).click();
  await expect.poll(() => opPopup.evaluate(() => (window as Window & { __transportMessages?: unknown[] }).__transportMessages?.length ?? 0)).toBe(2);
  await expect.poll(() => epPopup.evaluate(() => (window as Window & { __transportMessages?: unknown[] }).__transportMessages?.length ?? 0)).toBe(2);
  for (const popup of [opPopup, epPopup]) await popup.close();
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

test('Rhythm Hero exécute une vraie séance locale et remonte la progression', async ({ page }) => {
  await createProfile(page);
  const popupPromise = page.waitForEvent('popup');
  await page.locator('.tools-grid .tool-card').filter({ hasText: 'Jeux & entraînement' }).getByRole('button').click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');

  const playButton = popup.locator('button.start');
  await expect(playButton).toBeVisible();
  await playButton.click();
  await expect(playButton).toHaveText('■ STOP', { timeout: 5_000 });
  // Le compte à rebours doit réellement laisser place à la séance avant
  // d'accepter une frappe utilisateur.
  await expect(popup.locator('.countdown')).toHaveCount(0, { timeout: 5_000 });
  await popup.locator('.pads .pad-cell button').first().click();
  await expect.poll(async () => popup.locator('.performance-stat').evaluateAll((items) => items
    .map((item) => Number(item.querySelector('b')?.textContent || 0))
    .filter(Number.isFinite)
    .reduce((sum, value) => sum + value, 0))).toBeGreaterThan(0);

  await playButton.click();
  await expect(playButton).toHaveText('▶ JOUER');
  await expect.poll(async () => popup.evaluate(() => {
    const entries = JSON.parse(localStorage.getItem('ep133-rhythm-hero:practice-log:v1') || '[]');
    return Array.isArray(entries) ? entries.length : 0;
  })).toBe(1);
  await expect(page.locator('.studio-card.orange .card-stats')).toContainText('14% entraînement');
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
  await page.evaluate(() => { const state = (window as Window & { __vaultE2E?: { corruptNextWrite?: boolean } }).__vaultE2E; if (state) state.corruptNextWrite = true; });
  await backupCard.getByRole('button', { name: 'Sauvegarder la sélection' }).click();
  await expect(page.getByText(/Vérification impossible après copie/)).toBeVisible({ timeout: 10_000 });
  await backupCard.getByRole('button', { name: 'Sauvegarder la sélection' }).click();
  await expect(page.getByText(/Sauvegarde créée : 1 fichiers/)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.studio-card.blue .card-stats')).toContainText('1 sauvegardes');
  await expect(page.locator('.quick-stats strong').first()).toHaveText('1');
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

  let projectWriteCalls = 0;
  await page.context().route('**/bridge/health', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ root: '/tmp/fake-ep133-bridge' }) }));
  await page.context().route('**/bridge/projects/list', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ projects: Array.from({ length: 9 }, (_, index) => ({ slot: index + 1, present: index === 0, byteSize: 1024 })) }) }));
  await page.context().route('**/bridge/projects/write', (route) => { projectWriteCalls += 1; return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'écriture interdite dans ce test' }) }); });

  const soundsPopupPromise = page.waitForEvent('popup');
  await page.locator('.tools-grid .tool-card').filter({ hasText: 'Sons & transferts EP‑133' }).getByRole('button').click();
  const soundsPopup = await soundsPopupPromise;
  await soundsPopup.waitForLoadState('domcontentloaded');
  await expect(soundsPopup.getByRole('heading', { name: 'SONS & TRANSFERT EP‑133' })).toBeVisible();
  await expect(soundsPopup.getByRole('button', { name: 'CONNECTER EP-133' })).toBeVisible();
  await soundsPopup.locator('button[title*="transfert de projets"]').first().click();
  const projectTransfer = soundsPopup.locator('.project-transfer');
  await expect(projectTransfer.getByText('DEMO GROOVE', { exact: true })).toBeVisible();
  await projectTransfer.getByText('DEMO GROOVE', { exact: true }).dragTo(projectTransfer.locator('.project-transfer-card.machine-side.present').first());
  await expect(projectTransfer.getByText('TRANSFERTS EN ATTENTE · 1')).toBeVisible();
  await projectTransfer.getByRole('button', { name: 'RETIRER' }).click();
  await expect(projectTransfer.getByText('Rien en attente.')).toBeVisible();
  await expect(projectTransfer.getByRole('button', { name: /CONFIRMER/ })).toBeDisabled();
  expect(projectWriteCalls).toBe(0);
  await soundsPopup.close();
  await page.context().unroute('**/bridge/health');
  await page.context().unroute('**/bridge/projects/list');
  await page.context().unroute('**/bridge/projects/write');

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

  const midiDownloadPromise = popup.waitForEvent('download');
  await popup.locator('summary').filter({ hasText: 'FICHIER' }).click();
  await popup.getByRole('button', { name: 'Exporter en MIDI (.mid)', exact: true }).click();
  const midiDownload = await midiDownloadPromise;
  const midiPath = await midiDownload.path();
  expect(midiDownload.suggestedFilename()).toMatch(/\.mid$/i);
  expect(midiPath).toBeTruthy();
  if (midiPath) expect(readFileSync(midiPath).subarray(0, 4).toString('ascii')).toBe('MThd');

  await popup.locator('summary').filter({ hasText: 'FICHIER' }).click();
  await popup.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  expect(await popup.evaluate(() => JSON.parse(localStorage.getItem('ep133-rhythm-hero:studio-projects:v1') || '[]'))).toHaveLength(1);

  await popup.locator('summary').filter({ hasText: 'FICHIER' }).click();
  await popup.getByRole('button', { name: 'Archiver', exact: true }).click();
  expect(await popup.evaluate(() => JSON.parse(localStorage.getItem('ep133-rhythm-hero:studio-projects:v1') || '[]')[0].archivedAt)).toBeTruthy();
  await popup.locator('summary').filter({ hasText: 'FICHIER' }).click();
  await popup.getByRole('button', { name: 'Ouvrir…' }).click();
  const archivedDialog = popup.getByRole('dialog', { name: 'OUVRIR UN PROJET' });
  await archivedDialog.getByRole('button', { name: 'ARCHIVES OFF' }).click();
  popup.once('dialog', (dialog) => void dialog.accept());
  await archivedDialog.locator('.project-open-list').nth(1).getByRole('button').filter({ hasText: 'DEMO GROOVE' }).click();
  await popup.locator('summary').filter({ hasText: 'FICHIER' }).click();
  await popup.getByRole('button', { name: 'Restaurer', exact: true }).click();
  expect(await popup.evaluate(() => JSON.parse(localStorage.getItem('ep133-rhythm-hero:studio-projects:v1') || '[]')[0].archivedAt)).toBeUndefined();

  await popup.getByRole('button', { name: 'SONG', exact: true }).click();
  await expect(popup.locator('.song-arranger')).toBeVisible();
  await popup.locator('summary').filter({ hasText: 'FICHIER' }).click();
  await popup.getByRole('button', { name: 'Ouvrir…' }).click();
  const reloadDialog = popup.getByRole('dialog', { name: 'OUVRIR UN PROJET' });
  await reloadDialog.locator('.project-open-list button.active').click();
  await expect(popup.locator('.studio-view-switch button.active')).toHaveText('SONG');
  await popup.close();
});
