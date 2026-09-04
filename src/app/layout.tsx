import type { Metadata, Viewport } from "next";
import "./globals.css";
import faviconAsset from "@/assets/adab-favicon.png.asset.json";
import { Providers } from "./providers";

const OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c50ba1d9-e873-40f6-a52a-236f758689cf/id-preview-174b26e9--0c11bc6e-f46a-4f4a-ab91-3c2d19d5bd54.lovable.app-1783908184456.png";

const TITLE = "ADAB — Old Soul. New Cut.";
const DESCRIPTION =
  "ADAB is a premium heritage-fusion menswear brand from Bangladesh. A modern reinterpretation of the Piran — same DNA, new language.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://adab.co"),
  title: TITLE,
  description: DESCRIPTION,
  authors: [{ name: "ADAB" }],
  icons: { icon: faviconAsset.url },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Hind+Siliguri:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
