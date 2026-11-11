import { expect, test } from "@playwright/test";
import ExcelJS from "exceljs";

// Seeded by SQL: 4 orders today for "E2E متجر لوحة" — 2 delivered, 1 failed (closed), 1 new; one 12.4 km trip.
const PW = process.env.E2E_PASS!;
const SHOTS = process.env.E2E_SHOTS_DIR;

test("dashboard shows KPIs, timings, breakdowns, order timeline and exports Excel", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill("e2e-sales");
  await page.locator('input[name="password"]').fill(PW);
  await page.locator("form", { has: page.locator('input[name="password"]') }).locator('button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20_000 });

  await page.goto("/dashboard");
  await expect(page.getByTestId("kpi-total")).toContainText("4");
  await expect(page.getByTestId("kpi-del")).toContainText("2");
  await expect(page.getByTestId("kpi-fail")).toContainText("1");
  await expect(page.getByTestId("kpi-succ")).toContainText("67%");
  await expect(page.getByText("20 د")).toBeVisible();
  await expect(page.getByText("45 د")).toBeVisible();
  await expect(page.locator("section", { hasText: "حسب السائق" })).toContainText("12.4");
  await expect(page.locator("section", { hasText: "أسباب عدم التسليم" })).toContainText("المحل مقفل");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/p4-01-dashboard.png`, fullPage: true });

  await page.getByTestId("dash-row").filter({ hasText: "PO-DASH-3" }).getByRole("link").click();
  await expect(page.getByTestId("order-detail")).toContainText("E2E مقفل");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/p4-02-detail.png` });

  await page.getByRole("link", { name: "إغلاق" }).click();
  await expect(page.getByTestId("order-detail")).toHaveCount(0);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("export").click()]);
  const file = await download.path();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file!);
  const ws = wb.worksheets[0];
  expect(ws.rowCount).toBe(5); // header + 4 orders
  const pos = ws.getColumn(5).values.slice(2);
  expect(pos).toEqual(expect.arrayContaining(["PO-DASH-1", "PO-DASH-2", "PO-DASH-3", "PO-DASH-4"]));
});
