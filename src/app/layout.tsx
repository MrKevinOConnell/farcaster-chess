import "@/styles/globals.css";

import type { AppProps } from "next/app";
import "@farcaster/auth-kit/styles.css";

import { Profile } from "@/components/Profile";

const config = {
  rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC as string,
  domain: "farcaster-chess.vercel.app",
  siweUri: "https://www.farcaster-chess.vercel.app",
};

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <div
        className="fixed h-screen w-screen t-0 l-0 z-50"
        style={{
          background: "#8a63d2",
          mixBlendMode: "overlay",
          opacity: 1,
          pointerEvents: "none",
        }}
      />

      {/* <ChallengeModal />
        <LichessModal /> */}
      <body>{children}</body>
    </html>
  );
}
