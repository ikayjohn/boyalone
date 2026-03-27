export const ANALYTICS_EVENT_TYPES = [
  "homepage_view",
  "register_click",
  "registration_modal_open",
  "presave_click",
  "registration_form_unlock",
  "signup_complete",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];
export interface AnalyticsAttribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
}

const VISITOR_ID_KEY = "boyalone_visitor_id";
const SESSION_ID_KEY = "boyalone_session_id";
const ATTRIBUTION_KEY = "boyalone_utm_attribution";

function getStorageValue(
  storage: Storage,
  key: string
) {
  const existing = storage.getItem(key);

  if (existing) {
    return existing;
  }

  const nextValue = crypto.randomUUID();
  storage.setItem(key, nextValue);
  return nextValue;
}

export function getAnalyticsIdentity() {
  if (typeof window === "undefined") {
    return { visitorId: null, sessionId: null };
  }

  try {
    return {
      visitorId: getStorageValue(window.localStorage, VISITOR_ID_KEY),
      sessionId: getStorageValue(window.sessionStorage, SESSION_ID_KEY),
    };
  } catch {
    return { visitorId: null, sessionId: null };
  }
}

function extractAttributionFromUrl() {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const attribution: AnalyticsAttribution = {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmTerm: params.get("utm_term"),
    utmContent: params.get("utm_content"),
  };

  const hasAttribution = Object.values(attribution).some(Boolean);
  return hasAttribution ? attribution : null;
}

function storeAttribution(attribution: AnalyticsAttribution) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    // Ignore storage failures and continue without persistence.
  }
}

export function getAnalyticsAttribution(): AnalyticsAttribution {
  if (typeof window === "undefined") {
    return {
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmTerm: null,
      utmContent: null,
    };
  }

  const currentAttribution = extractAttributionFromUrl();

  if (currentAttribution) {
    storeAttribution(currentAttribution);
    return currentAttribution;
  }

  try {
    const stored = window.localStorage.getItem(ATTRIBUTION_KEY);

    if (!stored) {
      return {
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        utmTerm: null,
        utmContent: null,
      };
    }

    const parsed = JSON.parse(stored) as Partial<AnalyticsAttribution>;

    return {
      utmSource: parsed.utmSource ?? null,
      utmMedium: parsed.utmMedium ?? null,
      utmCampaign: parsed.utmCampaign ?? null,
      utmTerm: parsed.utmTerm ?? null,
      utmContent: parsed.utmContent ?? null,
    };
  } catch {
    return {
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmTerm: null,
      utmContent: null,
    };
  }
}

export function trackEvent(
  eventType: AnalyticsEventType,
  options: {
    path?: string;
    visitorId?: string | null;
    sessionId?: string | null;
  } = {}
) {
  if (typeof window === "undefined") {
    return;
  }

  const identity = getAnalyticsIdentity();
  const attribution = getAnalyticsAttribution();
  const payload = {
    eventType,
    path: options.path ?? window.location.pathname,
    visitorId: options.visitorId ?? identity.visitorId,
    sessionId: options.sessionId ?? identity.sessionId,
    ...attribution,
  };

  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  });
}

export function trackOncePerTab(
  key: string,
  eventType: AnalyticsEventType,
  options: {
    path?: string;
  } = {}
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const storageKey = `boyalone_once_${key}`;

    if (window.sessionStorage.getItem(storageKey) === "1") {
      return;
    }

    window.sessionStorage.setItem(storageKey, "1");
    trackEvent(eventType, options);
  } catch {
    trackEvent(eventType, options);
  }
}
