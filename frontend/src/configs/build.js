const configs = {
  API_URL: "RUNTIME_VAR_API_URL",
  CELLGUIDE_DATA_URL: "RUNTIME_VAR_CELLGUIDE_DATA_URL",
  PLAUSIBLE_DATA_DOMAIN: "RUNTIME_VAR_PLAUSIBLE_DATA_DOMAIN",
  SENTRY_DEPLOYMENT_ENVIRONMENT: "RUNTIME_VAR_SENTRY_DEPLOYMENT_ENVIRONMENT",
};

if (typeof module !== "undefined") module.exports = configs;
