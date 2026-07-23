"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export function FavoriteButton({ productId }: { productId: string }) {
  const { data: session, status } = useSession();
  const [favorited, setFavorited] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) {
      return;
    }

    let cancelled = false;

    fetch(`/api/v1/releases/${productId}/favorite`)
      .then((response) => response.json())
      .then((json) => {
        if (!cancelled && json?.success) {
          setFavorited(Boolean(json.data.favorited));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [session, productId]);

  if (status === "loading") {
    return null;
  }

  if (!session) {
    return (
      <Link className="favorite-button" href="/login">
        <HeartIcon filled={false} />
        Favorite
      </Link>
    );
  }

  async function toggle() {
    setBusy(true);
    const nextFavorited = !favorited;

    try {
      const response = await fetch(`/api/v1/releases/${productId}/favorite`, {
        method: nextFavorited ? "POST" : "DELETE",
      });
      const json = await response.json();

      if (json?.success) {
        setFavorited(Boolean(json.data.favorited));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      aria-pressed={favorited}
      className="favorite-button"
      data-active={favorited ? "true" : "false"}
      disabled={busy}
      onClick={toggle}
      type="button"
    >
      <HeartIcon filled={favorited} />
      {favorited ? "Favorited" : "Favorite"}
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M12 21s-7.5-4.6-10-9.1C.4 8.6 2 5 5.6 5c2 0 3.4 1.1 4.4 2.6C11 6.1 12.4 5 14.4 5 18 5 19.6 8.6 22 11.9 19.5 16.4 12 21 12 21z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
