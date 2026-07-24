import Link from "next/link";
import { signOutAction } from "@/lib/authActions";

const navLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/tempReleases", label: "Pending Releases" },
  { href: "/admin/addRelease", label: "Add Release" },
];

export function AdminNav() {
  return (
    <header className="admin-nav">
      <div className="admin-nav__inner">
        <Link className="admin-nav__brand" href="/admin">
          SoleInsider <span>Admin</span>
        </Link>
        <nav className="admin-nav__links" aria-label="Admin navigation">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="admin-nav__actions">
          <Link className="admin-nav__view-site" href="/">
            View Site
          </Link>
          <form action={signOutAction}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
