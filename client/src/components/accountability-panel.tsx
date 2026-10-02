import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ShieldCheck, UserRound, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";

type Partner = {
  id: number;
  partner_email: string;
  partner_name: string | null;
  invite_code: string;
  status: "pending" | "active" | "revoked";
  share_notes: boolean;
};

type Approval = {
  id: number;
  partner_link_id: number | null;
  action_type: "delete_account" | "disable_shield" | "remove_partner";
  status: "pending" | "approved" | "denied";
};

type Notification = {
  id: number;
  event_type: "streak_broken" | "approval_needed" | "milestone_hit";
  message: string | null;
  read: boolean;
};

const actionLabels: Record<Approval["action_type"], string> = {
  delete_account: "delete your account",
  disable_shield: "disable your DNS shield",
  remove_partner: "remove this partner",
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export function AccountabilityPanel() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [shareNotes, setShareNotes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const activePartner = useMemo(
    () => partners.find((partner) => partner.status === "active"),
    [partners],
  );

  async function loadAccountabilityData() {
    const [nextPartners, nextApprovals, nextNotifications] = await Promise.all([
      getJson<Partner[]>("/api/partners"),
      getJson<Approval[]>("/api/approvals"),
      getJson<Notification[]>("/api/partner-notifications"),
    ]);
    setPartners(nextPartners);
    setApprovals(nextApprovals);
    setNotifications(nextNotifications);
  }

  useEffect(() => {
    void loadAccountabilityData().catch(() => {
      setError("Accountability data could not be loaded.");
    });
  }, []);

  async function submitInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/partners", {
        partnerEmail,
        partnerName: partnerName || null,
        shareNotes,
      });
      setPartnerEmail("");
      setPartnerName("");
      setShareNotes(false);
      await loadAccountabilityData();
    } catch {
      setError("Enter a valid email address and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyInviteLink(code: string) {
    try {
      const inviteLink = new URL(`/partner/${code}`, window.location.origin).toString();
      await navigator.clipboard.writeText(inviteLink);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1800);
    } catch {
      setError("The invite link could not be copied. Try again from a secure browser context.");
    }
  }

  async function requestApproval(actionType: Approval["action_type"]) {
    if (!activePartner) return;
    setError("");
    try {
      await apiRequest("POST", "/api/approvals", {
        partnerLinkId: activePartner.id,
        actionType,
      });
      await loadAccountabilityData();
    } catch {
      setError("The approval request could not be sent.");
    }
  }

  async function revokePartner(partner: Partner) {
    try {
      await apiRequest("PATCH", `/api/partners/${partner.id}`, { status: "revoked" });
      await loadAccountabilityData();
    } catch {
      setError("The partner link could not be updated.");
    }
  }

  return (
    <section className="mt-4 rounded-[26px] border border-border bg-card p-5 shadow-sm sm:p-7" data-testid="card-accountability">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
          <Users className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight">Accountability partner</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Invite someone you trust to support your progress and approve sensitive changes.
          </p>
        </div>
      </div>

      <form className="mt-6 grid gap-3 sm:grid-cols-2" onSubmit={submitInvite}>
        <label className="grid gap-1.5 text-sm font-medium">
          Partner email
          <input
            type="email"
            required
            value={partnerEmail}
            onChange={(event) => setPartnerEmail(event.target.value)}
            placeholder="trusted@example.com"
            className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            data-testid="input-partner-email"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Partner name <span className="font-normal text-muted-foreground">(optional)</span>
          <input
            type="text"
            value={partnerName}
            onChange={(event) => setPartnerName(event.target.value)}
            placeholder="Alex"
            className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            data-testid="input-partner-name"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
          <input
            type="checkbox"
            checked={shareNotes}
            onChange={(event) => setShareNotes(event.target.checked)}
            className="h-4 w-4 accent-primary"
            data-testid="checkbox-share-notes"
          />
          Share personal notes with this partner
        </label>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 rounded-xl sm:w-fit"
          data-testid="button-send-partner-invite"
        >
          <UserRound className="mr-2 h-4 w-4" aria-hidden="true" />
          {isSubmitting ? "Creating…" : "Create invite"}
        </Button>
      </form>

      {error ? (
        <p className="mt-3 text-sm font-medium text-destructive" role="alert" data-testid="text-accountability-error">
          {error}
        </p>
      ) : null}

      {partners.length > 0 ? (
        <div className="mt-6 grid gap-3" data-testid="list-partners">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Partner links
          </h3>
          {partners.map((partner) => (
            <div key={partner.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {partner.partner_name || partner.partner_email}
                  </p>
                  {partner.partner_name ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{partner.partner_email}</p>
                  ) : null}
                  <span className="mt-2 inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold capitalize text-muted-foreground">
                    {partner.status}
                  </span>
                </div>
                {partner.status === "active" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-9 rounded-lg text-xs"
                    onClick={() => void revokePartner(partner)}
                    data-testid={`button-revoke-partner-${partner.id}`}
                  >
                    Revoke
                  </Button>
                ) : null}
              </div>
              {partner.status === "pending" ? (
                <div className="mt-3 rounded-xl border border-border bg-card p-3">
                  <p className="text-xs leading-5 text-muted-foreground">
                    Send the private invite link to your partner. Anyone with the link can act as this partner, so share it only with them.
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-9 rounded-lg text-xs"
                      onClick={() => void copyInviteLink(partner.invite_code)}
                      data-testid={`button-copy-invite-${partner.id}`}
                    >
                      {copiedCode === partner.invite_code ? (
                        <Check className="mr-1 h-3.5 w-3.5" />
                      ) : (
                        <Copy className="mr-1 h-3.5 w-3.5" />
                      )}
                      {copiedCode === partner.invite_code ? "Link copied" : "Copy invite link"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-border bg-background p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold">Partner approval controls</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Sensitive changes can wait for an active partner&apos;s approval.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["disable_shield", "remove_partner", "delete_account"] as const).map((action) => (
            <Button
              key={action}
              type="button"
              variant="outline"
              disabled={!activePartner}
              className="min-h-9 rounded-lg text-xs"
              onClick={() => void requestApproval(action)}
              data-testid={`button-request-${action}`}
            >
              Request to {actionLabels[action]}
            </Button>
          ))}
        </div>
        {!activePartner ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Activate a partner link to enable approval requests.
          </p>
        ) : null}
      </div>

      {approvals.length > 0 ? (
        <div className="mt-5" data-testid="list-approval-requests">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Approval requests
          </h3>
          <div className="mt-3 grid gap-2">
            {approvals.map((approval) => (
              <div key={approval.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
                <span>Request to {actionLabels[approval.action_type]}</span>
                <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold capitalize text-muted-foreground">
                  {approval.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {notifications.length > 0 ? (
        <div className="mt-5" data-testid="list-partner-notifications">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Partner activity
          </h3>
          <div className="mt-3 grid gap-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition hover:bg-secondary ${
                  notification.read ? "border-border bg-background text-muted-foreground" : "border-primary/30 bg-secondary"
                }`}
                data-testid={`notification-${notification.id}`}
              >
                <span>{notification.message || notification.event_type.replaceAll("_", " ")}</span>
                <span className="ml-2 text-xs font-medium">{notification.read ? "Seen" : "Sent"}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}