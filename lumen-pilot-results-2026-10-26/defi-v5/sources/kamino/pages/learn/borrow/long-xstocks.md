> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# How to Long xStocks on Kamino

> Open a leveraged long position on xStocks using Kamino's Borrow market.

A leveraged long position increases your exposure to an xStock by borrowing against your existing holdings and using the borrowed funds to purchase more of the same asset.

Unlike a one-click Multiply position, this strategy is built manually by supplying collateral, borrowing USDC, swapping it for more xStock, and optionally supplying the received tokens again.

Leveraged positions carry liquidation risk. Always review your loan-to-value ratio, liquidation price, borrowing costs, and swap details before confirming a transaction.

## Opening a leveraged long position

**1. Open the xStocks market**

Go to **Borrow** and select the **xStocks Market**.

![xStocks Market on the Borrow page](https://mintcdn.com/kamino-3d73a151/E-tSDExrEbYYF1-q/images/learn/borrow/xstocks-market.webp?fit=max\&auto=format\&n=E-tSDExrEbYYF1-q\&q=85\&s=a9c715a6dff5f86ac2dac412df0e48c1)

**2. Supply the xStock**

Select the xStock you want to use as collateral. Enter the amount you want to supply and confirm the transaction in your wallet.

![Supply modal for an xStock](https://mintcdn.com/kamino-3d73a151/E-tSDExrEbYYF1-q/images/learn/borrow/supply-xstock.webp?fit=max\&auto=format\&n=E-tSDExrEbYYF1-q\&q=85\&s=10ac18781ab9295d1037ff7dc91ce4ff)

Your supplied xStock will now act as collateral for the position.

**3. Borrow USDC**

Under **Borrow**, select USDC. Enter the amount you want to borrow. Before confirming, review:

* Borrow APY
* Loan-to-value ratio
* Liquidation LTV

Confirm the transaction in your wallet.

![USDC borrow modal and position health information](https://mintcdn.com/kamino-3d73a151/E-tSDExrEbYYF1-q/images/learn/borrow/borrow-usdc.webp?fit=max\&auto=format\&n=E-tSDExrEbYYF1-q\&q=85\&s=dc9290505d56150105cc5a2cb68a7e3e)

**4. Swap the borrowed USDC for more xStock**

Open Kamino **Swap** and exchange the borrowed USDC for the same xStock that you originally supplied.

Review the quoted amount, price impact, and minimum received before confirming.

![USDC-to-xStock swap](https://mintcdn.com/kamino-3d73a151/E-tSDExrEbYYF1-q/images/learn/borrow/swap-usdc-to-xstock.webp?fit=max\&auto=format\&n=E-tSDExrEbYYF1-q\&q=85\&s=59e42a83565e8720e0be53804fafb554)

You now have greater exposure to the xStock than you had with your original capital alone.

**5. Optional: Supply the additional xStock**

You can return to the xStocks Borrow market and supply the newly purchased xStock as additional collateral.

This may allow you to borrow more USDC and repeat the process, commonly called **looping**.

![Supplying the additional xStock](https://mintcdn.com/kamino-3d73a151/E-tSDExrEbYYF1-q/images/learn/borrow/supply-additional-xstock.webp?fit=max\&auto=format\&n=E-tSDExrEbYYF1-q\&q=85\&s=4099d92ca97e73206809761c224ed022)

Each loop increases both your exposure and your risk. A decline in the xStock's value can move the position closer to liquidation.

## Closing a leveraged long position

### Repay with collateral (one-click)

**1. Select Repay with Collateral**

Select **Repay with Collateral** on the debt token.

**2. Enter the repayment amount**

Enter the amount you want to repay.

**3. Review and confirm**

Review the quoted amount, price impact, and minimum received in the UI before confirming the transaction in your wallet.

![Repay with Collateral](https://mintcdn.com/kamino-3d73a151/E-tSDExrEbYYF1-q/images/learn/borrow/repay-with-collateral-long.webp?fit=max\&auto=format\&n=E-tSDExrEbYYF1-q\&q=85\&s=24dc7d81a9b77350027326bdfb22293c)

### Manual unwind

![Manual unwind of a leveraged long](https://mintcdn.com/kamino-3d73a151/E-tSDExrEbYYF1-q/images/learn/borrow/manual-unwind-long.webp?fit=max\&auto=format\&n=E-tSDExrEbYYF1-q\&q=85\&s=62a08a5b03cb8b18cae6c8f5a6676272)

1. Withdraw xStock to cover the outstanding USDC debt.
2. Swap the withdrawn xStock for USDC.
3. Repay the USDC loan using **Repay from wallet**.
4. Withdraw the remaining collateral.

## Risks to consider

### Liquidation risk

If the value of your collateral falls relative to your debt, the position may reach its liquidation LTV. Keep a safety buffer rather than borrowing the maximum available amount.

### Borrowing costs

Borrow APYs are variable and can change with market utilization. A position can lose money even when the directional trade is correct if borrowing costs are sufficiently high.

### Swap price impact

Opening, looping, and closing positions require swaps. Low liquidity or a large transaction may result in price impact or slippage.

### Market and oracle risk

xStocks can trade onchain around the clock, while issuance and redemption generally follow a 24/5 schedule. Liquidity and pricing conditions may therefore differ outside the underlying equity market's normal hours.

### xStock-specific risks

xStocks are tokenized representations of equities or ETFs and are not identical to holding traditional shares. Availability is also restricted in certain jurisdictions.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.