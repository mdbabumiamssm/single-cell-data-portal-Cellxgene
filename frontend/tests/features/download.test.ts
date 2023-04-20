import { expect, test } from "@playwright/test";
import {
  downloadCsv,
  getCsvHeaders,
  getCsvMetadata,
  goToWMG,
  selectTissueAndGeneOption,
} from "../utils/wmgUtils";
import { isDevStagingProd } from "tests/utils/helpers";

const EXPECTED_HEADER = [
  "Tissue",
  "Cell Type",
  "Cell Count",
  "Tissue Composition",
  "Gene Symbol",
  "Expression",
  '"Expression',
  ' Scaled"',
  "Number of Cells Expressing Genes",
];
const EXPECTED_METADATA = [
  "# We regularly expand our single cell data corpus to improve results. Downloaded data and figures may differ in the future.",
  "# Dataset Filter Values: No selection",
  "# Disease Filter Values: No selection",
  "# Self-Reported Ethnicity Filter Values: No selection",
  "# Sex Filter Values: No selection",
  "# Organism Filter Value: Homo sapiens",
];
const { describe, skip } = test;
describe("Csv download", () => {
  // skip(!isDevStagingProd, "WMG BE API does not work locally or in rdev");
  test.beforeEach(async ({ page }) => {
    // navigate to gene expression page
    await goToWMG(page);

    //select tissue and gene
    await selectTissueAndGeneOption(page);

    //download and extract the csv file
    await downloadCsv(page);
  });

  test("Verify metadata displayed on csv file", async () => {
    //put all the meta data in an array
    const META_DATA = await getCsvMetadata("blood");

    // verify the date is valid
    const dateString = META_DATA[0].substring(14);
    const date = new Date(dateString);
    // Check if the resulting date is valid
    expect(!isNaN(date.getTime())).toBe(true);

    //check if the 3 column contains the gene expression link
    expect(
      META_DATA[2].includes("https://localhost:3000/gene-expression")
    ).toBeTruthy();

    //verify all the metadata are present in the csv
    expect(META_DATA).toEqual(expect.arrayContaining(EXPECTED_METADATA));
  });
  test("Verify headers displayed on csv file", async () => {
    // put all the headers in an array
    const HEADERS = await getCsvHeaders("blood");

    //verify all the headers are present in the csv
    expect(HEADERS[0]).toEqual(expect.arrayContaining(EXPECTED_HEADER));
  });

 
});
