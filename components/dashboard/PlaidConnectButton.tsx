"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

interface Props {
  onSuccess?: () => void;
}

export function PlaidConnectButton({ onSuccess }: Props) {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plaid/link-token", { method: "POST" })
      .then(r => r.json())
      .then(d => setLinkToken(d.link_token ?? null))
      .catch(console.error);
  }, []);

  const onPlaidSuccess = useCallback(async (publicToken: string) => {
    await fetch("/api/plaid/exchange", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ public_token: publicToken }),
    });
    onSuccess?.();
    window.location.reload();
  }, [onSuccess]);

  const { open, ready } = usePlaidLink({
    token: linkToken ?? "",
    onSuccess: onPlaidSuccess,
  });

  return (
    <button
      onClick={() => open()}
      disabled={!ready || !linkToken}
      className="px-3 py-1.5 text-xs font-semibold rounded-md disabled:opacity-40 transition-opacity"
      style={{ background: "var(--accent)", color: "var(--ink-0)" }}
    >
      + Connect Account
    </button>
  );
}
