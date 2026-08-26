// Client-safe fabric-type shape (no server-only imports) so the studio editor
// and product form can share it. DB reads live in ./fabrics-server.

export type FabricType = {
  id: number;
  slug: string;
  name: string;
  care_detail: string;
  sort_order: number;
};
