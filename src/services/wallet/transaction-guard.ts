import { Buffer } from 'buffer';
import { Connection, PublicKey, SystemInstruction, SystemProgram, TransactionMessage, type AccountInfo, type VersionedTransaction } from '@solana/web3.js';

export type TradeIntent = {
  walletAddress: string; inputMint: string; outputMint: string;
  inputDecimals: number; outputDecimals: number; maxInput: number; minOutput: number;
};
const TOKEN = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
const ASSOCIATED = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const WRAPPED_SOL = 'So11111111111111111111111111111111111111112';
const PHOENIX = 'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY';
const JUPITER = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
const COMPUTE = 'ComputeBudget111111111111111111111111111111';
const rpcUrl = process.env.EXPO_PUBLIC_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';
const fail = (message: string): never => { throw new Error(`Transaction safety check: ${message}`); };
const atoms = (value: number, decimals: number) => {
  const n = value * 10 ** decimals;
  if (!Number.isSafeInteger(Math.round(n)) || n <= 0) return fail('invalid trade amount. Analyze again.');
  return BigInt(Math.round(n));
};

function tokenAccount(account: AccountInfo<Buffer> | null, wallet: string) {
  if (!account || ![TOKEN, TOKEN_2022].includes(account.owner.toBase58()) || account.data.length < 165) return null;
  const data = account.data;
  if (new PublicKey(data.subarray(32, 64)).toBase58() !== wallet) return null;
  return { mint: new PublicKey(data.subarray(0, 32)).toBase58(), amount: BigInt(data.readBigUInt64LE(64).toString()), data, program: account.owner.toBase58() };
}

// Uses an independently configured RPC, not API-supplied simulation results.
// Known swap programs remain a trust boundary; this is defense in depth, not a program audit.
export async function validateTradeTransaction(tx: VersionedTransaction, expected: TradeIntent) {
  if (!__DEV__ && !rpcUrl.startsWith('https://')) fail('RPC must use HTTPS.');
  const connection = new Connection(rpcUrl, 'confirmed');
  const owner = new PublicKey(expected.walletAddress);
  if (tx.message.header.numRequiredSignatures !== 1 || !tx.message.staticAccountKeys[0].equals(owner)) fail('unexpected signer or fee payer.');
  if (tx.signatures.some(signature => signature.some(byte => byte !== 0))) fail('transaction is already signed.');
  const maxInput = atoms(expected.maxInput, expected.inputDecimals);
  const minOutput = atoms(expected.minOutput, expected.outputDecimals);
  const tables = await Promise.all(tx.message.addressTableLookups.map(async lookup => {
    const result = await connection.getAddressLookupTable(lookup.accountKey);
    if (!result.value) return fail('address lookup table is unavailable.');
    return result.value;
  }));
  const message = TransactionMessage.decompile(tx.message, { addressLookupTableAccounts: tables });
  const wrappedAccount = PublicKey.findProgramAddressSync([owner.toBuffer(), new PublicKey(TOKEN).toBuffer(), new PublicKey(WRAPPED_SOL).toBuffer()], new PublicKey(ASSOCIATED))[0];
  let swaps = 0;
  let setupTransfers = 0n;
  let platformFees = 0n;
  for (const instruction of message.instructions) {
    const program = instruction.programId.toBase58();
    if (program === PHOENIX) {
      if (instruction.data[0] !== 0) fail('unexpected Phoenix instruction.');
      swaps++; continue;
    }
    if (program === JUPITER) { swaps++; continue; }
    if (program === COMPUTE) {
      if (![2, 3, 4].includes(instruction.data[0])) fail('unexpected compute instruction.');
      continue;
    }
    if (program === ASSOCIATED) {
      if (instruction.data.length > 1 || (instruction.data.length && ![0, 1].includes(instruction.data[0]))) fail('unexpected token-account instruction.');
      continue;
    }
    if (program === SystemProgram.programId.toBase58()) {
      if (SystemInstruction.decodeInstructionType(instruction) !== 'Transfer') fail('unexpected system instruction.');
      const transfer = SystemInstruction.decodeTransfer(instruction);
      if (!transfer.fromPubkey.equals(owner) || !transfer.toPubkey.equals(wrappedAccount) || expected.inputMint !== WRAPPED_SOL) fail('unexpected SOL transfer.');
      setupTransfers += BigInt(transfer.lamports);
      if (setupTransfers > maxInput) fail('SOL transfer exceeds your trade amount.');
      continue;
    }
    if ([TOKEN, TOKEN_2022].includes(program)) {
      const opcode = instruction.data[0];
      if (opcode === 17 && instruction.keys[0]?.pubkey.equals(wrappedAccount)) continue; // SyncNative
      if (opcode === 9 && instruction.keys[0]?.pubkey.equals(wrappedAccount) && instruction.keys[1]?.pubkey.equals(owner) && instruction.keys[2]?.pubkey.equals(owner)) continue;
      if (opcode === 12 && instruction.data.length === 10 && instruction.keys[1]?.pubkey.toBase58() === expected.inputMint && instruction.keys[3]?.pubkey.equals(owner)) {
        platformFees += BigInt(instruction.data.readBigUInt64LE(1).toString());
        if (platformFees <= maxInput * 15n / 10_000n) continue;
      }
      fail('unexpected token transfer, delegation or authority change.');
    }
    fail('unrecognized transaction program.');
  }
  if (swaps !== 1) fail('expected exactly one swap.');
  const keys = tx.message.getAccountKeys({ addressLookupTableAccounts: tables });
  const writable: PublicKey[] = [];
  for (let i = 0; i < keys.length; i++) if (tx.message.isAccountWritable(i)) writable.push(keys.get(i)!);
  if (writable.length > 100) fail('transaction touches too many accounts.');
  const [before, feeResult] = await Promise.all([
    connection.getMultipleAccountsInfo(writable, 'confirmed'),
    connection.getFeeForMessage(tx.message, 'confirmed'),
  ]);
  if (feeResult.value === null || !Number.isSafeInteger(feeResult.value) || feeResult.value < 0) fail('network fee is unavailable. Refresh the trade.');
  const networkFee = BigInt(feeResult.value!);
  const simulation = await connection.simulateTransaction(tx, { sigVerify: false, replaceRecentBlockhash: true,
    accounts: { encoding: 'base64', addresses: writable.map(key => key.toBase58()) } });
  if (simulation.value.err || !simulation.value.accounts) fail('simulation failed. Refresh the quote; nothing was signed.');
  const changes = new Map<string, bigint>();
  let nativeChange = 0n;
  let rentChange = 0n;
  for (let i = 0; i < writable.length; i++) {
    const raw = simulation.value.accounts![i];
    const after: AccountInfo<Buffer> | null = raw ? { ...raw, owner: new PublicKey(raw.owner), data: Buffer.from(raw.data[0], 'base64') } : null;
    if (writable[i].equals(owner)) nativeChange = BigInt(after?.lamports ?? 0) - BigInt(before[i]?.lamports ?? 0);
    const rent = (account: AccountInfo<Buffer> | null) => {
      if (!account || ![TOKEN, TOKEN_2022].includes(account.owner.toBase58()) || account.data.length < 165) return 0n;
      const wrapped = new PublicKey(account.data.subarray(0, 32)).toBase58() === WRAPPED_SOL;
      return BigInt(account.lamports) - (wrapped ? BigInt(account.data.readBigUInt64LE(64).toString()) : 0n);
    };
    rentChange += rent(after) - rent(before[i]);
    const pre = tokenAccount(before[i], expected.walletAddress);
    const post = tokenAccount(after, expected.walletAddress);
    if (pre && after && (!post || pre.program !== post.program || pre.mint !== post.mint ||
        !Buffer.from(pre.data.subarray(72, 109)).equals(Buffer.from(post.data.subarray(72, 109))) || !Buffer.from(pre.data.subarray(121, 165)).equals(Buffer.from(post.data.subarray(121, 165))))) {
      fail('token authority or delegation would change.');
    }
    if (!pre && post && (post.data.readUInt32LE(72) !== 0 || (post.data.readUInt32LE(129) !== 0 && new PublicKey(post.data.subarray(133, 165)).toBase58() !== expected.walletAddress))) fail('new token account has unexpected authority.');
    if (pre) changes.set(pre.mint, (changes.get(pre.mint) ?? 0n) - pre.amount);
    if (post) changes.set(post.mint, (changes.get(post.mint) ?? 0n) + post.amount);
  }
  // A fixed 0.02 SOL ceiling covers network fees and token-account rent, not trading input.
  const overhead = 20_000_000n;
  if (networkFee > overhead) fail('network fee exceeds the safety limit.');
  if (nativeChange < -(overhead + (expected.inputMint === WRAPPED_SOL ? maxInput : 0n))) fail('SOL costs exceed the safety limit.');
  // Net SOL across wallet + wrapped account avoids treating unwrap refunds as token theft.
  const netWrapped = (changes.get(WRAPPED_SOL) ?? 0n) + nativeChange + rentChange + networkFee;
  for (const [mint, delta] of changes) {
    if (mint === WRAPPED_SOL) continue;
    if (delta < 0n && (mint !== expected.inputMint || -delta > maxInput)) fail('token spending exceeds your selected trade.');
  }
  if (netWrapped < -(expected.inputMint === WRAPPED_SOL ? maxInput : 0n)) fail('combined SOL spending exceeds the trade budget.');
  const received = changes.get(expected.outputMint) ?? 0n;
  if (expected.outputMint === WRAPPED_SOL ? netWrapped < minOutput : received < minOutput) fail('output is below the reviewed minimum. Analyze the trade again.');
}
