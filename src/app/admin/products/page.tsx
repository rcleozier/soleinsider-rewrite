import Image from "next/image";
import Link from "next/link";
import { deleteProduct, getAdminProductList } from "@/lib/adminProducts";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

function formatDate(date: Date | null) {
  if (!date) return "TBA";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function buildHref(q: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/admin/products${query ? `?${query}` : ""}`;
}

export default async function AdminProductsPage({ searchParams }: ProductsPageProps) {
  const { q = "", page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;

  const { products, total, pageCount, page: currentPage } = await getAdminProductList({
    search: q,
    page,
  });

  const redirectTo = buildHref(q, currentPage);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="kicker">SoleInsider Admin</p>
          <h1>Products</h1>
          <p>{total.toLocaleString()} products. Search, edit, or delete any of them.</p>
        </div>
        <Link className="admin-header__button" href="/admin/addRelease">
          + Add Release
        </Link>
      </header>

      <form className="admin-product-search" action="/admin/products" method="get">
        <input type="search" name="q" defaultValue={q} placeholder="Search by name or SKU…" />
        <button type="submit">Search</button>
        {q ? (
          <Link className="admin-product-search__clear" href="/admin/products">
            Clear
          </Link>
        ) : null}
      </form>

      {products.length ? (
        <div className="admin-product-table">
          <div className="admin-product-table__head">
            <span>Product</span>
            <span>SKU</span>
            <span>Price</span>
            <span>Type</span>
            <span>Release</span>
            <span>Actions</span>
          </div>
          {products.map((product) => (
            <div className="admin-product-table__row" key={product.id}>
              <div className="admin-product-table__product">
                <span className="admin-product-table__media">
                  {product.image ? (
                    <Image src={product.image} alt="" width={48} height={48} />
                  ) : null}
                </span>
                <Link href={product.url}>{product.name}</Link>
              </div>
              <span data-label="SKU">{product.sku || "TBA"}</span>
              <span data-label="Price">${product.price}</span>
              <span data-label="Type">{product.type}</span>
              <span data-label="Release">{formatDate(product.releaseDate)}</span>
              <div className="admin-product-table__actions">
                <Link className="admin-product-card__edit" href={`/admin/products/${product.id}/edit`}>
                  Edit
                </Link>
                <form action={deleteProduct}>
                  <input type="hidden" name="id" value={product.id} />
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <button className="admin-product-card__delete" type="submit">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="admin-panel__empty">No products found{q ? ` for “${q}”` : ""}.</p>
      )}

      {pageCount > 1 ? (
        <nav className="admin-pagination" aria-label="Pagination">
          {currentPage > 1 ? (
            <Link href={buildHref(q, currentPage - 1)}>← Previous</Link>
          ) : (
            <span className="is-disabled">← Previous</span>
          )}
          <span className="admin-pagination__status">
            Page {currentPage} of {pageCount}
          </span>
          {currentPage < pageCount ? (
            <Link href={buildHref(q, currentPage + 1)}>Next →</Link>
          ) : (
            <span className="is-disabled">Next →</span>
          )}
        </nav>
      ) : null}
    </main>
  );
}
