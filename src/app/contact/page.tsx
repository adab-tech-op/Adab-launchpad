import type { Metadata } from "next";
import { getContactContent } from "@/lib/page-content-server";
import { ContactClient } from "./contact-client";

export const metadata: Metadata = {
  title: "Contact Adab — ADAB",
  description: "Get in touch with the ADAB studio. Questions, sizing, orders, and press.",
};

export const revalidate = 60;

export default async function ContactPage() {
  const content = await getContactContent();
  return <ContactClient content={content} />;
}
