import { expect, test, type Page } from "@playwright/test";

const PW = process.env.E2E_PASS!;
const SHOTS = process.env.E2E_SHOTS_DIR;
const tag = Date.now().toString().slice(-5);
const CUSTOMER = `E2E متجر ${tag}`;

async function login(page: Page, user: string) {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill(user);
  await page.locator('input[name="password"]').fill(PW);
  await page.locator("form", { has: page.locator('input[name="password"]') }).locator('button[type="submit"]').click();
}

test("sales creates orders, warehouse readies them, sales closes and reschedules", async ({ browser }) => {
  const sales = await (await browser.newContext()).newPage();
  await login(sales, "e2e-sales");
  await expect(sales).toHaveURL(/\/board/);

  // customer + branch
  await sales.goto("/customers");
  await sales.locator('form:has(button:text("إضافة عميل")) input[name="name"]').fill(CUSTOMER);
  await sales.getByRole("button", { name: "إضافة عميل" }).click();
  await expect(sales.locator("li").getByText(CUSTOMER, { exact: true })).toBeVisible();
  const branchForm = sales.locator("form", { has: sales.locator('input[name="location"]') });
  await branchForm.locator('select[name="customer_id"]').selectOption({ label: CUSTOMER });
  await branchForm.locator('input[name="name"]').fill("الفرع الرئيسي");
  await branchForm.locator('input[name="location"]').fill("24.7136, 46.6753");
  await branchForm.getByRole("button", { name: "إضافة فرع" }).click();
  await expect(branchForm.getByText("تم الحفظ.")).toBeVisible();

  // two orders: driver + external
  for (const [po, driver] of [[`PO-${tag}-1`, "E2E سائق"], [`PO-${tag}-2`, "سيارة خارجية"]] as const) {
    await sales.goto("/board/new");
    await sales.getByPlaceholder("اكتب اسم المحل أو الفرع…").fill(`متجر ${tag}`);
    await sales.locator("#branch-list [role=option]").first().click();
    await sales.locator('select[name="sales_rep_id"]').selectOption({ label: "E2E مندوب" });
    await sales.locator('input[name="po_number"]').fill(po);
    await sales.locator('select[name="driver"]').selectOption({ label: driver });
    await sales.getByRole("button", { name: "حفظ وإضافة طلب آخر" }).click();
    await expect(sales.getByText("تم حفظ الطلب.")).toBeVisible();
  }
  if (SHOTS) await sales.screenshot({ path: `${SHOTS}/p2-01-new-order.png`, fullPage: true });

  await sales.goto("/board");
  await expect(sales.getByTestId("order-card").filter({ hasText: `PO-${tag}-1` })).toContainText("عند المستودع");

  // warehouse readies both
  const wh = await (await browser.newContext()).newPage();
  await login(wh, "e2e-wh");
  await expect(wh).toHaveURL(/\/warehouse/);
  for (const n of [1, 2]) {
    const row = wh.getByTestId("wh-row").filter({ hasText: `PO-${tag}-${n}` });
    await row.getByRole("button", { name: "جاهز" }).click();
    await expect(row.getByRole("button", { name: "تراجع" })).toBeVisible();
  }
  if (SHOTS) await wh.screenshot({ path: `${SHOTS}/p2-02-warehouse.png`, fullPage: true });

  // sales board updates live (realtime or 60s fallback) — reload to be deterministic
  await sales.reload();
  const card1 = sales.getByTestId("order-card").filter({ hasText: `PO-${tag}-1` });
  await expect(card1).toContainText("جاهز");
  if (SHOTS) await sales.screenshot({ path: `${SHOTS}/p2-03-board.png`, fullPage: true });

  // external order fails with reason
  const card2 = sales.getByTestId("order-card").filter({ hasText: `PO-${tag}-2` });
  await card2.getByRole("button", { name: "لم يتم التسليم" }).click();
  await card2.getByText("المحل مقفل").click();
  await card2.locator('input[name="note"]').fill("مقفل وقت الظهر");
  await card2.getByRole("button", { name: "تأكيد" }).click();
  // once failed, the card has no more actions
  await expect(card2.locator("form")).toHaveCount(0);

  // reschedule from the not-delivered list
  await sales.goto("/board/failed");
  const row = sales.getByTestId("failed-row").filter({ hasText: `PO-${tag}-2` });
  await expect(row).toContainText("المحل مقفل");
  await expect(row).toContainText("مقفل وقت الظهر");
  if (SHOTS) await sales.screenshot({ path: `${SHOTS}/p2-04-failed.png`, fullPage: true });
  await row.locator('select[name="driver"]').selectOption({ label: "E2E سائق" });
  await row.getByRole("button", { name: "إعادة الجدولة" }).click();
  await expect(sales.getByTestId("failed-row").filter({ hasText: `PO-${tag}-2` })).toHaveCount(0);
});
