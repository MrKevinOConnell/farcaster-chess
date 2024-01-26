import "@/styles/globals.css";

import type { AppProps } from "next/app";
import "@farcaster/auth-kit/styles.css";
import { AuthKitProvider } from "@farcaster/auth-kit";
import { SignInButton } from "@farcaster/auth-kit";
import { Profile } from "@/components/Profile";

const config = {
  rpcUrl: "https://mainnet.optimism.io",
  domain: "example.com",
  siweUri: "https://example.com/login",
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthKitProvider config={config}>
      <div className="flex justify-end p-2 m-4">
        <Profile />
      </div>

      <Component {...pageProps} />
    </AuthKitProvider>
  );
}
