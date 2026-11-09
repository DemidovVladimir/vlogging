> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# How to Swap Tokens

> Swap tokens on Solana using Kamino Swap, a meta-aggregator that compares routes across multiple engines to find the best output.

Kamino Swap is a meta-aggregator: it requests quotes from multiple routing engines simultaneously, compares them, and selects the route that returns the most tokens. There is no platform fee.

## Before You Start

* You need a **connected Solana wallet** with the tokens you want to swap.
* Keep a small amount of **SOL** in your wallet to cover network transaction fees.
* Look for the **green verified badge** next to token names. Token names and symbols can be copied, so always verify you are selecting the correct asset.

## Swap Step by Step

**1. Connect your wallet**

Open Kamino Swap and connect your wallet using the button in the top-right corner. Once connected, your available token balances appear in the swap interface.

**2. Select the token to sell**

Click the token field in the **Sell** section to open the token selector. Search by name, symbol, or contract address. Confirm the green verified badge before selecting.

![Select token to sell](https://mintcdn.com/kamino-3d73a151/nSj-oZqZbrFVVVcD/images/learn/swap/select-token-to-sell.webp?fit=max\&auto=format\&n=nSj-oZqZbrFVVVcD\&q=85\&s=4ea972ed0cd6506c635f598975fb6357)

**3. Select the token to buy**

Click the token field in the **Buy** section and choose the token you want to receive. Use the arrow button between the two fields to reverse the swap direction.

![Select token to buy](https://mintcdn.com/kamino-3d73a151/nSj-oZqZbrFVVVcD/images/learn/swap/select-token-to-buy.webp?fit=max\&auto=format\&n=nSj-oZqZbrFVVVcD\&q=85\&s=347ce04baa95f8af8f327aa0b49d16bb)

**4. Enter the swap amount**

Type the amount you want to swap. Use the **Max** or **Half** shortcuts to fill in your full or half balance. The system fetches a price quote automatically once you enter an amount.

![Enter swap amount](https://mintcdn.com/kamino-3d73a151/nSj-oZqZbrFVVVcD/images/learn/swap/enter-amount.webp?fit=max\&auto=format\&n=nSj-oZqZbrFVVVcD\&q=85\&s=4b0309e8c7e88cdd6e14097c657e8508)

**5. Review settings**

Click the **settings cog** below the swap amount to adjust slippage tolerance and priority fee.

**Slippage tolerance** is the maximum price movement you accept between receiving the quote and the transaction executing. The default is **0.5%**, which is suitable for most swaps. Lower slippage gives tighter price protection but increases the chance of the transaction failing. Higher slippage makes execution more likely but may return fewer tokens.

**Priority fee** controls how quickly Solana processes your transaction. The default **Normal** setting is sufficient for most conditions. Increase it during periods of network congestion.

![Review settings](https://mintcdn.com/kamino-3d73a151/nSj-oZqZbrFVVVcD/images/learn/swap/review-settings.webp?fit=max\&auto=format\&n=nSj-oZqZbrFVVVcD\&q=85\&s=2bc3663cff16b8813d60f295b137b675)

**6. Review the quote**

Before confirming, check:

* **Estimated output** and **minimum received**
* **Exchange rate** for the token pair
* **Price impact**: the effect your trade has on the available price

If the price impact looks unusually high, consider reducing the swap size. High impact usually means limited liquidity or that the trade is large relative to the available market.

Quotes refresh automatically as market conditions change. Kamino also runs **active simulation**, which checks whether the quoted transaction will execute under current on-chain conditions, so the displayed output closely reflects what the transaction is actually expected to return.

![Review swap quote](https://mintcdn.com/kamino-3d73a151/nSj-oZqZbrFVVVcD/images/learn/swap/review-quote.webp?fit=max\&auto=format\&n=nSj-oZqZbrFVVVcD\&q=85\&s=3faf19f7c26332e3019f9948db08a8e0)

**7. Confirm in your wallet**

Click **Swap** to send the transaction to your wallet. Your wallet will display the tokens leaving, the tokens arriving, and any network fees. Verify the details match your intended swap, then approve.

If the assets or amounts shown in your wallet do not match the swap you intended, cancel the transaction.

Once confirmed, the transaction is submitted to the Solana network and the swapped tokens appear in your wallet.

![Confirm in wallet](https://mintcdn.com/kamino-3d73a151/nSj-oZqZbrFVVVcD/images/learn/swap/confirm-wallet.webp?fit=max\&auto=format\&n=nSj-oZqZbrFVVVcD\&q=85\&s=65aed71cbd6dab18f9fa92a797fa449b)

## If a Swap Fails

Swaps can fail if market conditions change between quoting and execution. If this happens:

* Refresh the quote and try again.
* Check that you have enough SOL to cover transaction fees.
* Increase slippage tolerance slightly for volatile tokens.
* Reduce the swap size if price impact is high.
* Wait briefly if conditions are changing rapidly.

Your original tokens remain in your wallet when a swap fails. A small network fee may still apply.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.