import { ROUTES } from "src/common/constants/routes";
import { TEST_URL } from "../common/constants";
import { expect, Page } from "@playwright/test";
import { getTestID, getText } from "tests/utils/selectors";
import AdmZip from "adm-zip";
import * as fs from "fs";
import readline from "readline";
export function goToWMG(page: Page) {
  return Promise.all([
    page.waitForResponse(
      (resp: { url: () => string | string[]; status: () => number }) =>
        resp.url().includes("/wmg/v1/filters") && resp.status() === 200
    ),
    page.goto(`${TEST_URL}${ROUTES.WHERE_IS_MY_GENE}`),
  ]);
}

export const selectFilterOption = async (page: Page, filterName: string) => {
  // click the filter at the corner this is done due to the fact that the default click is being intercepted by another element
  await page.getByTestId(filterName).getByRole("button").click();

  // select the first option
  await page.locator("[data-option-index='0']").click();

  // close the pop-up
  await page.getByTestId("dataset-filter").click();

  const filter_label = `${getTestID(filterName)} [role="button"]`;
  // expect the selected filter to be visible
  await expect(page.locator(filter_label)).toBeVisible();

  //wait till loading is complete
  await page.locator(getText("Loading")).waitFor({ state: "hidden" });
};
export const pickOptions = async (page: Page, n: number) => {
  for (let i = 0; i < n; i++) {
    // select the nth option
    await page.locator(`[data-option-index="${i}"]`).click();
  }
};

export const deSelectFilterOption = async (page: Page, filterName: string) => {
  const filter_label = `${getTestID(filterName)} [role="button"]`;
  // expect the selected filter to be visible
  await expect(page.locator(filter_label)).toBeVisible();

  // click the cancel button
  await page.getByTestId("ClearIcon").click();

  // verify the selected filter is not visible
  const visibility = await page.locator(filter_label).isVisible();
  expect(visibility).toBeFalsy();
};

export const selectOption = async (page: Page, filterName: string) => {
  // click the filter
  await page.getByTestId(filterName).click();
};

export const selectTissueAndGeneOption = async (page: Page) => {
  // click Tissue button
  await selectOption(page, "add-tissue");

  //pick the first 2 elements in tissue
  await pickOptions(page, 2);

  // close the pop-up
  await page.keyboard.press("Escape");

  //wait for heatmap to be visible the click action
  await page.locator('[id="heatmap-container-id"]').waitFor();

  // click Gene button
  await selectOption(page, "add-gene");

  //pick the first n elements in tissue
  await pickOptions(page, 3);

  // close the pop-up
  await page.keyboard.press("Escape");

  //wait for gene label to appear
  await page.locator("[data-testid='gene-label-TSPAN6']").waitFor();

  //wait till loading is complete
  await page.locator(getText("Loading")).waitFor({ state: "hidden" });
};

export const checkSourceData = async (page: Page) => {
  //click on source data icon
  await page.locator('[data-testid="source-data-button"]').click();

  // number of elemet displayed on source data
  const n = await page.locator('[data-testid="source-data-list"] a').count();
  // close the pop-up
  await page.keyboard.press("Escape");
  return n;
};
export const checkPlotSize = async (page: Page) => {
  //get the number of rows on the data plot
  const n = await page.locator('[data-zr-dom-id*="zr"]').count();
  let sumOfHeights = 0;
  for (let i = 0; i < n; i++) {
    const row = await page.locator('[data-zr-dom-id*="zr"]').nth(i);

    const height = await row.getAttribute("height");

    if (height !== null) {
      sumOfHeights += parseInt(height);
    }
  }
  return sumOfHeights;
};
export const downloadCsv = async (page: Page) => {
  const zipFilePath = "./tests/utils/download.zip";
  const extractDirPath = "./tests/utils/download";

  //wait for download file
  const downloadPromise = page.waitForEvent("download");

  //click the download icon

  await page.getByTestId("download-button").click();
  const checkboxClassPng = await page
    .getByTestId("png-checkbox")
    .getAttribute("class");

  if (checkboxClassPng && checkboxClassPng.includes("Mui-checked")) {
    await page.getByTestId("png-checkbox").click();
  }
  const checkboxClassSvg = await page
    .getByTestId("svg-checkbox")
    .getAttribute("class");

  if (checkboxClassSvg && checkboxClassSvg.includes("Mui-checked")) {
    await page.getByTestId("svg-checkbox").click();
  }

  const checkboxClassCsv = await page
    .getByTestId("csv-checkbox")
    .getAttribute("class");

  if (checkboxClassCsv && !checkboxClassCsv.includes("Mui-checked")) {
    await page.getByTestId("csv-checkbox").click();
  }

  await page.getByTestId("dialog-download-button").click();
  const download = await downloadPromise;

  // Save downloaded file in a directory
  await download.saveAs(zipFilePath);

  //extract zip file
  const zip = new AdmZip(zipFilePath);
  zip.extractAllTo(extractDirPath);
};

export const getCsvMetadata = (tissue: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    // Open the CSV file for reading
    const fileStream = fs.createReadStream(
      `./tests/utils/download/${tissue}.csv`,
      { encoding: "utf8" }
    );

    // Create a readline interface for the file stream
    const rl = readline.createInterface({ input: fileStream });

    // Create an empty array to store the parsed data
    const data: string[] = [];

    // Listen for 'line' events emitted by the readline interface
    rl.on("line", (line) => {
      const row = line.split(",");
      if (row.length === 1) {
        data.push(row[0]);
      }
    });

    // Listen for the 'close' event to know when the parsing is complete
    rl.on("close", () => {
      resolve(data);
    });

    // Listen for any errors during reading and parsing the file
    rl.on("error", (err) => {
      reject(err);
    });
  });
};

export const getCsvHeaders = (tissue: string): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    // Open the CSV file for reading
    const fileStream = fs.createReadStream(
      `./tests/utils/download/${tissue}.csv`,
      { encoding: "utf8" }
    );

    // Create a readline interface for the file stream
    const rl = readline.createInterface({ input: fileStream });

    // Create an empty array to store the parsed data
    const data: string[][] = [];

    // Listen for 'line' events emitted by the readline interface
    rl.on("line", (line) => {
      const row = line.split(",");
      if (row.length > 1) {
        data.push(row);
      }
    });

    // Listen for the 'close' event to know when the parsing is complete
    rl.on("close", () => {
      resolve(data);
    });

    // Listen for any errors during reading and parsing the file
    rl.on("error", (err) => {
      reject(err);
    });
  });
};
