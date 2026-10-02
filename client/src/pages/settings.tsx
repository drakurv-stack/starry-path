import { useEffect, useState } from "react";
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
import { AccountabilityPanel } from "@/components/accountability-panel";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
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

type Platform = "windows" | "android";

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

function detectPlatform(): Platform {
  return /Android/i.test(navigator.userAgent) ? "android" : "windows";
}

function CopyableDnsValue({
  value,
  copied,
  onCopy,
}: {
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <span className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
      <code className="min-w-0 flex-1 break-all text-xs font-semibold text-foreground">
        {value}
      </code>
      <button
        type="button"
        className="shrink-0 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
        onClick={onCopy}
        aria-label={`Copy ${value}`}
        data-testid={`button-copy-${value.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
  );
}

export default function Settings() {
  const [, navigate] = useLocation();
  const { isActive: isContentShieldActive, engage, disengage } = useContentShield();
  const [profile, setProfile] = useState<Profile>(() => readProfile());
  const [showSetup, setShowSetup] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [platform, setPlatform] = useState<Platform>("windows");
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const dnsProtectionEnabled = profile.dnsProtectionEnabled === true;

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Profile unavailable"))))
      .then((savedProfile) => {
        setProfile((current) => ({
          ...current,
          dnsProtectionEnabled: savedProfile.shield_status === true,
          signaturePreview: savedProfile.personal_note ?? current.signaturePreview,
        }));
      })
      .catch(() => {
        // The local profile remains available if the database cannot be reached.
      });
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
    void apiRequest("PATCH", "/api/profile", { shieldStatus: enabled }).catch(() => {
      // Keep the local state; the server value will be reloaded on the next visit.
    });
  }

  function openDeviceSettings() {
    if (platform === "android") {
      sessionStorage.setItem(DNS_PENDING_KEY, "true");
      window.location.assign(
        "intent:#Intent;action=android.settings.PRIVATE_DNS_SETTINGS;end",
      );
    }
    setShowSetup(false);
  }

  async function copyValue(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setCopiedValue(value);
    window.setTimeout(() => {
      setCopiedValue((current) => (current === value ? null : current));
    }, 1800);
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
          <AccountabilityPanel />
        </div>
      </main>
      <AppNav />

      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="max-h-[min(90dvh,760px)] w-[calc(100%-2rem)] overflow-y-auto rounded-[26px] border-border bg-card p-6 sm:max-w-lg">
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

          <div
            className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-background p-1"
            role="tablist"
            aria-label="Choose your platform"
            data-testid="group-platform-picker"
          >
            {(["windows", "android"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={platform === option}
                className={`min-h-11 rounded-lg px-4 text-sm font-semibold capitalize transition ${
                  platform === option
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setPlatform(option);
                  setCopiedValue(null);
                }}
                data-testid={`button-platform-${option}`}
              >
                {option}
              </button>
            ))}
          </div>

          {platform === "windows" ? (
            <ol className="grid gap-3 text-sm leading-6 text-muted-foreground" data-testid="list-windows-steps">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">1.</span>
                <span>Open Settings &gt; Network &amp; Internet</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">2.</span>
                <span>Click Wi-Fi (or Ethernet if wired), then click your connected network</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">3.</span>
                <span>Scroll to DNS server assignment, click Edit</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">4.</span>
                <span>Change from “Automatic (DHCP)” to Manual</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">5.</span>
                <span>Turn on IPv4</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">6.</span>
                <span className="min-w-0 flex-1">
                  <span>Enter Preferred DNS:</span>
                  <CopyableDnsValue
                    value="185.228.168.10"
                    copied={copiedValue === "185.228.168.10"}
                    onCopy={() => void copyValue("185.228.168.10")}
                  />
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">7.</span>
                <span className="min-w-0 flex-1">
                  <span>Enter Alternate DNS:</span>
                  <CopyableDnsValue
                    value="185.228.169.11"
                    copied={copiedValue === "185.228.169.11"}
                    onCopy={() => void copyValue("185.228.169.11")}
                  />
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">8.</span>
                <span>Click Save</span>
              </li>
            </ol>
          ) : (
            <ol className="grid gap-3 text-sm leading-6 text-muted-foreground" data-testid="list-android-steps">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">1.</span>
                <span>Open Settings &gt; Network &amp; Internet (or Connections on Samsung)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">2.</span>
                <span>Tap Private DNS</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">3.</span>
                <span>Select Private DNS provider hostname</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">4.</span>
                <span className="min-w-0 flex-1">
                  <span>Enter:</span>
                  <CopyableDnsValue
                    value="family-filter-dns.cleanbrowsing.org"
                    copied={copiedValue === "family-filter-dns.cleanbrowsing.org"}
                    onCopy={() => void copyValue("family-filter-dns.cleanbrowsing.org")}
                  />
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">5.</span>
                <span>Tap Save</span>
              </li>
            </ol>
          )}

          {platform === "android" ? (
            <p
              className="rounded-2xl border border-border bg-background p-4 text-xs leading-5 text-muted-foreground"
              data-testid="text-android-dns-note"
            >
              <span className="font-semibold text-foreground">Note:</span> if your Android version
              doesn&apos;t support Private DNS hostname mode, use per-network manual DNS instead
              — tap your Wi-Fi network &gt; pencil/edit icon &gt; Advanced options &gt; DNS =
              &quot;Static&quot; &gt; enter 185.228.168.10 / 185.228.169.11.
            </p>
          ) : null}

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
              {platform === "android" ? "Open Android settings" : "I’ll set this up in Windows"}
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