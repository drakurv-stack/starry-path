import { Link } from "wouter";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-dvh app-bg text-foreground">
      <div className="mx-auto w-full max-w-[420px] px-4 py-8">
        <Card className="glass glow overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Sparkles className="h-4 w-4" />
              <span data-testid="text-notfound-kicker">Orbit</span>
            </div>

            <h1
              className="mt-3 font-[var(--font-serif)] text-3xl leading-tight text-white"
              data-testid="text-notfound-title"
            >
              This page drifted off course
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70" data-testid="text-notfound-subcopy">
              No worries \u2014 let\u2019s bring you back to safety.
            </p>

            <div className="mt-5">
              <Link href="/welcome" data-testid="link-notfound-back">
                <a className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 transition hover:bg-white/10 active:scale-[0.99]">
                  <ArrowLeft className="h-4 w-4" />
                  Back to start
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
