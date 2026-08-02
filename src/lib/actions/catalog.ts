"use server";

import { getAllProducts, type Product } from "@/lib/products";

export async function listProducts(): Promise<Product[]> {
  return getAllProducts();
}
