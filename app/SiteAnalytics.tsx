"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Microsoft Clarity, kept off the pages where students type their own
 * coursework.
 *
 * Vercel Web Analytics and Speed Insights are mounted separately in the root
 * layout: those are aggregate and capture no input, so they run everywhere.
 * Clarity records sessions, so it is held off the assessment and evaluation
 * pages, which hold matching codes, confidence ratings, written
 * justifications, and scoring of named classmates.
 */

/** Clarity project ids are public; the env var only exists to override it. */
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "ybp01y5gqd";

const SENSITIVE_PATHS = [
  "/umkc/govtacctclass/assessment",
  "/umkc/govtacctclass/eval",
];

function isSensitive(pathname: string): boolean {
  return SENSITIVE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

// Module scope, so a client-side navigation does not re-initialise the SDK.
let clarityStarted = false;

export default function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !CLARITY_ID) return;
    const sensitive = isSensitive(pathname);
    let cancelled = false;

    void import("@microsoft/clarity").then(({ default: Clarity }) => {
      if (cancelled) return;

      if (sensitive) {
        // The SDK exposes no stop(), so withdraw consent instead. The forms
        // themselves are also marked data-clarity-mask, so a recording that is
        // somehow already running still cannot read what was typed.
        if (clarityStarted) Clarity.consent(false);
        return;
      }

      if (!clarityStarted) {
        Clarity.init(CLARITY_ID);
        clarityStarted = true;
      }
      Clarity.consent(true);
    });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
