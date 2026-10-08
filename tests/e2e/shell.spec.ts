import { expect, test, type Page } from "@playwright/test";

function failOnBrowserErrors(
  page: Page,
  {
    allowExpectedDocument404 = false,
  }: { allowExpectedDocument404?: boolean } = {},
) {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      if (
        allowExpectedDocument404 &&
        message.text() ===
          "Failed to load resource: the server responded with a status of 404 (Not Found)"
      ) {
        return;
      }

      errors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return () => expect(errors, "browser console/page errors").toEqual([]);
}

async function startFreshQuote(page: Page) {
  await page.goto("/quote");
  await page.evaluate(() => window.localStorage.clear());
  await page.goto("/");
  await page.goto("/quote");
}

async function continueStep(page: Page) {
  await page.getByRole("button", { name: "Continue" }).click();
}

async function expectNoHorizontalOverflow(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
}

async function completeSimpleQuote(page: Page) {
  await page.getByLabel("Pages / screens").fill("3");
  await page.getByLabel("Project type").selectOption("landing");
  await continueStep(page);

  await page.getByLabel("Custom design").click();
  await expect(page.getByLabel("Custom design")).toBeChecked();
  await page.getByLabel("Copywriting support").click();
  await expect(page.getByLabel("Copywriting support")).toBeChecked();
  await page.getByLabel("Asset or image sourcing").check();
  await continueStep(page);

  await page.getByLabel("Contact forms").check();
  await continueStep(page);

  await page.getByLabel("CRM").fill("1");
  await continueStep(page);

  await page.getByLabel("Priority").check();
  await page.getByLabel("Included revision rounds").fill("3");
  await page.getByLabel("Content migration").selectOption("standard");
  await page.getByLabel("Post-launch support").selectOption("14");
  await page.getByLabel("Essential").last().check();
  await page.getByLabel("Client handles deployment").check();
  await continueStep(page);

  await page.getByLabel("Minimum hourly value").fill("75.50");
  await page.getByLabel("Target gross margin").fill("30");
  await page.getByLabel("Cautious").check();
  await page.getByLabel("High exposure").check();
  await continueStep(page);
}

test("product shell is accessible and navigates to the quote workspace", async ({
  page,
}) => {
  const expectNoBrowserErrors = failOnBrowserErrors(page);

  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Know what to charge before you send the quote.",
    }),
  ).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await page.getByRole("link", { name: "Build a quote" }).click();
  await expect(page).toHaveURL(/\/quote$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Build a clear website quote",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Quote progress" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Start with the shape of the work" }),
  ).toBeVisible();

  expectNoBrowserErrors();
});

test("simple landing-page quote reaches the minimal result page", async ({
  page,
}) => {
  const expectNoBrowserErrors = failOnBrowserErrors(page);
  await startFreshQuote(page);
  await completeSimpleQuote(page);

  await expect(
    page.getByRole("heading", {
      name: "Check the inputs before calculation",
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Project" })).toBeVisible();
  await expect(page.getByText("Landing page")).toBeVisible();
  await page.getByRole("button", { name: "Calculate quote" }).click();

  await expect(page).toHaveURL(/\/quote\/result$/);
  await expect(
    page.getByRole("heading", {
      name: "Your quote is ready",
    }),
  ).toBeVisible();
  await expect(page.getByText("Quote details")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Review inputs" }),
  ).toHaveAttribute("href", "/quote");
  await expect(page.locator("body")).not.toContainText("deterministic result");
  await expect(page.locator("body")).not.toContainText("Phase 5 handoff");
  expectNoBrowserErrors();
});

test("business quote preserves values while moving backward and forward", async ({
  page,
}) => {
  const expectNoBrowserErrors = failOnBrowserErrors(page);
  await startFreshQuote(page);

  await page.getByLabel("Pages / screens").fill("12");
  await continueStep(page);
  await expect(
    page.getByRole("heading", { name: "Make the starting point clear" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("Pages / screens")).toHaveValue("12");
  await continueStep(page);
  await continueStep(page);
  await continueStep(page);
  await continueStep(page);
  await continueStep(page);
  await page.getByLabel("Minimum hourly value").fill("60");
  await continueStep(page);
  await expect(page.getByText("Business website")).toBeVisible();
  await page.getByRole("button", { name: "Calculate quote" }).click();
  await expect(page).toHaveURL(/\/quote\/result$/);
  expectNoBrowserErrors();
});

test("ecommerce workflow applies visible dependency guidance and API disclosure", async ({
  page,
}) => {
  const expectNoBrowserErrors = failOnBrowserErrors(page);
  await startFreshQuote(page);

  await page.getByLabel("Project type").selectOption("ecommerce");
  await page.getByLabel("Pages / screens").fill("18");
  await continueStep(page);
  await page.getByLabel("Full UI/UX design").click();
  await expect(page.getByLabel("Full UI/UX design")).toBeChecked();
  await continueStep(page);
  await page.getByLabel("Membership").check();
  await page.getByLabel("Subscriptions").check();
  await continueStep(page);
  await page.getByLabel("Include API work").check();
  await expect(page.getByLabel("Third-party APIs")).toHaveValue("1");
  await page.getByLabel("Custom APIs").fill("2");
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("Custom APIs")).toHaveValue("2");
  await continueStep(page);
  await continueStep(page);
  await page.getByLabel("Minimum hourly value").fill("100");
  await page.getByLabel("Target gross margin").fill("25");
  await continueStep(page);
  await expect(page.getByText("Membership")).toBeVisible();
  await expect(page.getByText("2 custom APIs", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Calculate quote" }).click();
  await expect(page).toHaveURL(/\/quote\/result$/);
  expectNoBrowserErrors();
});

test("incomplete project input blocks progression with a focused error", async ({
  page,
}) => {
  const expectNoBrowserErrors = failOnBrowserErrors(page);
  await startFreshQuote(page);
  await page.getByLabel("Pages / screens").fill("");
  await continueStep(page);
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Enter a valid number of pages." }),
  ).toContainText("Enter a valid number of pages.");
  await expect(page.getByLabel("Pages / screens")).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Start with the shape of the work" }),
  ).toBeVisible();
  expectNoBrowserErrors();
});

test("active draft survives refresh and reset clears it", async ({ page }) => {
  const expectNoBrowserErrors = failOnBrowserErrors(page);
  await startFreshQuote(page);
  await page.getByLabel("Pages / screens").fill("9");
  await continueStep(page);
  await page.waitForTimeout(400);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Make the starting point clear" }),
  ).toBeVisible();
  await page.waitForTimeout(400);
  await page.getByRole("link", { name: "Overview" }).click();
  await page.getByRole("link", { name: "Build a quote" }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("Pages / screens")).toHaveValue("9");
  await page.getByRole("button", { name: "Start a new quote" }).click();
  await page.getByRole("button", { name: "Start over" }).click();
  await expect(page.getByLabel("Pages / screens")).toHaveValue("5");
  await expect(
    page.getByRole("heading", { name: "Start with the shape of the work" }),
  ).toBeVisible();
  expectNoBrowserErrors();
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 320, height: 700 },
] as const) {
  test(`builder remains usable through Project, Commercial terms, and Review at ${viewport.width}px`, async ({
    page,
  }) => {
    const expectNoBrowserErrors = failOnBrowserErrors(page);
    await page.setViewportSize(viewport);
    await startFreshQuote(page);

    await expect(
      page.getByRole("heading", { name: "Start with the shape of the work" }),
    ).toBeVisible();
    await expect(page.getByLabel("Pages / screens")).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
    await expectNoHorizontalOverflow(page);

    for (let index = 0; index < 5; index += 1) {
      await continueStep(page);
    }
    await expect(
      page.getByRole("heading", {
        name: "Anchor the quote to your working terms",
      }),
    ).toBeVisible();
    await expect(page.getByLabel("Minimum hourly value")).toBeEditable();
    await expect(page.getByLabel("Target gross margin")).toBeEditable();
    const balancedTarget = page
      .locator("label")
      .filter({ has: page.getByLabel("Balanced") });
    await expect(balancedTarget).toBeVisible();
    expect(
      await balancedTarget.evaluate((element) => element.clientHeight),
    ).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalOverflow(page);

    await page.getByLabel("Minimum hourly value").fill("75");
    await continueStep(page);
    await expect(
      page.getByRole("heading", {
        name: "Check the inputs before calculation",
      }),
    ).toBeVisible();
    await expect(page.getByText("Client supplies content")).toBeVisible();
    await expect(page.getByText("Medium exposure")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Calculate quote" }),
    ).toBeVisible();
    expect(
      await page
        .locator("dd")
        .evaluateAll((items) =>
          items.every((item) => item.scrollWidth <= item.clientWidth),
        ),
    ).toBe(true);
    await expectNoHorizontalOverflow(page);
    expectNoBrowserErrors();
  });
}

test("quote workspace remains usable without horizontal overflow at 320px", async ({
  page,
}) => {
  const expectNoBrowserErrors = failOnBrowserErrors(page);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/quote");

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );

  expect(hasHorizontalOverflow).toBe(false);
  await expect(
    page.getByRole("heading", { name: "Build a clear website quote" }),
  ).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "1",
  );
  await expect(page.getByRole("link", { name: "Overview" })).toBeVisible();
  expectNoBrowserErrors();
});

test("quote workspace supports keyboard focus and desktop content", async ({
  page,
}) => {
  const expectNoBrowserErrors = failOnBrowserErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/quote");

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "WebQuote home" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Overview" })).toBeFocused();

  await expect(page.locator("main")).toContainText(
    "Start with the shape of the work",
  );
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  expectNoBrowserErrors();
});

test("unknown routes render the recoverable not-found page", async ({
  page,
}) => {
  // Chromium logs the deliberately requested 404 document as a console error.
  // The response status is asserted below; every other console/page error fails.
  const expectNoBrowserErrors = failOnBrowserErrors(page, {
    allowExpectedDocument404: true,
  });
  const response = await page.goto("/not-a-real-route");

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "This page is not available" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Return home" })).toHaveAttribute(
    "href",
    "/",
  );
  expectNoBrowserErrors();
});
