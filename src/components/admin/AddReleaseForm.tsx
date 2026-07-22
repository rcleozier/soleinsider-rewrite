"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createRelease } from "@/lib/adminReleases";
import { productTypes } from "@/lib/productTypes";

export function AddReleaseForm() {
  const [state, formAction] = useActionState(createRelease, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form action={formAction} className="admin-form" ref={formRef}>
      {state && !state.success ? (
        <p className="admin-form__banner admin-form__banner--error" role="alert">
          {state.error}
        </p>
      ) : null}

      {state?.success ? (
        <p className="admin-form__banner admin-form__banner--success" role="status">
          Release created.{" "}
          <Link href={`/${state.slug}/${state.productId}`}>View the product page →</Link>
        </p>
      ) : null}

      <div className="admin-form__grid">
        <label className="admin-form__field">
          <span>Name *</span>
          <input name="name" placeholder='Air Jordan 4 "Comic"' required type="text" />
        </label>

        <label className="admin-form__field">
          <span>SKU *</span>
          <input maxLength={11} name="sku" placeholder="IO2362-100" required type="text" />
        </label>

        <label className="admin-form__field">
          <span>Price (USD) *</span>
          <input
            max={999.99}
            min={0}
            name="price"
            placeholder="215"
            required
            step="0.01"
            type="number"
          />
        </label>

        <label className="admin-form__field">
          <span>Type *</span>
          <select defaultValue="sneakers" name="type" required>
            {productTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field">
          <span>Release date *</span>
          <input name="releaseDate" required type="date" />
        </label>

        <label className="admin-form__field">
          <span>Colorway</span>
          <input name="colorway" placeholder="Comic" type="text" />
        </label>

        <label className="admin-form__field">
          <span>Source link</span>
          <input name="link" placeholder="https://…" type="url" />
        </label>

        <label className="admin-form__field admin-form__field--wide">
          <span>Description</span>
          <textarea name="description" rows={3} />
        </label>

        <label className="admin-form__field admin-form__field--wide">
          <span>Content</span>
          <textarea name="content" rows={5} />
        </label>

        <label className="admin-form__field admin-form__field--wide">
          <span>Primary image *</span>
          <input accept="image/*" name="primaryImage" required type="file" />
        </label>

        <label className="admin-form__field admin-form__field--wide">
          <span>Gallery images</span>
          <input accept="image/*" multiple name="galleryImages" type="file" />
        </label>
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} type="submit">
      {pending ? "Uploading…" : "Create release"}
    </button>
  );
}
