# Risks

The Aave Protocol offers decentralised access to liquidity but is not without risks. Robust risk management measures, including smart contract audits and governance frameworks, are in place to help mitigate risks. Below is an overview of key risks and mitigation efforts.

## Smart Contract Risk

Smart contracts can contain software bugs or other vulnerabilities within the protocol code and the underlying reserve tokens. To mitigate these risks, Aave’s code is publicly available for audit and has undergone multiple external third-party professional audits. Any proposed changes to the protocol code are thoroughly reviewed and approved prior to implementation by the Aave community. Additionally, the protocol runs a continuous bug bounty program to incentivize external developers to identify and report any issues they may find so they can be fixed.

## Oracle Risk

Aave relies on third-party oracles for price feeds and external data, such as redemption ratios for liquid staking tokens. This reliance introduces potential risks such as incorrect valuations if an oracle fails or is compromised. To reduce this risk, Aave uses decentralised oracles like Chainlink, which provide tamper-resistant data feeds, greater reliability, and security measures.

## Collateral Risk

The Aave DAO also engages risk service providers who track collateral performance and market stability. The value and liquidity of assets used as collateral can fluctuate, leading to the risk of under collateralisation or bad debt. Aave mitigates these risks by setting key risk parameters such as loan-to-value (LTV) ratios and liquidation thresholds. These parameters are continuously monitored by risk service providers and can be adjusted by Aave governance to respond to market conditions.

## Network / Bridge Risk

Aave operates across multiple blockchain networks and bridges, each with potential risks such as congestion, censorship, or security vulnerabilities. To address these types of risks, Aave Governance has a robust network onboarding framework that thoroughly vets new networks and bridges before they are integrated into the protocol. Community oversight during the governance process is an important step to validate adoption of secure and reliable systems, minimising risk.

For additional information on Aave Protocol risk management, see [Security & Audits](https://aave.com/security).
