import { type ComponentType, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { Header } from "./components/layout/Header";
import { TabNav } from "./components/layout/TabNav";
import { SettingsModal } from "./components/settings/SettingsModal";
import { SessionTimeline } from "./components/timeline/SessionTimeline";
import { AvgCalcPage } from "./features/avgCalc/AvgCalcPage";
import { DcaPage } from "./features/dca/DcaPage";
import { DocsPage } from "./features/docs/DocsPage";
import { ExpectancyPage } from "./features/expectancy/ExpectancyPage";
import { SimulatorPage } from "./features/simulator/SimulatorPage";
import { SizingPage } from "./features/sizing/SizingPage";
import { useI18n } from "./i18n";
import type { RouteMeta } from "./types";

interface AppRoute extends RouteMeta {
  component: ComponentType;
  showInTabs: boolean;
}

const SITE_URL = "https://tradinghelpers.com";
const OG_IMAGE_URL = `${SITE_URL}/og-image.png`;

const ROUTE_BLUEPRINT = [
  {
    id: "avgCalc",
    path: "/avg-price",
    metaKey: "avg",
    component: AvgCalcPage,
    showInTabs: true,
  },
  {
    id: "dca",
    path: "/dca",
    metaKey: "dca",
    component: DcaPage,
    showInTabs: true,
  },
  {
    id: "sizing",
    path: "/position-sizing",
    metaKey: "sizing",
    component: SizingPage,
    showInTabs: true,
  },
  {
    id: "simulator",
    path: "/simulator",
    metaKey: "sim",
    component: SimulatorPage,
    showInTabs: true,
  },
  {
    id: "expectancy",
    path: "/expectancy",
    metaKey: "exp",
    component: ExpectancyPage,
    showInTabs: true,
  },
  {
    id: "docs",
    path: "/docs",
    metaKey: "docs",
    component: DocsPage,
    showInTabs: false,
  },
] as const;

function ensureMetaTag(attr: "name" | "property", value: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${value}"]`,
  );
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, value);
    document.head.appendChild(tag);
  }
  return tag;
}

function ensureCanonicalLink() {
  let link = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  return link;
}

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const { t } = useI18n();

  const appRoutes = useMemo<readonly AppRoute[]>(() => {
    return ROUTE_BLUEPRINT.map((route) => {
      const prefix = `app.route.${route.metaKey}`;

      return {
        id: route.id,
        path: route.path,
        label: t(`${prefix}.label`),
        title: t(`${prefix}.title`),
        description: t(`${prefix}.description`),
        canonicalPath: route.path,
        introTitle: t(`${prefix}.introTitle`),
        introDescription: t(`${prefix}.introDescription`),
        component: route.component,
        showInTabs: route.showInTabs,
      };
    });
  }, [t]);

  const currentRoute = useMemo(() => {
    return (
      appRoutes.find((route) => route.path === location.pathname) ??
      appRoutes[0]
    );
  }, [appRoutes, location.pathname]);

  const docsRoute = useMemo(() => {
    return appRoutes.find((route) => route.id === "docs");
  }, [appRoutes]);

  useEffect(() => {
    document.title = currentRoute.title;

    const descriptionTag = ensureMetaTag("name", "description");
    descriptionTag.setAttribute("content", currentRoute.description);

    const canonicalUrl = `${SITE_URL}${currentRoute.canonicalPath}`;
    const canonicalLink = ensureCanonicalLink();
    canonicalLink.setAttribute("href", canonicalUrl);

    const ogUrlTag = ensureMetaTag("property", "og:url");
    ogUrlTag.setAttribute("content", canonicalUrl);

    const ogTitleTag = ensureMetaTag("property", "og:title");
    ogTitleTag.setAttribute("content", currentRoute.title);

    const ogDescriptionTag = ensureMetaTag("property", "og:description");
    ogDescriptionTag.setAttribute("content", currentRoute.description);

    const ogImageTag = ensureMetaTag("property", "og:image");
    ogImageTag.setAttribute("content", OG_IMAGE_URL);

    const twitterTitleTag = ensureMetaTag("name", "twitter:title");
    twitterTitleTag.setAttribute("content", currentRoute.title);

    const twitterDescriptionTag = ensureMetaTag("name", "twitter:description");
    twitterDescriptionTag.setAttribute("content", currentRoute.description);

    const twitterImageTag = ensureMetaTag("name", "twitter:image");
    twitterImageTag.setAttribute("content", OG_IMAGE_URL);
  }, [currentRoute]);

  return (
    <div className="min-h-screen bg-transparent text-[color:var(--color-text-primary)]">
      <div className="sticky top-0 z-30 border-b border-[color:var(--color-border-subtle)] bg-[rgba(7,17,23,0.82)] backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(7,17,23,0.74)]">
        <div className="mx-auto w-full max-w-[var(--container-wide)]">
          <Header
            docsLabel={docsRoute?.label ?? "Docs"}
            docsPath={docsRoute?.path ?? "/docs"}
            onSettingsClick={() => setSettingsOpen(true)}
          />
          <div className="px-4 sm:px-6">
            <div className="h-px bg-gradient-to-r from-transparent via-[color:var(--color-border-strong)] to-transparent" />
          </div>
          <TabNav
            tabs={appRoutes
              .filter((route) => route.showInTabs)
              .map((route) => ({
                id: route.id,
                label: route.label,
                to: route.path,
              }))}
          />
        </div>
      </div>
      <main className="mx-auto w-full max-w-[var(--container-wide)] px-3 py-4 sm:px-6 sm:py-8">
        <SessionTimeline />
        <section className="animate-card-in mb-4 sm:mb-6 rounded-[var(--radius-panel)] border-l-2 border-l-[color:var(--color-accent)] panel-surface px-4 sm:px-5 py-3 sm:py-4">
          <h2 className="mt-2 text-lg sm:text-xl font-semibold tracking-[-0.03em] text-[color:var(--color-text-primary)]">
            {currentRoute.introTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
            {currentRoute.introDescription}
          </p>
        </section>
        <Routes>
          <Route element={<Navigate replace to="/avg-price" />} path="/" />
          {appRoutes.map((route) => (
            <Route
              element={<route.component />}
              key={route.id}
              path={route.path}
            />
          ))}
          <Route element={<Navigate replace to="/avg-price" />} path="*" />
        </Routes>
      </main>
      <footer className="mx-auto w-full max-w-[var(--container-wide)] px-4 pb-8 pt-4 sm:px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[color:var(--color-border-subtle)] to-transparent" />
        <p className="mt-4 text-center text-xs tracking-[0.04em] text-[color:var(--color-text-muted)]">
          Trading Helpers &middot; {new Date().getFullYear()}
        </p>
      </footer>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
