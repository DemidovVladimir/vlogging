# Aave Horizon RWA Market

Aave Horizon is an initiative by Aave Labs designed to create a robust marketplace for Real-World Assets (RWAs) tailored to institutional and qualified participants. It operates as a licensed, separate instance of the Aave Protocol, initially forking v3.3, to meet the regulatory and compliance requirements associated with RWA products. The core function of the Aave Horizon market is to allow users to supply permissioned, tokenized RWAs as collateral while borrowing permissionless stablecoins. This architecture enables institutions to maintain regulatory compliance while accessing the capital efficiency and liquidity of decentralized finance.

## Aave Horizon RWA Market

The Aave Horizon RWA Market is a specialized liquidity protocol designed to bridge institutional finance with the permissionless nature of decentralized finance (DeFi). Its architecture distinctly separates the handling of different asset types and user roles to maintain compliance while unlocking capital efficiency. This separation creates a secure environment where traditional financial institutions can participate in DeFi without compromising their regulatory obligations.

The market facilitates the use of **tokenized real-world assets (RWAs)** as collateral. This aspect is strictly permissioned, limited to qualified users who are allowlisted by the RWA issuers. Compliance is enforced at the asset level through the RWA token's native smart contract, ensuring that only approved participants can interact with these regulated assets. In contrast, the market integrates permissionless liquidity pools for stablecoins like USDC, RLUSD, and GHO, which operate without access restrictions for liquidity providers.

The core innovation of the Aave Horizon RWA Market lies in how these two sides interact: the ability to borrow from the permissionless stablecoin pools is exclusively granted to users who have supplied permissioned RWA collateral. This model strategically enables institutional entities to leverage their regulated assets to access the liquidity of the DeFi ecosystem within a compliant framework. The result is a unique hybrid system that maintains the security and compliance of traditional finance while unlocking the efficiency of decentralized protocols.

## Integrations

Aave Horizon is fully compatible with AaveKit API methods. See [getting started](./aave-v3/getting-started/react) guides to integrate Aave programmatically into your application, and specify the Aave Horizon Pool address as demonstrated in the query examples below.

<tabgroup>
<tab label="React">

```tsx
import { useAaveMarket, chainId, evmAddress } from "@aave/react";

function HorizonMarketData() {
  // Query Aave Horizon market data
  const {
    data: horizonMarketData,
    loading,
    error,
  } = useAaveMarket({
    address: evmAddress("0xAe05Cd22df81871bc7cC2a04BeCfb516bFe332C8"), // Aave Horizon Pool address
    chainId: chainId(1),
  });
}
```

</tab>
<tab label="TypeScript">

```tsx
import { AaveClient, chainId, evmAddress } from "@aave/client";
import { market } from "@aave/client/actions";

const client = AaveClient.create();

// Query Aave Horizon market data
const horizonMarketData = await market(client, {
  address: evmAddress("0xAe05Cd22df81871bc7cC2a04BeCfb516bFe332C8"), // Aave Horizon Pool address
  chainId: chainId(1),
});
```

</tab>
<tab label="GraphQL">

```graphql
query HorizonMarketData {
  market(
    request: {
      address: "0xAe05Cd22df81871bc7cC2a04BeCfb516bFe332C8" # Aave Horizon Pool address
      chainId: 1
    }
  ) {
    name
    chain {
      name
      chainId
    }
    address
    totalMarketSize
    totalAvailableLiquidity
    reserves {
      underlyingToken {
        symbol
        name
        address
      }
      supplyInfo {
        apy {
          formatted
        }
        canBeCollateral
      }
      borrowInfo {
        apy {
          formatted
        }
      }
    }
  }
}
```

</tab>
</tabgroup>
### Supplying RWA Collateral

Participation in the Aave Horizon market begins with supplying **tokenized real-world assets (RWAs)** as collateral. This process is exclusively for users who have been qualified and allowlisted by the specific relevant RWA's issuer. The qualification process typically involves standard institutional onboarding procedures, including identity verification, compliance checks, and agreement to relevant terms and conditions.

These supplied RWAs are designated for collateral use only and cannot be borrowed by other market participants. When a user supplies an asset, they receive aTokens representing the collateral position programmatically. A key characteristic of this market is that these receipt tokens are non-transferable, enhancing security and compliance by enforcing that the collateral position remains with the original supplier. This non-transferable nature prevents secondary market trading of collateral positions, maintaining the integrity of the permissioning system.

The collateral value is determined through established pricing mechanisms that account for the specific characteristics of each RWA type. Risk parameters, including loan-to-value ratios and liquidation thresholds, are configured according to the underlying asset's risk profile and regulatory requirements.

### Borrowing Stablecoins

The primary borrowable assets in the Aave Horizon market are permissionless stablecoins, such as USDC, RLUSD, and GHO. These stablecoins can be supplied to the market by any participant in a fully permissionless manner to earn yield. Stablecoins cannot be used as collateral themselves, maintaining the clear distinction between the permissioned collateral side and the permissionless liquidity side of the market.

The ability to borrow is therefore exclusively available to users who have first supplied and enabled their RWA collateral. This creates a clear separation where regulated, permissioned assets can be used to access permissionless liquidity. The borrowing process follows standard Aave Protocol mechanics, with interest rates determined by utilization curves and market dynamics.

Borrowers must maintain adequate collateralization ratios as determined by the risk parameters of their supplied RWA collateral. The system continuously monitors these ratios and may trigger liquidation processes if positions become under-collateralized, though the liquidation mechanisms are adapted to account for the unique characteristics of RWA collateral.

### RWA Price Oracle Safeguards

Unlike crypto-native assets priced by decentralized exchange markets, RWAs rely on a Net Asset Value (NAV) reported directly by the asset issuer. This introduces a critical risk vector: the potential for delayed, inaccurate, or malicious price reporting. A simple operational error or a malicious act could lead to an incorrect NAV being published onchain, which could trigger faulty liquidations across the market. While an emergency multisig can reactively freeze the reserve, this process introduces operational delays, creating a window where whitelisted liquidators could exploit a faulty price and cause irreparable harm to borrowers.

Aave Horizon implements a robust, automated safeguard directly at the Oracle level to mitigate this risk. In partnership with Chainlink and LlamaRisk, pre-defined upper and lower price bounds are configured for each RWA price feed at the Decentralized Oracle Network (DON) level. When an issuer reports a new NAV, the Chainlink DON validates it against these bounds before publishing it onchain. If the reported NAV is within the bounds, the update is accepted. If it is outside the bounds, the DON rejects the update, and the oracle continues to report the last known valid price. This proactive mechanism prevents a faulty price from ever reaching the Aave Horizon protocol, eliminating the risk of erroneous liquidations. Furthermore, any breach of these price bounds is paired with a time-sensitive reaction from Aave Horizon's emergency multisig to prevent new loan originations and additional exposure until the root cause analysis is performed.

### Administrative Functions and Edge Case Management

The structure of the Aave Horizon market provides mechanisms for account recovery and management in exceptional circumstances, facilitated by the RWA issuers. These administrative functions are essential for institutional participation, as they provide pathways for resolution in complex scenarios that may arise in regulated environments.

For instance, if a user loses access to their private keys, the asset issuer has administrative capabilities to assist in migrating the user's entire collateral and borrow position to a new, secure wallet. This recovery process maintains the integrity of the market while providing essential operational flexibility for institutional users.

There may be circumstances where the issuer is legally required to take steps to secure a position. For example, the issuers will have functionality to prevent a user from increasing their borrow position while coordinating with relevant parties on a resolution, thereby preserving the market’s collateralization and compliance.

The administrative framework is designed to be transparent and accountable, with clear governance structures determining how these exceptional powers can be exercised. This provides institutional participants with confidence that their interests are protected while maintaining the decentralized nature of the underlying protocol.

For more information on the implementation of `RwaAToken` functions and roles, see the [tokenization documentation](./smart-contracts/tokenization#rwaatoken).

For more information on Aave Horizon RWA Market governance, see [access controls](../resources/access-controls).
