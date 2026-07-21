"use client";

import { useState } from "react";

export function SearchForm({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);

  return (
    <form action="/search" className="search-form" role="search">
      <label className="ed-sr-only" htmlFor="search-page-input">
        Search releases
      </label>
      <input
        autoComplete="off"
        id="search-page-input"
        name="q"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search releases, brands, SKUs..."
        type="search"
        value={query}
      />
      <button type="submit">Search</button>
    </form>
  );
}
