> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# How to Short xStocks on Kamino

> Open a short position on xStocks using Kamino's Borrow market.

A short position is created by borrowing an xStock and selling it for USDC. The position benefits if the xStock decreases in value, because it can then be repurchased at a lower price to repay the debt.

Only xStocks currently enabled for borrowing can be used for this strategy.

Short positions carry liquidation risk. If the xStock price rises, the cost to repay the debt increases. Always review your loan-to-value ratio, liquidation price, borrowing costs, and swap details before confirming a transaction.

## Opening a short position

**1. Supply USDC as collateral**

Open the **xStocks Market**, select USDC, and enter the amount you want to supply. Confirm the transaction in your wallet.

![Supplying USDC in the xStocks Market](https://mintcdn.com/kamino-3d73a151/E-tSDExrEbYYF1-q/images/learn/borrow/supply-usdc.webp?fit=max\&auto=format\&n=E-tSDExrEbYYF1-q\&q=85\&s=32f26a89dbc860ef6e973a9909bd66ed)

**2. Borrow the xStock to short**

Select the xStock you want to borrow. Enter the amount and review the position information, including:

* Borrow APY
* Loan-to-value ratio
* Liquidation LTV

Confirm the transaction.

![Borrowing an xStock](https://mintcdn.com/kamino-3d73a151/E-tSDExrEbYYF1-q/images/learn/borrow/borrow-xstock.webp?fit=max\&auto=format\&n=E-tSDExrEbYYF1-q\&q=85\&s=fe08c5b8513ce0d1e13c043478cfd9f7)

**3. Swap the borrowed xStock for USDC**

Open Kamino **Swap** and exchange the borrowed xStock for USDC. Review the swap quotation and confirm the transaction.

![xStock-to-USDC swap](https://mintcdn.com/kamino-3d73a151/E-tSDExrEbYYF1-q/images/learn/borrow/swap-xstock-to-usdc.webp?fit=max\&auto=format\&n=E-tSDExrEbYYF1-q\&q=85\&s=1058610c093d5cc676b05f79b6808d81)

You now owe the borrowed xStock while holding the USDC received from selling it.

**4. Optional: Supply the received USDC**

The USDC received from the swap can be supplied to the xStocks Market as additional collateral. This can improve the position's collateral value or be used to increase the position further. However, borrowing more also increases liquidation and borrowing-cost risk.

![Supplying the received USDC](https://mintcdn.com/kamino-3d73a151/E-tSDExrEbYYF1-q/images/learn/borrow/supply-received-usdc.webp?fit=max\&auto=format\&n=E-tSDExrEbYYF1-q\&q=85\&s=6d98536b830b1e573304e96eaf312022)

## Closing a short position

### Repay with collateral (one-click)

**1. Select Repay with Collateral**

Select **Repay with Collateral** on the debt token.

**2. Enter the repayment amount**

Enter the amount you want to repay.

**3. Review and confirm**

Review the quoted amount, price impact, and minimum received in the UI before confirming the transaction in your wallet.

![Repay with Collateral](https://mintcdn.com/kamino-3d73a151/E-tSDExrEbYYF1-q/images/learn/borrow/repay-with-collateral-short.webp?fit=max\&auto=format\&n=E-tSDExrEbYYF1-q\&q=85\&s=9ba5083daaee15978d68d09d43e55a72)

### Manual unwind

![Manual unwind of a short position](https://mintcdn.com/kamino-3d73a151/E-tSDExrEbYYF1-q/images/learn/borrow/manual-unwind-short.webp?fit=max\&auto=format\&n=E-tSDExrEbYYF1-q\&q=85\&s=793158b85a65c84aa5ee6e3eb1d5f99b)

1. Withdraw USDC collateral to cover the outstanding xStock token debt.
2. Use USDC to swap into the amount of xStock required to repay the debt.
3. Repay the borrowed xStock.
4. Withdraw the remaining USDC collateral.

When the xStock price has fallen, fewer USDC may be required to buy back the borrowed amount. If its price has risen, closing the position will require more USDC.

## Risks to consider

### Liquidation risk

If the value of your collateral falls relative to your debt, the position may reach its liquidation LTV. Keep a safety buffer rather than borrowing the maximum available amount.

### Borrowing costs

Borrow APYs are variable and can change with market utilization. A position can lose money even when the directional trade is correct if borrowing costs are sufficiently high.

### Swap price impact

Opening and closing positions require swaps. Low liquidity or a large transaction may result in price impact or slippage.

### Market and oracle risk

xStocks can trade onchain around the clock, while issuance and redemption generally follow a 24/5 schedule. Liquidity and pricing conditions may therefore differ outside the underlying equity market's normal hours.

### xStock-specific risks

xStocks are tokenized representations of equities or ETFs and are not identical to holding traditional shares. Availability is also restricted in certain jurisdictions.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.