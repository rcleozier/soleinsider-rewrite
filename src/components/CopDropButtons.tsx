"use client";

import { useMemo, useState } from "react";
import type { LegacyRelease } from "@/lib/legacyMobileApi";

export function CopDropButtons({ release }: { release: LegacyRelease }) {
  const [votes, setVotes] = useState(() => ({
    yes: Number(release.yes_votes) || 0,
    no: Number(release.no_votes) || 0,
  }));
  const [feedback, setFeedback] = useState("");
  const percentages = useMemo(() => getPercentages(votes.yes, votes.no), [votes]);

  async function submitVote(status: "1" | "0") {
    const previousVotes = votes;
    const nextVotes =
      status === "1"
        ? { ...previousVotes, yes: previousVotes.yes + 1 }
        : { ...previousVotes, no: previousVotes.no + 1 };

    setVotes(nextVotes);
    setFeedback("Saving vote...");

    try {
      const response = await fetch("/mobileapi/coporNot", {
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

      if (!result) {
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
      className="vote-actions"
      aria-label={`COP or DROP ${release.name}`}
      data-feedback={feedback}
    >
      <div className="vote-actions__buttons">
        <button onClick={() => submitVote("1")} type="button">
          <span aria-hidden="true">▲</span>
          COP
          <strong>{votes.yes}</strong>
        </button>
        <button onClick={() => submitVote("0")} type="button">
          <span aria-hidden="true">▼</span>
          DROP
          <strong>{votes.no}</strong>
        </button>
      </div>
      <p aria-live="polite">
        {percentages.yes}% / {percentages.no}% COP-DROP
        {feedback ? ` · ${feedback}` : ""}
      </p>
    </div>
  );
}

function getPercentages(yesVotes: number, noVotes: number) {
  const total = yesVotes + noVotes;
  const yes = total ? Math.round((yesVotes / total) * 100) : 0;

  return {
    yes,
    no: total ? 100 - yes : 0,
  };
}
