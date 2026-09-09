// Client-safe teaser type (admin coming-soon cards on the shop grid).
export type Teaser = {
  id: number;
  label: string;
  subtext: string;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
};
