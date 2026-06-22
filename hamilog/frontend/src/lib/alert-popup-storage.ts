const STORAGE_KEY = "hamilog-seen-alert-popups";

export function getSeenAlertPopupIds() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(ids);
  } catch {
    return new Set<string>();
  }
}

export function saveSeenAlertPopupIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
}
