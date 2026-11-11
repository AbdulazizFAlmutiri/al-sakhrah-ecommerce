import { expect, test } from "@playwright/test";

const ADMIN_USER = process.env.E2E_ADMIN_USER!;
const ADMIN_PASS = process.env.E2E_ADMIN_PASS!;
const SHOTS = process.env.E2E_SHOTS_DIR;

test("admin signs in, creates a driver, driver lands on driver home", async ({ page, browser }) => {
  const driverName = `e2e${Date.now().toString().slice(-6)}`;

  await page.goto("/login");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/01-login-ar.png` });
  await page.getByLabel("اسم المستخدم").fill(ADMIN_USER);
  await page.getByLabel("كلمة المرور").fill(ADMIN_PASS);
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).toHaveURL(/\/admin\/users/);

  await page.locator('input[name="username"]').first().fill(driverName);
  await page.locator('input[name="full_name"]').first().fill("سائق تجربة");
  await page.locator('select[name="role"]').first().selectOption("driver");
  await page.locator('select[name="locale"]').first().selectOption("ur");
  await page.locator('input[name="password"]').first().fill("temp-pass-123");
  await page.getByRole("button", { name: "إنشاء حساب" }).click();
  await expect(page.getByText(driverName)).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/02-admin-users.png`, fullPage: true });

  await page.goto("/admin/settings");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/03-admin-settings.png`, fullPage: true });

  // New driver: forced password change, then Urdu RTL driver home
  const ctx = await browser.newContext();
  const d = await ctx.newPage();
  await d.goto("/login");
  await d.locator('input[name="username"]').fill(driverName);
  await d.locator('input[name="password"]').fill("temp-pass-123");
  await d.locator('button[type="submit"]').click();
  await expect(d).toHaveURL(/\/account\/password/);
  await d.locator('input[name="password"]').fill("driver-pass-123");
  await d.locator('input[name="confirm"]').fill("driver-pass-123");
  await d.locator('button[type="submit"]').click();
  await expect(d).toHaveURL(/\/driver/);
  await expect(d.locator("html")).toHaveAttribute("lang", "ur");
  await expect(d.locator("html")).toHaveAttribute("dir", "rtl");
  if (SHOTS) await d.screenshot({ path: `${SHOTS}/04-driver-home-ur.png` });

  // Driver cannot open admin pages
  await d.goto("/admin/users");
  await expect(d).toHaveURL(/\/driver/);
  await ctx.close();

  // Admin deactivates the test driver so it can't be used
  await page.goto("/admin/users");
  const row = page.locator("li", { hasText: driverName });
  await row.locator('input[name="active"]').uncheck();
  await row.getByRole("button", { name: "حفظ" }).click();
});
