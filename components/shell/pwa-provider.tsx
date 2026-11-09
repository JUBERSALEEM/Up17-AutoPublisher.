"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { RefreshCw, WifiOff, X } from "lucide-react";
import { Button, IconButton } from "@/components/ui";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
interface PwaContextValue {
  canInstall: boolean;
  install: () => Promise<void>;
  offline: boolean;
  installed: boolean;
}
const PwaContext = createContext<PwaContextValue>({
  canInstall: false,
  install: async () => {},
  offline: false,
  installed: false,
});

function subscribeNetwork(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}
function subscribeDisplay(listener: () => void) {
  const media = matchMedia("(display-mode: standalone)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [update, setUpdate] = useState<ServiceWorkerRegistration | null>(null);
  const [installEvent, setInstallEvent] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const offline = useSyncExternalStore(
    subscribeNetwork,
    () => !navigator.onLine,
    () => false,
  );
  const standalone = useSyncExternalStore(
    subscribeDisplay,
    () => matchMedia("(display-mode: standalone)").matches,
    () => false,
  );
  useEffect(() => {
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const onInstalled = () => {
      setInstallEvent(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    let active = true;
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          if (!active) return;
          if (registration.waiting)
            queueMicrotask(() => {
              if (active) setUpdate(registration);
            });
          registration.addEventListener("updatefound", () => {
            const worker = registration.installing;
            worker?.addEventListener("statechange", () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller && active)
                setUpdate(registration);
            });
          });
        })
        .catch(() => {
          /* Unsupported/denied service workers do not block the app. */
        });
    }
    return () => {
      active = false;
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  const install = useCallback(async () => {
    if (!prompt) return;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } finally {
      setPrompt(null);
    }
  }, [prompt]);
  return (
    <PwaContext.Provider
      value={{
        canInstall: Boolean(prompt),
        install,
        offline,
        installed: standalone || installEvent,
      }}
    >
      {children}
      {offline ? (
        <div className="pwa-banner pwa-offline" role="status">
          <WifiOff size={18} aria-hidden="true" />
          <span>You’re offline. Demo browsing is available; no actions can be sent.</span>
        </div>
      ) : null}
      {update && !dismissed ? (
        <div className="pwa-banner" role="status">
          <RefreshCw size={18} aria-hidden="true" />
          <span>A new app shell is available.</span>
          <Button
            size="sm"
            onClick={() => {
              update.waiting?.postMessage({ type: "SKIP_WAITING" });
              window.location.reload();
            }}
          >
            Update
          </Button>
          <IconButton label="Dismiss update" onClick={() => setDismissed(true)}>
            <X size={18} />
          </IconButton>
        </div>
      ) : null}
    </PwaContext.Provider>
  );
}
export function usePwa() {
  return useContext(PwaContext);
}
