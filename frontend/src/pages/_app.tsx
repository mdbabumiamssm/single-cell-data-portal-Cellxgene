import { Auth0Provider } from "@auth0/auth0-react";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { NextPage } from "next";
import { AppProps } from "next/app";
import Script from "next/script";
import { FC, useEffect, useState, Fragment } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { EVENTS } from "src/common/analytics/events";
import { checkFeatureFlags } from "src/common/featureFlags";
import { theme } from "src/common/theme";
import DefaultLayout from "src/components/Layout/components/defaultLayout";
import configs from "src/configs/configs";
import "src/global.scss";
// (thuang): `layout.css` needs to be imported after `global.scss`
import "src/layout.css";

declare global {
  interface Window {
    plausible: {
      q: unknown[];
      (event: EVENTS, options?: { props: { [key: string]: unknown } }): void;
    };
  }
}

const queryClient = new QueryClient();

checkFeatureFlags();

type NextPageWithLayout = NextPage & {
  Layout?: FC;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function App({ Component, pageProps }: AppPropsWithLayout): JSX.Element {
  const Layout = Component.Layout || DefaultLayout;
  const [redirectUri, setRedirectUri] = useState("");

  // (thuang): Per Plausible instruction
  // "...make sure your tracking setup includes the second line as shown below"
  // https://plausible.io/docs/custom-event-goals#1-trigger-custom-events-with-javascript-on-your-site
  useEffect(() => {
    window.plausible = window.plausible || tempPlausible;

    function tempPlausible(...args: unknown[]): void {
      (window.plausible.q = window.plausible.q || []).push(args);
    }
  }, []);

  const ConditionalAuth0Provider = redirectUri ? Auth0Provider : Fragment;

  useEffect(() => {
    console.log(`setting redirect uri to ${window.location.origin}`);
    setRedirectUri(window.location.origin);
  }, []);
  console.log(`current redirectUri is ${redirectUri}`);

  return (
    <>
      <ConditionalAuth0Provider
        domain="oidc.corporanet.local:8443/connect" // Hard-coded for local dev
        clientId="local-client-id" // Hard-coded for local dev
        redirectUri={redirectUri}
      >
        <QueryClientProvider client={queryClient}>
          <StylesProvider injectFirst>
            <EmotionThemeProvider theme={theme}>
              <ThemeProvider theme={theme}>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
                <ReactQueryDevtools />
              </ThemeProvider>
            </EmotionThemeProvider>
          </StylesProvider>
        </QueryClientProvider>
      </ConditionalAuth0Provider>
      <Script
        data-domain={configs.PLAUSIBLE_DATA_DOMAIN}
        src="https://plausible.io/js/script.js"
      />
    </>
  );
}

export default App;
