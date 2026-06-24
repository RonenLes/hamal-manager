const SOUND_PATHS = {
  alert: "/sounds/alert_sound.mp3",
  notification: "/sounds/notification_sound.mp3",
};

export type AppSound = keyof typeof SOUND_PATHS;

export function playAppSound(sound: AppSound) {
  if (typeof window === "undefined") return;

  const audio = new Audio(SOUND_PATHS[sound]);
  audio.volume = 0.7;
  audio.play().catch(() => {
    // Browsers can block sound until the user interacts with the page.
  });
}
