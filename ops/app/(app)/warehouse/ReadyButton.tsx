"use client";
import { useActionState, useEffect, useState } from "react";
import { setReadyAction } from "./actions";
import type { ActionState } from "../admin/users/actions";
import { Icon } from "@/components/ui/Icon";

const UNDO_MS = 5 * 60 * 1000;

export function ReadyButton({ id, status, readyAt, labels }: {
  id: string; status: "new" | "ready" | string; readyAt: string | null;
  labels: { ready: string; done: string; undo: string; errors: Record<string, string> };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(setReadyAction, {});
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 15_000); return () => clearInterval(i); }, []);
  const canUndo = status === "ready" && readyAt !== null && now - new Date(readyAt).getTime() < UNDO_MS;
  return (
    <div className="flex flex-col items-end gap-1">
      {status === "new" ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} /><input type="hidden" name="to" value="ready" />
          <button disabled={pending} className="flex h-14 min-w-36 items-center justify-center gap-2 bg-ok-600 px-6 text-lg font-extrabold text-white disabled:opacity-60">
            <Icon name="check" className="text-2xl" />{labels.ready}
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <span className="flex h-14 items-center gap-2 bg-ok-50 px-5 text-lg font-extrabold text-ok-600"><Icon name="done_all" />{labels.done}</span>
          {canUndo && (
            <form action={action}>
              <input type="hidden" name="id" value={id} /><input type="hidden" name="to" value="new" />
              <button disabled={pending} className="h-14 px-4 text-sm font-bold text-ink-500 underline">{labels.undo}</button>
            </form>
          )}
        </div>
      )}
      {state.error && <span role="alert" className="text-xs font-bold text-bad-600">{labels.errors[state.error] ?? labels.errors["common.error_generic"]}</span>}
    </div>
  );
}
