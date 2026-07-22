import Link from "next/link";
import { AddReleaseForm } from "@/components/admin/AddReleaseForm";

export const dynamic = "force-dynamic";

export default function AddReleasePage() {
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="kicker">SoleInsider Admin</p>
          <h1>Add a Release</h1>
          <p>
            Create a product and its release date directly, without going
            through crawler approval. Images upload straight to S3.
          </p>
        </div>
        <Link className="admin-header__button" href="/admin/tempReleases">
          Pending Approvals
        </Link>
      </header>

      <AddReleaseForm />
    </main>
  );
}
