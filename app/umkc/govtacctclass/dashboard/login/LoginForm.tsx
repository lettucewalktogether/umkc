"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <form action={formAction} className="form-ui" style={{ maxWidth: "26rem" }}>
      <input type="hidden" name="next" value={next} />
      <label className="field">
        <span>Instructor passcode</span>
        <input
          type="password"
          name="passcode"
          autoComplete="current-password"
          autoFocus
          required
        />
      </label>
      <div className="buttonrow">
        <button type="submit" className="primary" disabled={pending}>
          {pending ? "Checking…" : "Sign in"}
        </button>
      </div>
      {state.error && (
        <p className="status incomplete" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
