import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Bell, Check, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrbitLogo } from "@/components/orbit-logo";
import { apiRequest } from "@/lib/queryClient";

type PartnerProfile = {
  partner_email: string;
  partner_name: string | null;
  status: "pending" | "active" | "revoked";
  share_notes: boolean;
  owner_name: string;
  personal_note: string | null;
};

type Approval = {
  id: number;
  action_type: "delete_account" | "disable_shield" | "remove_partner";
  status: "pending" | "approved" | "denied";
  created_at: string;
};

type Notification = {
  id: number;
  event_type: "streak_broken" | "approval_needed" | "milestone_hit";
  message: string | null;
  sent_at: string;
  read: boolean;
};

const actionLabels: Record<Approval["action_type"], string> = {
  delete_account: "delete their account",
  disable_shield: "disable their DNS shield",
  remove_partner: "remove the accountability link",
};

async function postWithInvite<T>(url: string, inviteCode: string): Promise<T> {
  const response = await apiRequest("POST", url, { inviteCode });
  return response.json() as Promise<T>;
}

export default function PartnerPortal() {
  const [, params] = useRoute("/partner/:inviteCode");
  const inviteCode = params?.inviteCode ?? "";
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function refreshPortal(code: string) {
    const nextProfile = await postWithInvite<PartnerProfile>(
      "/api/partner-portal/lookup",
      code,
    );
    setProfile(nextProfile);
    if (nextProfile.status === "active") {
      const [nextApprovals, nextNotifications] = await Promise.all([
        postWithInvite<Approval[]>("/api/partner-portal/approvals", code),
        postWithInvite<Notification[]>("/api/partner-portal/notifications", code),
      ]);
      setApprovals(nextApprovals);
      setNotifications(nextNotifications);
    } else {
      setApprovals([]);
      setNotifications([]);
    }
  }

  useEffect(() => {
    if (!inviteCode) {
      setError("This invitation link is incomplete.");
      setLoading(false);
      return;
    }
    void refreshPortal(inviteCode)
      .catch(() => setError("This invitation link is invalid or unavailable."))
      .finally(() => setLoading(false));
  }, [inviteCode]);

  async function acceptInvite() {
    if (!inviteCode) return;
    setError("");
    setLoading(true);
    try {
      await postWithInvite<PartnerProfile>("/api/partner-portal/accept", inviteCode);
      await refreshPortal(inviteCode);
    } catch {
      setError("This invitation can no longer be accepted.");
    } finally {
      setLoading(false);
    }
  }

  async function resolveApproval(approval: Approval, status: "approved" | "denied") {
    if (!inviteCode) return;
    setBusyId(approval.id);
    setError("");
    try {
      await apiRequest("POST", `/api/partner-portal/approvals/${approval.id}/resolve`, {
        inviteCode,
        status,
      });
      await refreshPortal(inviteCode);
    } catch {
      setError("This request could not be updated. Refresh and try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function markNotificationRead(notification: Notification) {
    if (!inviteCode || notification.read) return;
    try {
      await apiRequest(
        "POST",
        `/api/partner-portal/notifications/${notification.id}/read`,
        { inviteCode },
      );
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      );
    } catch {
      setError("The notification could not be marked as read.");
    }
  }

  return (
    <main className="min-h-dvh bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <header className="rounded-[26px] border border-border bg-card p-6 shadow-sm sm:p-8">
          <OrbitLogo className="text-sm" testId="text-partner-portal-brand" />
          <div className="mt-6 flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Orbit partner portal
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Support {profile?.owner_name || "your partner"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Review sensitive requests and see the updates shared with you.
              </p>
            </div>
          </div>
        </header>

        {error ? (
          <p
            className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            role="alert"
            data-testid="text-partner-portal-error"
          >
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground" role="status">
            Loading invitation…
          </p>
        ) : profile?.status === "pending" ? (
          <section className="mt-4 rounded-[26px] border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold">You’ve been invited</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {profile.owner_name} invited you to be an accountability partner.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              This invitation was addressed to {profile.partner_email}.
            </p>
            {profile.share_notes && profile.personal_note ? (
              <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Shared personal note
                </p>
                <p className="mt-2 text-sm leading-6">{profile.personal_note}</p>
              </div>
            ) : null}
            <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs leading-5 text-muted-foreground">
              This private link grants access to partner updates and lets you
              respond to approval requests. Only accept it if you are the person
              who was invited, and do not forward the link.
            </p>
            <Button
              type="button"
              className="mt-5 min-h-11 rounded-xl"
              onClick={() => void acceptInvite()}
              data-testid="button-accept-partner-invite"
            >
              Accept invitation
            </Button>
          </section>
        ) : profile?.status === "revoked" ? (
          <section className="mt-4 rounded-[26px] border border-border bg-card p-6">
            <h2 className="font-semibold">This partner link was revoked</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask {profile.owner_name} for a new invitation if this was unexpected.
            </p>
          </section>
        ) : profile?.status === "active" ? (
          <div className="mt-4 grid gap-4">
            <section className="rounded-[26px] border border-border bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-semibold">Approval requests</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your response will be saved and shown in Orbit Settings.
              </p>
              {approvals.length ? (
                <div className="mt-5 grid gap-3">
                  {approvals.map((approval) => (
                    <div
                      key={approval.id}
                      className="rounded-2xl border border-border bg-background p-4"
                      data-testid={`partner-approval-${approval.id}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium">
                          Request to {actionLabels[approval.action_type]}
                        </p>
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold capitalize text-muted-foreground">
                          {approval.status}
                        </span>
                      </div>
                      {approval.status === "pending" ? (
                        <div className="mt-4 flex gap-2">
                          <Button
                            type="button"
                            className="min-h-10 flex-1 rounded-xl"
                            disabled={busyId === approval.id}
                            onClick={() => void resolveApproval(approval, "approved")}
                            data-testid={`button-approve-${approval.id}`}
                          >
                            <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                            Approve
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="min-h-10 flex-1 rounded-xl"
                            disabled={busyId === approval.id}
                            onClick={() => void resolveApproval(approval, "denied")}
                            data-testid={`button-deny-${approval.id}`}
                          >
                            <X className="mr-2 h-4 w-4" aria-hidden="true" />
                            Deny
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                  There are no approval requests right now.
                </p>
              )}
            </section>

            <section className="rounded-[26px] border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 className="text-lg font-semibold">Partner updates</h2>
              </div>
              {notifications.length ? (
                <div className="mt-4 grid gap-2">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition hover:bg-secondary ${
                        notification.read
                          ? "border-border bg-background text-muted-foreground"
                          : "border-primary/30 bg-secondary"
                      }`}
                      onClick={() => void markNotificationRead(notification)}
                      data-testid={`button-partner-notification-${notification.id}`}
                    >
                      {notification.message ||
                        notification.event_type.replaceAll("_", " ")}
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {new Date(notification.sent_at).toLocaleString()}
                        {notification.read ? " · Read" : " · Mark as read"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                  No updates have been shared yet.
                </p>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}