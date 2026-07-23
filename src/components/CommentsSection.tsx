"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ProductDetailComment } from "@/lib/dbReleases";

type Comment = {
  id: string | number;
  comment: string | null;
  author?: string;
  comment_date?: string | null;
};

export function CommentsSection({
  productId,
  initialComments,
}: {
  productId: string;
  initialComments: ProductDetailComment[];
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (draft.trim().length < 2) {
      setError("Comment is too short.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch(`/api/v1/releases/${productId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: draft }),
      });
      const json = await response.json();

      if (!json?.success) {
        setError(json?.error?.message || "Unable to post comment.");
        return;
      }

      setComments((current) => [json.data.comment, ...current]);
      setDraft("");
    } catch {
      setError("Unable to post comment. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {session ? (
        <form className="comment-form" onSubmit={submit}>
          <label className="ed-sr-only" htmlFor="new-comment">
            Add a comment
          </label>
          <textarea
            id="new-comment"
            maxLength={500}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Share your take on this release..."
            required
            value={draft}
          />
          {error ? <p className="comment-form__error">{error}</p> : null}
          <button disabled={busy} type="submit">
            {busy ? "Posting..." : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="comment-form__login-prompt">
          <Link href="/login">Log in</Link> to join the conversation.
        </p>
      )}

      <div className="comment-list">
        {comments.length ? (
          comments.map((comment) => (
            <article key={comment.id}>
              <span className="comment-avatar" aria-hidden="true">
                {(comment.author || "SI").slice(0, 2).toUpperCase()}
              </span>
              <div>
                <header>
                  <strong>{comment.author || "SoleInsider visitor"}</strong>
                  <time>{comment.comment_date || "Just now"}</time>
                </header>
                <p>{comment.comment}</p>
              </div>
            </article>
          ))
        ) : (
          <article className="comment-empty">
            <h3>No comments yet — be the first to weigh in</h3>
          </article>
        )}
      </div>
    </>
  );
}
