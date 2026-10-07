import { Buffer } from "buffer";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import type {
  AuthorizationResult,
  AuthToken,
  Cluster,
} from "@solana-mobile/mobile-wallet-adapter-protocol";

const APP_IDENTITY = {
  name: "Searix Trade",
  uri: "https://searixtrade.com",
  // Resolved against `uri` into an absolute URL the wallet app fetches over HTTP to show on its
  // connect/sign screens -- it must be a real path on the live site, not a local asset.
  // "favicon.ico" 404s; this is the brand mark the landing page actually serves.
  icon: "assets/brand/flow-mark.svg",
};

export type ExecutionNetwork = "mainnet-beta";

// Execution is mainnet-only; real swaps move real funds.
export function getSolanaNetwork(): ExecutionNetwork {
  return "mainnet-beta";
}

// ExecutionNetwork's value ('mainnet-beta') is a valid Cluster value --
// no 'solana:' prefix needed for this overload of wallet.authorize's chain param.
function chainFor(network: ExecutionNetwork): Cluster {
  return network;
}

export type WalletAccount = {
  address: string;
  label?: string;
};

export class WalletNotFoundError extends Error {}
export class WalletConnectionCancelledError extends Error {}

function toWalletAccount(result: AuthorizationResult): WalletAccount {
  const account = result.accounts[0];
  return {
    address: new PublicKey(Buffer.from(account.address, "base64")).toBase58(),
    label: account.label,
  };
}

function rethrowKnownFailures(error: unknown): never {
  const code = (error as { code?: string } | null)?.code;
  const message = error instanceof Error ? error.message : String(error);
  if (code === "ERROR_WALLET_NOT_FOUND") {
    throw new WalletNotFoundError(
      "No wallet app that supports Mobile Wallet Adapter was found on this device.",
    );
  }
  // Android surfaces a dismissed wallet sheet as a java.util.concurrent.CancellationException.
  if (
    /cancelled by user|association cancelled|cancellation(exception)?/i.test(
      message,
    )
  ) {
    throw new WalletConnectionCancelledError(
      "Wallet connection was cancelled.",
    );
  }
  throw error instanceof Error ? error : new Error(message);
}

export async function connectWallet(): Promise<{
  authToken: AuthToken;
  account: WalletAccount;
}> {
  try {
    const result = await transact(async (wallet: Web3MobileWallet) =>
      wallet.authorize({
        identity: APP_IDENTITY,
        chain: chainFor(getSolanaNetwork()),
      }),
    );
    return { authToken: result.auth_token, account: toWalletAccount(result) };
  } catch (error) {
    rethrowKnownFailures(error);
  }
}

export async function reauthorizeWallet(
  authToken: AuthToken,
): Promise<{ authToken: AuthToken; account: WalletAccount }> {
  try {
    const result = await transact(async (wallet: Web3MobileWallet) =>
      wallet.authorize({
        identity: APP_IDENTITY,
        chain: chainFor(getSolanaNetwork()),
        auth_token: authToken,
      }),
    );
    return { authToken: result.auth_token, account: toWalletAccount(result) };
  } catch (error) {
    rethrowKnownFailures(error);
  }
}

export async function disconnectWallet(authToken: AuthToken): Promise<void> {
  try {
    await transact(async (wallet: Web3MobileWallet) => {
      await wallet.deauthorize({ auth_token: authToken });
    });
  } catch (error) {
    rethrowKnownFailures(error);
  }
}

// Signs and submits an already-built transaction via the user's own wallet app -- the private key
// never leaves the wallet, and this backend never sees it. Re-authorizes with the stored auth
// token first so the user isn't asked to approve a brand-new connection just to sign.
export async function signAndSendTransaction(
  transactionBase64: string,
  authToken: AuthToken,
): Promise<string> {
  try {
    const transaction = VersionedTransaction.deserialize(
      Buffer.from(transactionBase64, "base64"),
    );
    const signatures = await transact(async (wallet: Web3MobileWallet) => {
      await wallet.authorize({
        identity: APP_IDENTITY,
        chain: chainFor(getSolanaNetwork()),
        auth_token: authToken,
      });
      return wallet.signAndSendTransactions({ transactions: [transaction] });
    });
    const signature = signatures[0];
    if (!signature)
      throw new Error("The wallet did not return a transaction signature.");
    return signature;
  } catch (error) {
    rethrowKnownFailures(error);
  }
}
