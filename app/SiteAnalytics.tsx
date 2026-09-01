"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Product analytics and session tooling, kept off the pages where students
 * type their own coursework.
 *
 * Vercel Web Analytics and Speed Insights are mounted separately in the root
 * layout: those are aggregate and capture no input, so they run everywhere.
 * PostHog and Microsoft Clarity are different — Clarity records sessions and
 * PostHog can autocapture form interaction — so both are held off the
 * assessment and evaluation pages, which hold matching codes, confidence
 * ratings, written justifications, and scoring of named classmates.
 */

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

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

// Module scope, so a client-side navigation does not re-initialise either SDK.
let posthogStarted = false;
let clarityStarted = false;

export default function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const sensitive = isSensitive(pathname);
    let cancelled = false;

    if (POSTHOG_KEY) {
      void import("posthog-js").then(({ default: posthog }) => {
        if (cancelled) return;

        if (!posthogStarted) {
          // Never open a session from a page holding student answers.
          if (sensitive) return;
          posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            person_profiles: "identified_only",
            autocapture: false,
            disable_session_recording: true,
            // Captured per route below, since App Router navigates client-side.
            capture_pageview: false,
          });
          posthogStarted = true;
        }

        if (sensitive) {
          posthog.opt_out_capturing();
          return;
        }
        if (posthog.has_opted_out_capturing()) posthog.opt_in_capturing();
        posthog.capture("$pageview");
      });
    }

    if (CLARITY_ID) {
      void import("@microsoft/clarity").then(({ default: Clarity }) => {
        if (cancelled) return;

        if (sensitive) {
          // The SDK exposes no stop(), so withdraw consent instead. The forms
          // themselves are also marked data-clarity-mask, so a recording that
          // is somehow already running still cannot read what was typed.
          if (clarityStarted) Clarity.consent(false);
          return;
        }

        if (!clarityStarted) {
          Clarity.init(CLARITY_ID);
          clarityStarted = true;
        }
        Clarity.consent(true);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
