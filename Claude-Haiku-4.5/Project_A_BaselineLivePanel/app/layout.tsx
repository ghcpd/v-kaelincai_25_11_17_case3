import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Interaction Panel - Baseline",
  description: "City Public Art Live Interaction Panel (Before)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
