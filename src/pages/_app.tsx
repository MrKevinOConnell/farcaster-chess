import '@/styles/globals.css'
import { ConnectKitProvider } from 'connectkit'
import type { AppProps } from 'next/app'
import { configureChains, mainnet, createClient, WagmiConfig } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
 
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

const { chains, provider, webSocketProvider } = configureChains(
  [mainnet],
  [alchemyProvider({ apiKey: "0FcFPfkxRpb3ouuMeAJZxVuJyVnVrW12"}), publicProvider()],
)
 
// Set up client
const client = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'wagmi',
        headlessMode: true
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: true,
      },
    }),
  ],
  provider,
  webSocketProvider,
})
export default function App({ Component, pageProps }: AppProps) {
  return     <WagmiConfig client={client}>
  <ConnectKitProvider><Component {...pageProps} />
  </ConnectKitProvider>
  </WagmiConfig>
}
