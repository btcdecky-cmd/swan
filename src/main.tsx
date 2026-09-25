import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { SolanaWalletProvider } from "./lib/solana/wallet-provider";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SolanaWalletProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SolanaWalletProvider>
  </StrictMode>,
);
