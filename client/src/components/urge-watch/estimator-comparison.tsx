import { Activity, ArrowLeftRight, CircleHelp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { EstimatorComparison } from "@/lib/urge-watch";

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown time"
    : date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

export function EstimatorComparisonCard({
  comparisons,
  referenceDrafts,
  message,
  onReferenceChange,
  onSaveReference,
}: {
  comparisons: EstimatorComparison[];
  referenceDrafts: Record<string, string>;
  message: string;
  onReferenceChange: (id: string, value: string) => void;
  onSaveReference: (id: string) => void;
}) {
  const pairedReferences = comparisons.filter((entry) =>
    entry.referenceBpm !== null && entry.orbitBpm !== null && entry.ppgBetterBpm !== null,
  );
  const orbitMae = pairedReferences.length
    ? pairedReferences.reduce((sum, entry) => sum + Math.abs(entry.orbitBpm! - entry.referenceBpm!), 0) / pairedReferences.length
    : null;
  const ppgBetterMae = pairedReferences.length
    ? pairedReferences.reduce((sum, entry) => sum + Math.abs(entry.ppgBetterBpm! - entry.referenceBpm!), 0) / pairedReferences.length
    : null;

  return (
    <Card className="mt-3 rounded-2xl border-border bg-card shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
            <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Same-capture estimator comparison</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Orbit band-pass/red-channel and PPGbetter brightness-peak estimates use the same camera session.
              The PPGbetter Android code averages image luminance and uses peaks from the last 10 seconds; its README describes the channel differently.
            </p>
          </div>
        </div>

        {pairedReferences.length > 0 ? (
          <div className="mt-4 rounded-xl border border-border bg-background p-3 text-sm">
            <p className="font-semibold">Mean absolute error against your reference</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Across {pairedReferences.length} sessions: Orbit {orbitMae!.toFixed(1)} BPM · PPGbetter {ppgBetterMae!.toFixed(1)} BPM.
              {" "}
              {orbitMae! < ppgBetterMae!
                ? "Orbit was closer to the supplied reference in this sample."
                : ppgBetterMae! < orbitMae!
                  ? "PPGbetter was closer to the supplied reference in this sample."
                  : "Both methods had the same mean error in this sample."}
              {" "}This small personal comparison is not medical validation.
            </p>
          </div>
        ) : (
          <p className="mt-4 flex gap-2 rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
            <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Agreement between estimates cannot show which is more accurate. Add a same-time reading from a separate pulse monitor to compare errors.
          </p>
        )}

        {comparisons.length ? (
          <ul className="mt-4 space-y-3">
            {comparisons.slice(0, 6).map((entry) => {
              const bothMeasured = entry.orbitBpm !== null && entry.ppgBetterBpm !== null;
              const gap = bothMeasured ? Math.abs(entry.orbitBpm! - entry.ppgBetterBpm!) : null;
              const draft = referenceDrafts[entry.id] ?? (entry.referenceBpm === null ? "" : String(entry.referenceBpm));
              const parsedDraft = Number(draft);
              const canSave = draft.trim().length > 0 && Number.isFinite(parsedDraft) && parsedDraft >= 35 && parsedDraft <= 220;
              return (
                <li key={entry.id} className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs font-medium text-muted-foreground">{formatDateTime(entry.recordedAt)}</p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Orbit · red channel</p>
                      <p className="mt-1 text-lg font-semibold">{entry.orbitBpm === null ? "No estimate" : `${entry.orbitBpm} BPM`}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">PPGbetter · luminance peaks</p>
                      <p className="mt-1 text-lg font-semibold">{entry.ppgBetterBpm === null ? "No estimate" : `${entry.ppgBetterBpm} BPM`}</p>
                    </div>
                  </div>
                  {gap !== null && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                      Estimates differ by {gap} BPM; similarity alone does not prove accuracy.
                    </p>
                  )}
                  {entry.ppgBetterBpm === null && (
                    <p className="mt-2 text-xs text-muted-foreground">{entry.ppgBetterReason} ({entry.ppgBetterPeakCount} peaks).</p>
                  )}
                  {entry.referenceBpm !== null && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Reference {entry.referenceBpm} BPM
                      {bothMeasured
                        ? ` · errors: Orbit ${Math.abs(entry.orbitBpm! - entry.referenceBpm)} BPM, PPGbetter ${Math.abs(entry.ppgBetterBpm! - entry.referenceBpm)} BPM`
                        : " · one or both methods did not return an estimate"}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <div className="min-w-40 flex-1">
                      <label htmlFor={`reference-${entry.id}`} className="mb-1 block text-xs font-medium">
                        Same-time reference BPM
                      </label>
                      <input
                        id={`reference-${entry.id}`}
                        type="number"
                        min="35"
                        max="220"
                        step="1"
                        inputMode="numeric"
                        value={draft}
                        onChange={(event) => onReferenceChange(entry.id, event.target.value)}
                        placeholder="From another monitor"
                        className="min-h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!canSave}
                      onClick={() => onSaveReference(entry.id)}
                      className="min-tap min-h-10 rounded-lg border border-primary bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:border-[#3f6250] hover:bg-[#3f6250] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Save reference
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Complete a camera check-in to save a same-session comparison.</p>
        )}
        {message && <p className="mt-3 text-xs text-primary" role="status">{message}</p>}
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          PPGbetter&rsquo;s active Android code limits neighboring peaks to gaps over 600 ms, which may miss faster pulses. Use a separate reference device before deciding which method is closer.
        </p>
      </CardContent>
    </Card>
  );
}