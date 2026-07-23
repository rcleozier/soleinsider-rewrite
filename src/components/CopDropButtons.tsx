"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { LegacyRelease } from "@/lib/legacyMobileApi";

export function CopDropButtons({
  release,
  showPercentages = true,
  variant = "solid",
}: {
  release: LegacyRelease;
  showPercentages?: boolean;
  variant?: "solid" | "secondary";
}) {
  const { data: session } = useSession();
  const [votes, setVotes] = useState(() => ({
    yes: Number(release.yes_votes) || 0,
    no: Number(release.no_votes) || 0,
  }));
  const [feedback, setFeedback] = useState("");
  const percentages = useMemo(() => getPercentages(votes.yes, votes.no), [votes]);
  const totalVotes = votes.yes + votes.no;
  const shouldShowPercentages = showPercentages && totalVotes >= 10;
  const shouldShowStatus = totalVotes < 10 || feedback;

  async function submitVote(status: "1" | "0") {
    const previousVotes = votes;
    const nextVotes =
      status === "1"
        ? { ...previousVotes, yes: previousVotes.yes + 1 }
        : { ...previousVotes, no: previousVotes.no + 1 };

    setVotes(nextVotes);
    setFeedback("Saving vote...");

    try {
      // Signed-in members get a real, replaceable per-member vote tracked on
      // their profile; anonymous visitors keep the old always-append behavior.
      const response = session
        ? await fetch(`/api/v1/releases/${release.product_id}/vote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: status === "1" ? "cop" : "drop" }),
          })
        : await fetch("/mobileapi/coporNot", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              product_id: release.product_id,
              member_id: "0",
              status,
            }),
          });

      if (!response.ok) {
        throw new Error("Vote request failed");
      }

      const result = await response.json();

      if (!result || (session && result.success === false)) {
        throw new Error("Vote was not accepted");
      }

      setFeedback("Vote counted");
    } catch {
      setVotes(previousVotes);
      setFeedback("Vote could not be saved. Try again.");
    }
  }

  return (
    <div
      className={variant === "secondary" ? "vote-actions vote-actions--secondary" : "vote-actions"}
      aria-label={`COP or DROP ${release.name}`}
      data-feedback={feedback}
    >
      <div className="vote-actions__buttons">
        <button className="vote-actions__cop" onClick={() => submitVote("1")} type="button">
          <span aria-hidden="true">▲</span>
          {shouldShowPercentages ? `COP · ${percentages.yes}` : "COP"}
          {totalVotes > 0 ? <strong className="vote-actions__cop-strong">{votes.yes}</strong> : null}
        </button>
        <button className="vote-actions__drop" onClick={() => submitVote("0")} type="button">
          <span aria-hidden="true">▼</span>
          {shouldShowPercentages ? `DROP · ${percentages.no}` : "DROP"}
          {totalVotes > 0 ? <strong className="vote-actions__drop-strong">{votes.no}</strong> : null}
        </button>
      </div>
      {shouldShowStatus ? (
        <p aria-live="polite">
          {totalVotes < 10 ? <span>Be the first to vote</span> : null}
          {feedback ? <span>{feedback}</span> : null}
        </p>
      ) : null}
    </div>
  );
}

function formatPercent(count: number, total: number) {
  if (!total) {
    return "0%";
  }

  const pct = (count / total) * 100;

  if (pct > 0 && pct < 1) {
    return "<1%";
  }

  return `${Math.round(pct)}%`;
}

function getPercentages(yesVotes: number, noVotes: number) {
  const total = yesVotes + noVotes;

  return {
    yes: formatPercent(yesVotes, total),
    no: formatPercent(noVotes, total),
  };
}
