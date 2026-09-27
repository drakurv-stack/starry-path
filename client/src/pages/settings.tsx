import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Info,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { OrbitLogo } from "@/components/orbit-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useContentShield } from "@/lib/content-shield";

const PROFILE_KEY = "orbit:profile";
const DNS_PENDING_KEY = "orbit:dns-protection-pending";

type Profile = {
  seedName?: string;
  signaturePreview?: string;
  dnsProtectionEnabled?: boolean;
  [key: string]: unknown;
};

type Device = "android" | "ios" | "other";

function readProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProfile(nextProfile: Profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
}

function detectDevice(): Device {
  const userAgent = navigator.userAgent;
  if (/Android/i.test(userAgent)) return "android";
  if (
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  ) {
    return "ios";
  }
  return "other";
}

function deviceSettingsPath(device: Device) {
  if (device === "android") {
    return "Settings → Network & internet → Private DNS";
  }
  if (device === "ios") {
    return "Settings → Wi-Fi → tap ⓘ beside your network → Configure DNS";
  }
  return "Open your device settings and look for Private DNS or Configure DNS";
}

function deviceSettingsLink(device: Device) {
  if (device === "android") {
    return "intent:#Intent;action=android.settings.PRIVATE_DNS_SETTINGS;end";
  }
  if (device === "ios") {
    return "App-Prefs:root=WIFI";
  }
  return null;
}

export default function Settings() {
  const [, navigate] = useLocation();
  const { isActive: isContentShieldActive, engage, disengage } = useContentShield();
  const [profile, setProfile] = useState<Profile>(() => readProfile());
  const [showSetup, setShowSetup] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [device, setDevice] = useState<Device>("other");

  const dnsProtectionEnabled = profile.dnsProtectionEnabled === true;
  const settingsPath = useMemo(() => deviceSettingsPath(device), [device]);

  useEffect(() => {
    setDevice(detectDevice());
  }, []);

  useEffect(() => {
    function handleVisibilityChange() {
      if (
        document.visibilityState === "visible" &&
        sessionStorage.getItem(DNS_PENDING_KEY) === "true"
      ) {
        sessionStorage.removeItem(DNS_PENDING_KEY);
        setShowConfirmation(true);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  function updateDnsProtection(enabled: boolean) {
    const nextProfile = { ...profile, dnsProtectionEnabled: enabled };
    setProfile(nextProfile);
    saveProfile(nextProfile);
  }

  function openDeviceSettings() {
    sessionStorage.setItem(DNS_PENDING_KEY, "true");
    const link = deviceSettingsLink(device);
    if (link) {
      window.location.assign(link);
    }
    setShowSetup(false);
  }

  function keepProtectionOff() {
    sessionStorage.removeItem(DNS_PENDING_KEY);
    setShowConfirmation(false);
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="mx-auto w-full max-w-3xl px-5 py-8 pb-32 sm:px-8">
        <div className="page-in">
          <header className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="min-tap grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Back to home"
              data-testid="button-settings-back"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <div>
              <OrbitLogo className="text-sm" testId="text-settings-brand" />
              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Settings
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                A few simple choices to make your recovery space work better for you.
              </p>
            </div>
          </header>

          <section className="mt-8" aria-labelledby="protection-heading">
            <div className="mb-3 flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2
                id="protection-heading"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Protection & permissions
              </h2>
            </div>

            <div
              className="rounded-[26px] border border-border bg-card p-5 shadow-sm sm:p-7"
              data-testid="card-dns-protection"
            >
              <div className="flex items-start justify-between gap-5">
                <div className="flex gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">
                      DNS Content Filter
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Helps block known adult and unsafe websites across your device.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={dnsProtectionEnabled}
                  disabled={!dnsProtectionEnabled}
                  aria-label="DNS Content Filter status"
                  data-testid="switch-dns-protection"
                />
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-background p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold">What this can and can’t do</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      A DNS filter works at the device level. It can help stop known unsafe
                      sites before they open.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Orbit cannot turn this on from inside a browser. It also cannot control
                      content inside an allowed site, or apps that use their own connection.
                    </p>
                  </div>
                </div>
              </div>

              {dnsProtectionEnabled ? (
                <div
                  className="mt-5 flex items-center gap-2 text-sm font-medium text-primary"
                  data-testid="text-dns-enabled"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Protection marked as on
                </div>
              ) : (
                <Button
                  type="button"
                  className="mt-5 min-h-12 w-full justify-between rounded-xl px-4 text-sm font-semibold sm:w-auto sm:min-w-52"
                  onClick={() => setShowSetup(true)}
                  data-testid="button-setup-protection"
                >
                  Set Up Protection
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>

            <div
              className="mt-4 flex flex-col gap-4 rounded-[26px] border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"
              data-testid="card-in-app-content-shield"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight">In-App Content Shield</h3>
                  <p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">
                    Instantly pauses outbound links and external previews while you use Orbit.
                  </p>
                  <p
                    className="mt-2 text-xs font-medium text-primary"
                    data-testid="text-in-app-shield-status"
                  >
                    {isContentShieldActive ? "On now" : "Off"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant={isContentShieldActive ? "outline" : "default"}
                className="min-h-11 shrink-0 rounded-xl"
                onClick={isContentShieldActive ? disengage : engage}
                data-testid="button-in-app-content-shield"
              >
                {isContentShieldActive ? "Turn off shield" : "Turn on shield"}
              </Button>
            </div>
          </section>
        </div>
      </main>
      <AppNav />

      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-[26px] border-border bg-card p-6 sm:max-w-md">
          <DialogHeader className="text-left">
            <div className="mb-2 grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-primary">
              <Smartphone className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle className="text-xl">Add a little more protection</DialogTitle>
            <DialogDescription className="pt-2 text-left leading-6">
              CleanBrowsing is a DNS service that helps block known adult and unsafe websites.
              You turn it on in your device settings, not in Orbit.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
            <p className="font-semibold text-foreground">On your device, go to:</p>
            <p className="mt-1">{settingsPath}</p>
            {device === "other" ? (
              <p className="mt-2 text-xs">
                We couldn’t identify your phone, so use the path that matches your device.
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-xl"
              onClick={() => setShowSetup(false)}
              data-testid="button-cancel-protection"
            >
              Not now
            </Button>
            <Button
              type="button"
              className="min-h-11 rounded-xl"
              onClick={openDeviceSettings}
              data-testid="button-open-device-settings"
            >
              Open device settings
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-[26px] border-border bg-card p-6 sm:max-w-md">
          <DialogHeader className="text-left">
            <div className="mb-2 grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle className="text-xl">Did you turn it on?</DialogTitle>
            <DialogDescription className="pt-2 text-left leading-6">
              Tell us what you chose in your device settings. We’ll only mark protection as
              on when you confirm it here.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-xl"
              onClick={keepProtectionOff}
              data-testid="button-protection-not-yet"
            >
              Not yet
            </Button>
            <Button
              type="button"
              className="min-h-11 rounded-xl"
              onClick={() => {
                updateDnsProtection(true);
                setShowConfirmation(false);
              }}
              data-testid="button-protection-confirm"
            >
              Yes, I turned it on
              <Check className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}