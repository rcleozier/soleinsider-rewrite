import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProduct, getEditableProduct, updateProduct } from "@/lib/adminProducts";
import { getProductImageUrl } from "@/lib/productImages";
import { productTypes } from "@/lib/productTypes";

export const dynamic = "force-dynamic";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  const id = Number((await params).id);
  const { saved } = await searchParams;

  if (!Number.isFinite(id)) {
    notFound();
  }

  const data = await getEditableProduct(id);

  if (!data) {
    notFound();
  }

  const { product, release } = data;

  return (
    <main className="admin-shell">
      <Link className="admin-back-link" href="/admin">
        Back to Dashboard
      </Link>

      <header className="admin-header">
        <div>
          <p className="kicker">SoleInsider Admin</p>
          <h1>Edit Product</h1>
          <p>Update the product details and release date.</p>
        </div>
        <Link className="admin-header__button" href={`/${product.slug}/${product.id}`}>
          View on Site
        </Link>
      </header>

      {saved ? (
        <p className="admin-form__banner admin-form__banner--success">Saved.</p>
      ) : null}

      <section className="admin-edit-layout">
        <div className="admin-edit-media">
          <Image src={getProductImageUrl(product.image)} alt="" width={320} height={320} />
        </div>

        <form action={updateProduct} className="admin-form">
          <input type="hidden" name="id" value={product.id} />

          <div className="admin-form__grid">
            <label className="admin-form__field admin-form__field--wide">
              <span>Name</span>
              <input name="name" type="text" defaultValue={product.name} required />
            </label>

            <label className="admin-form__field">
              <span>SKU</span>
              <input name="sku" type="text" defaultValue={product.sku} maxLength={11} required />
            </label>
            <label className="admin-form__field">
              <span>Price</span>
              <input name="price" type="number" step="0.01" min="0" defaultValue={String(product.price)} required />
            </label>

            <label className="admin-form__field">
              <span>Type</span>
              <select name="type" defaultValue={product.type}>
                {productTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-form__field">
              <span>Release date</span>
              <input name="releaseDate" type="date" defaultValue={toDateInputValue(release?.releaseDate)} required />
            </label>

            <label className="admin-form__field admin-form__field--wide">
              <span>Source link</span>
              <input name="link" type="url" defaultValue={product.link} />
            </label>

            <label className="admin-form__field admin-form__field--wide">
              <span>Description</span>
              <textarea name="description" rows={3} defaultValue={product.description} />
            </label>

            <label className="admin-form__field admin-form__field--wide">
              <span>Content</span>
              <textarea name="content" rows={6} defaultValue={product.content ?? ""} />
            </label>
          </div>

          <button type="submit">Save Changes</button>
        </form>
      </section>

      <section className="admin-edit-danger">
        <div>
          <strong>Delete this product</strong>
          <span>Removes the product, its release, images, comments, votes, and favorites. This cannot be undone.</span>
        </div>
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="redirectTo" value="/admin" />
          <button className="admin-button--delete" type="submit">
            Delete Product
          </button>
        </form>
      </section>
    </main>
  );
}
