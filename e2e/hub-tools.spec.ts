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
