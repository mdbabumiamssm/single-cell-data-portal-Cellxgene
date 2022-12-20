const {
  DEV_AUTH0_CLIENT_ID,
  PLAUSIBLE_DATA_DOMAIN_STAGING,
} = require("./common");

const configs = {
  API_URL: "https://api.cellxgene.staging.single-cell.czi.technology",
  AUTH0_AUDIENCE: "api.cellxgene.staging.single-cell.czi.technology",
  AUTH0_CLIENT_ID: DEV_AUTH0_CLIENT_ID,
  AUTH0_DOMAIN: "login.cellxgene.staging.single-cell.czi.technology",
  PLAUSIBLE_DATA_DOMAIN: PLAUSIBLE_DATA_DOMAIN_STAGING,
  SENTRY_DEPLOYMENT_ENVIRONMENT: "staging",
};

if (typeof module !== "undefined") module.exports = configs;
