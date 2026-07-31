import type { Metadata } from "next";
import { ContactClient } from "./contact-client";

export const metadata: Metadata = {
  title: "Contact Adab — ADAB",
  description: "Get in touch with the ADAB studio. Questions, sizing, orders, and press.",
};

export default function ContactPage() {
  return <ContactClient />;
}
