import { ROUTES } from "src/common/constants/routes";
import { TEST_URL } from "./constants";
import { expect, Page } from "@playwright/test";
import { getTestID } from "tests/utils/selectors";

export function goToWMG(page: Page) {
  return Promise.all([
    page.waitForResponse(
      (resp: { url: () => string | string[]; status: () => number }) =>
        resp.url().includes("/wmg/v1/filters") && resp.status() === 200
    ),
    page.goto(`${TEST_URL}${ROUTES.WHERE_IS_MY_GENE}`),
  ]);
}

export const selectAndDeselectOption = async (
  page: Page,
  filterName: string
) => {
  const FIRST_OPTION = '[data-option-index="0"]';
  // click the filter
  await page.getByTestId(filterName).click({ position: { x: 0, y: 0 } });

  // select the first option
  await page.locator(FIRST_OPTION).click();

  // close the pop-up
  await page.keyboard.press("Escape");

  const filter_label = `${getTestID(filterName)} [role="button"]`;
  // expect the selected filter to be visible
  await expect(page.locator(filter_label)).toBeVisible();

  // click the cancel button
  await page.getByTestId("ClearIcon").click();

  // verify the selected filter is not visible
  const visibility = await page.locator(filter_label).isVisible();
  expect(visibility).toBeFalsy();
};
export const selectFilterOption = async (page: Page, filterName: string) => {
  // click the filter
  await page.getByTestId(filterName).click();
};

export const pickOptions = async (page: Page, n: number) => {
  for (let i = 0; i < n; i++) {
    // select the nth option
    await page.locator(`[data-option-index="${i}"]`).click();
  }
};

export const selectTissueandGeneOption = async (page: Page) => {
  // click Tissue button
  await selectFilterOption(page, "add-tissue");

  //pick the first 2 elements in tissue
  await pickOptions(page, 2);

  // close the pop-up
  await page.keyboard.press("Escape");

  // click Gene button
  await selectFilterOption(page, "add-gene");

  //pick the first n elements in tissue
  await pickOptions(page, 3);

  // close the pop-up
  await page.keyboard.press("Escape");
};
