# Searix Trade

A mobile-first trading companion for Solana's on-chain order-book markets — built around one idea: you should be able to see what you're about to trade into before you commit to it.

## The problem

On-chain order books are transparent in theory — every quote, every fill, every level of depth is public. In practice, almost none of that transparency reaches the person about to tap "buy" on their phone. Most mobile trading apps show a price and ask you to trust it. Searix Trade shows the market underneath the price: how tight the spread really is, how much depth actually backs it, and whether recent activity looks clean or worth a second look — before you commit any funds.

## What it does

**Market discovery.** Browse active markets with an at-a-glance read on execution quality — not just price and 24h change, but spread, depth, and a plain-language quality signal that flags when a book looks thin or one-sided.

**Market depth, visualized.** Price history and cumulative depth are rendered as real charts, not a single flat number, so you can see the shape of the book rather than take it on faith.

**Fairness language you can act on.** Every market carries a short, honest explanation of what its quality signal means — described as a signal worth weighing, never as financial advice or proof of anything.

**Your own wallet, your own keys.** Connect the Solana wallet you already use. Searix Trade never asks for, sees, or stores a private key — signing happens entirely inside your wallet app.

**Transparent economics.** Any fee the platform takes is stated plainly, not buried — including while that fee isn't yet being collected.

## Design philosophy

Searix Trade is opinionated about honesty over polish-that-hides-things: empty states say when there's nothing to show, error states say when something couldn't load, and preview states are labeled as previews. Nothing pretends to be more finished than it is.

## Status

Searix Trade is under active development. Market discovery and wallet connection are live today; placing and managing trades directly from the app is the next major milestone.

## Contributing

This is a private, active project. If you have access to the codebase and want to get it running locally, ask a maintainer for setup details.
