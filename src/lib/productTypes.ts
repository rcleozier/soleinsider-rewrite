// The distinct `products.type` values actually present in the database,
// checked directly rather than assumed.
export const productTypes = [
  { value: "sneakers", label: "Sneakers" },
  { value: "clothing", label: "Clothing" },
  { value: "streetwear", label: "Streetwear" },
  { value: "music", label: "Music" },
  { value: "games", label: "Games" },
] as const;

export type ProductType = (typeof productTypes)[number]["value"];
