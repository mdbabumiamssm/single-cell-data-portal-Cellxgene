type TEST_ENV =
  | "local"
  | "localProd"
  | "staging"
  | "prod"
  | "rdev"
  | "happy"
  | "dev";

export const TEST_ENV: TEST_ENV = (process.env.TEST_ENV as TEST_ENV) || "local";

const TEST_ENV_TO_TEST_URL = {
  dev: "https://cellxgene.dev.single-cell.czi.technology",
  happy: "https://frontend.corporanet.local:3000",
  local: "https://localhost:3000",
  localProd: "http://localhost:9000",
  prod: "https://cellxgene.cziscience.com",
  rdev: process.env.RDEV_LINK || "",
  staging: "https://cellxgene.staging.single-cell.czi.technology",
};

export const TEST_URL = TEST_ENV_TO_TEST_URL[TEST_ENV];

export const BLUEPRINT_SAFE_TYPE_OPTIONS = { delay: 50 };

export const SKIP_LOGIN = process.env.SKIP_LOGIN === "true" || false;

export const LOGIN_STATE_FILENAME = "loginState.json";

export const SHARED_LINK =
  "https://localhost:3000/gene-expression?compare=disease&datasets=c874f155-9bf9-4928-b821-f52c876b3e48%2Cdb59611b-42de-4035-93aa-1ed39f38b467%2Ceeacb0c1-2217-4cf6-b8ce-1f0fedf1b569%2C881fe679-c6e0-45a3-9427-c4e81be6921f%2Cea786a06-5855-48b7-80d7-0313a21a2044%2C456e8b9b-f872-488b-871d-94534090a865&diseases=MONDO%3A0100096&ethnicities=unknown&sexes=PATO%3A0000383%2CPATO%3A0000384&tissues=blood%2Clung&genes=DPM1%2CTNMD%2CTSPAN6%2CMALAT1&ver=2";

export const SHARED_LINK_WITHOUT_COMPARE =
  "https://localhost:3000/gene-expression?datasets=c874f155-9bf9-4928-b821-f52c876b3e48%2Cdb59611b-42de-4035-93aa-1ed39f38b467%2Ceeacb0c1-2217-4cf6-b8ce-1f0fedf1b569%2C881fe679-c6e0-45a3-9427-c4e81be6921f%2Cea786a06-5855-48b7-80d7-0313a21a2044%2C456e8b9b-f872-488b-871d-94534090a865&diseases=MONDO%3A0100096&ethnicities=unknown&sexes=PATO%3A0000383%2CPATO%3A0000384&tissues=blood%2Clung&genes=DPM1%2CTNMD%2CTSPAN6%2CMALAT1&ver=2";

export const SIMPLE_SHARED_LINK =
  "https://localhost:3000/gene-expression?tissues=blood%2Clung&genes=DPM1%2CMALAT1%2CTNMD%2CTSPAN6&ver=2";

export const ADD_TISSUE_BTN = "add-tissue-btn";
export const ADD_TISSUE_LBL = "get-started-step-1";
export const ADD_GENE_BTN = "add-gene-btn";
export const ADD_GENE_LBL = "get-started-step-2";
export const CELL_TYPE_LABELS_ID = "cell-type-name";
export const TWO_DECIMAL_NUMBER_REGEX = /^\d+\.?\d{0,2}$/;
export const ERROR_NO_TESTID_OR_LOCATOR =
  "Either testId or locator must be defined";
export const GENE_LABELS_ID = "[data-testid^=gene-label-]";

export const downLoadPath = "./tests/downloads";
