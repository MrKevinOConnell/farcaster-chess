import "@/styles/globals.css";

import type { AppProps } from "next/app";
import "@farcaster/auth-kit/styles.css";
import { AuthKitProvider } from "@farcaster/auth-kit";
import { SignInButton } from "@farcaster/auth-kit";
import { Profile } from "@/components/Profile";
import ChallengeModal from "@/components/ChallengeModal";
import LichessModal from "@/components/LichessModal";

const config = {
  rpcUrl: "https://mainnet.optimism.io",
  domain: "example.com",
  siweUri: "https://example.com/login",
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthKitProvider config={config}>
      <div
        className="fixed h-screen w-screen t-0 l-0 z-50"
        style={{
          background: "#8a63d2",
          mixBlendMode: "overlay",
          opacity: 1,
          pointerEvents: "none",
        }}
      />
      <div className="flex justify-end p-2 m-4">
        <Profile />
      </div>
      <ChallengeModal />
      <LichessModal />

      <Component {...pageProps} />
    </AuthKitProvider>
  );
}
