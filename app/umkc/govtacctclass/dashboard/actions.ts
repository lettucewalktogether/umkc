"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  configuredPasscode,
  safeEqual,
  sessionToken,
} from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const passcode = configuredPasscode();
  if (!passcode) {
    return {
      error:
        "No instructor passcode is configured for this deployment. Set INSTRUCTOR_PASSCODE in the Vercel project settings and redeploy.",
    };
  }

  const submitted = String(formData.get("passcode") ?? "");
  if (!safeEqual(submitted, passcode)) {
    return { error: "That passcode was not recognized." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, await sessionToken(passcode), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/umkc/govtacctclass",
    maxAge: 60 * 60 * 12,
  });

  const next = String(formData.get("next") ?? "");
  redirect(
    next.startsWith("/umkc/govtacctclass") ? next : "/umkc/govtacctclass/dashboard",
  );
}

export async function logout() {
  const store = await cookies();
  store.delete({ name: SESSION_COOKIE, path: "/umkc/govtacctclass" });
  redirect("/umkc/govtacctclass/dashboard/login");
}
