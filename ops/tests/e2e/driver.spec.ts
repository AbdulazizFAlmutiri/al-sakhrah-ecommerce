import { expect, test, type Browser, type Page } from "@playwright/test";
import path from "node:path";

// Seeded by SQL before the run: e2e-sales, e2e-driver, two READY orders for e2e-driver
// at branches "E2E دكان 1" / "E2E دكان 2" (customer "E2E متجر قيادة").
const PW = process.env.E2E_PASS!;
const SHOTS = process.env.E2E_SHOTS_DIR;
const WAREHOUSE = { latitude: 24.60, longitude: 46.70 };

async function login(browser: Browser, user: string, opts: Parameters<Browser["newContext"]>[0] = {}): Promise<Page> {
  const page = await (await browser.newContext(opts)).newPage();
  await page.goto("/login");
  await page.locator('input[name="username"]').fill(user);
  await page.locator('input[name="password"]').fill(PW);
  await page.locator("form", { has: page.locator('input[name="password"]') }).locator('button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20_000 });
  return page;
}

test("driver runs a trip: start, route, photo proof, not delivered, end; office sees it on the map", async ({ browser }) => {
  const driver = await login(browser, "e2e-driver", {
    viewport: { width: 800, height: 1280 }, geolocation: WAREHOUSE, permissions: ["geolocation"], locale: "ar-SA",
  });
  await expect(driver).toHaveURL(/\/driver/, { timeout: 20_000 });
  if (SHOTS) await driver.screenshot({ path: `${SHOTS}/p3-01-driver-ready.png` });

  await driver.getByTestId("start-trip").click();
  await expect(driver.getByTestId("stop")).toHaveCount(2);
  await expect(driver.getByTestId("stop").first()).toContainText("الوصول");
  await expect(driver.getByTestId("stop").first()).toContainText("E2E متجر قيادة");
  if (SHOTS) await driver.screenshot({ path: `${SHOTS}/p3-02-driver-trip.png` });

  // office live map shows the driver
  const sales = await login(browser, "e2e-sales");
  await sales.goto("/board/map");
  await expect(sales.getByTestId("map-trip")).toContainText("E2E سائق");
  if (SHOTS) await sales.screenshot({ path: `${SHOTS}/p3-03-map.png` });

  // stop 1: delivered with photo (driver now at the first stop)
  const first = driver.getByTestId("stop").first();
  const firstName = (await first.innerText()).includes("دكان 1") ? "دكان 1" : "دكان 2";
  await driver.context().setGeolocation(firstName === "دكان 1" ? { latitude: 24.65, longitude: 46.72 } : { latitude: 24.70, longitude: 46.75 });
  await first.getByTestId("deliver").click();
  await driver.getByTestId("photo-input").setInputFiles(path.join(__dirname, "fixtures/stamped-po.jpg"));
  await expect(driver.getByRole("dialog").locator("img")).toBeVisible();
  if (SHOTS) await driver.screenshot({ path: `${SHOTS}/p3-04-photo.png` });
  await driver.getByTestId("confirm-delivered").click();
  await expect(driver.getByRole("dialog")).toHaveCount(0);
  await expect(driver.getByTestId("deliver")).toHaveCount(1);

  // stop 2: not delivered, store closed
  await driver.getByTestId("fail").click();
  await driver.getByTestId("reason").filter({ hasText: "المحل مقفل" }).click();
  await driver.getByTestId("confirm-failed").click();
  await expect(driver.getByTestId("end-trip")).toBeVisible();
  if (SHOTS) await driver.screenshot({ path: `${SHOTS}/p3-05-done.png` });
  await driver.getByTestId("end-trip").click();
  await expect(driver.getByTestId("stop")).toHaveCount(0);

  // office board shows the outcomes
  await sales.goto("/board");
  await expect(sales.getByTestId("order-card").filter({ hasText: "دكان 1" }).or(sales.getByTestId("order-card").filter({ hasText: "دكان 2" })).first()).toBeVisible();
  await expect(sales.getByText("تم التسليم").first()).toBeVisible();
  await sales.goto("/board/failed");
  await expect(sales.getByTestId("failed-row")).toContainText("المحل مقفل");
});
