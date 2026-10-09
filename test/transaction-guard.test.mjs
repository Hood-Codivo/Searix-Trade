import assert from 'node:assert/strict';
import { afterEach, it, mock } from 'node:test';
import { Connection, Keypair, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { validateTradeTransaction } from '../src/services/wallet/transaction-guard.ts';
globalThis.__DEV__ = false;
const wallet = Keypair.generate().publicKey;
const input = Keypair.generate().publicKey;
const output = Keypair.generate().publicKey;
const inAccount = Keypair.generate().publicKey;
const outAccount = Keypair.generate().publicKey;
const tokenProgram = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const phoenix = new PublicKey('PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY');
const expected = { walletAddress: wallet.toBase58(), inputMint: input.toBase58(), outputMint: output.toBase58(), inputDecimals: 6, outputDecimals: 6, maxInput: 10, minOutput: 4.8 };
function account(mint, amount) {
    const data = Buffer.alloc(165);
    data.set(mint.toBytes(), 0);
    data.set(wallet.toBytes(), 32);
    data.writeBigUInt64LE(BigInt(amount), 64);
    data[108] = 1;
    return { data, executable: false, lamports: 2039280, owner: tokenProgram, rentEpoch: 0 };
}
function transaction(program = phoenix, signer = wallet) {
    const instruction = new TransactionInstruction({ programId: program, keys: [{ pubkey: signer, isSigner: true, isWritable: true }, { pubkey: inAccount, isSigner: false, isWritable: true }, { pubkey: outAccount, isSigner: false, isWritable: true }], data: Buffer.from([0]) });
    return new VersionedTransaction(new TransactionMessage({ payerKey: signer, recentBlockhash: PublicKey.default.toBase58(), instructions: [instruction] }).compileToLegacyMessage());
}
function rpc(options = {}) {
    mock.method(Connection.prototype, 'getFeeForMessage', async () => ({value: 5000}));
    mock.method(Connection.prototype, 'getMultipleAccountsInfo', async () => [
        { data: Buffer.alloc(0), executable: false, lamports: 1e9, owner: PublicKey.default }, account(input, 20e6), account(output, 0),
    ]);
    mock.method(Connection.prototype, 'simulateTransaction', async () => {
        const spent = account(input, 20e6 - (options.spend ?? 10e6));
        if (options.delegated) {
            spent.data.writeUInt32LE(1, 72);
            spent.data.set(Keypair.generate().publicKey.toBytes(), 76);
        }
        return { value: { err: options.fail ? 'failure' : null, accounts: [
                    { data: ['', 'base64'], executable: false, lamports: 1e9 - 5000, owner: PublicKey.default.toBase58() },
                    ...[spent, account(output, options.receive ?? 5e6)].map(a => ({ ...a, owner: a.owner.toBase58(), data: [a.data.toString('base64'), 'base64'] })),
                ] } };
    });
}
afterEach(() => mock.restoreAll());
it('allows an unsigned, simulated swap within the reviewed limits', async () => { rpc(); await validateTradeTransaction(transaction(), expected); });
it('blocks an unexpected signer before requesting RPC data', async () => { await assert.rejects(validateTradeTransaction(transaction(phoenix, Keypair.generate().publicKey), expected), /unexpected signer/); });
it('blocks programs outside the transaction allowlist', async () => { await assert.rejects(validateTradeTransaction(transaction(Keypair.generate().publicKey), expected), /unrecognized/); });
it('blocks a transaction spending more tokens than authorized', async () => { rpc({ spend: 11e6 }); await assert.rejects(validateTradeTransaction(transaction(), expected), /spending exceeds/); });
it('blocks insufficient output and failed simulations', async () => { rpc({ receive: 1e6 }); await assert.rejects(validateTradeTransaction(transaction(), expected), /below the reviewed/); mock.restoreAll(); rpc({ fail: true }); await assert.rejects(validateTradeTransaction(transaction(), expected), /simulation failed/); });
it('blocks hidden token delegation even when balance deltas look correct', async () => { rpc({ delegated: true }); await assert.rejects(validateTradeTransaction(transaction(), expected), /authority or delegation/); });
it('blocks already-signed payloads', async () => { const tx = transaction(); tx.signatures[0][0] = 1; await assert.rejects(validateTradeTransaction(tx, expected), /already signed/); });

it('checks native SOL receipts using the actual network fee, not a broad overhead allowance', async () => {
    rpc();
    const wrapped = 'So11111111111111111111111111111111111111112';
    // Same simulated trade has no native SOL gain; it must not pass a tiny SOL minimum.
    await assert.rejects(validateTradeTransaction(transaction(), { ...expected, outputMint: wrapped, outputDecimals: 9, minOutput: 0.001 }), /below the reviewed/);
});
