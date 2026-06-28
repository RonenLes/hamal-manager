const SOUND_PATHS = {
  alert: "/sounds/alert_sound.mp3",
  notification: "/sounds/notification_sound.mp3",
};

const SOUND_MUTED_KEY = "hamilog-sound-muted";
const NOTIFICATIONS_DISABLED_KEY = "hamilog-notifications-disabled";

export type AppSound = keyof typeof SOUND_PATHS;

export function isSoundMuted() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SOUND_MUTED_KEY) === "true";
}

export function isNotificationsDisabled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NOTIFICATIONS_DISABLED_KEY) === "true";
}

export function playAppSound(sound: AppSound) {
  if (typeof window === "undefined") return;
  if (isSoundMuted()) return;

  const audio = new Audio(SOUND_PATHS[sound]);
  audio.volume = 0.7;
  audio.play().catch(() => {
    // Browsers can block sound until the user interacts with the page.
  });
}
