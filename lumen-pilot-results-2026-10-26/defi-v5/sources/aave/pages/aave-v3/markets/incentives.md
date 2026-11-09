# Incentive Programs

Aave reserves may offer additional incentives beyond base lending rates.

## Incentive Types

- **Supply Incentives**: Extra APR for supplying assets to reserves
- **Borrow Incentives**: APR discounts for borrowing from reserves
- **Conditional Incentives**: Bonus rewards requiring specific supply + borrow combinations

Each reserve's `incentives` array contains all active incentive programs. The incentive data includes:

- APR bonuses/discounts with formatted percentages
- Reward token information (for Aave governance incentives)
- Claim links (for Merit programs)
- Conditional requirements (for complex incentives)

You can find the incentives associated with a reserve in the `incentives` array of the [Reserve](./data#reserve-structure) object.

```ts title="Reserve"
interface Reserve {
  // …
  incentives: ReserveIncentive[];
}
```

```ts title="ReserveIncentive"
type ReserveIncentive =
  | MeritSupplyIncentive
  | MeritBorrowIncentive
  | MeritBorrowAndSupplyIncentiveCondition
  | AaveSupplyIncentive
  | AaveBorrowIncentive;
```

These incentives come from two main sources:

- [Merit Programs](#incentive-types-merit-programs)
- [Aave Governance Rewards](#incentive-types-aave-governance-rewards)

### Merit Programs

[Third-party programs](https://apps.aavechan.com/merit) that provide extra APR rewards for specific lending activities. These require separate claiming through external platforms.

> [!WARNING]
> Merit programs are third-party initiatives. Aave Labs does not guarantee these
> programs and accepts no liability for third-party rewards.

```ts title="MeritSupplyIncentive"
interface MeritSupplyIncentive {
  __typename: "MeritSupplyIncentive";
  extraSupplyApr: PercentValue;
  claimLink: string;
}
```

```ts title="MeritBorrowIncentive"
interface MeritBorrowIncentive {
  __typename: "MeritBorrowIncentive";
  borrowAprDiscount: PercentValue;
  claimLink: string;
}
```

```ts title="MeritBorrowAndSupplyIncentiveCondition"
interface MeritBorrowAndSupplyIncentiveCondition {
  __typename: "MeritBorrowAndSupplyIncentiveCondition";
  extraApr: PercentValue;
  supplyToken: Currency;
  borrowToken: Currency;
  claimLink: string;
}
```

Where:

- **MeritSupplyIncentive**: Extra APR for supplying assets to reserves
- **MeritBorrowIncentive**: APR discounts for borrowing from reserves
- **MeritBorrowAndSupplyIncentiveCondition**: Extra APR for supplying and borrowing the specified pair of assets

For each of these types, a claim link to the [ACI Merit UI](https://apps.aavechan.com/merit) is provided.

### Aave Governance Rewards

Incentives set by Aave governance through the [RewardsController](../smart-contracts/incentives), typically distributed in AAVE tokens or other approved reward tokens.

```ts title="AaveSupplyIncentive"
interface AaveSupplyIncentive {
  __typename: "AaveSupplyIncentive";
  extraSupplyApr: PercentValue;
  rewardTokenAddress: EvmAddress;
  rewardTokenSymbol: string;
}
```

```ts title="AaveBorrowIncentive"
interface AaveBorrowIncentive {
  __typename: "AaveBorrowIncentive";
  borrowAprDiscount: PercentValue;
  rewardTokenAddress: EvmAddress;
  rewardTokenSymbol: string;
}
```

Where:

- **AaveSupplyIncentive**: Extra APR for supplying assets to reserves
- **AaveBorrowIncentive**: APR discounts for borrowing from reserves

In both cases, the reward token address and symbol are provided.

## Claim Merit Rewards

Users can know if they have claimable [Merit](https://apps.aavechan.com/merit) rewards and claim them, following the steps below.

### Fetch the Claimable Rewards

First, determine if a user has claimable rewards.

<tabgroup>
<tab label="React">

Use the `useUserMeritRewards` hook to fetch the user's claimable rewards and the transaction to claim them.

```ts title="Loading State"
const { data, loading, error } = useUserMeritRewards({
  user: EvmAddress,
  chainId: ChainId,
});
```

```ts title="React Suspense"
const { data } = useUserMeritRewards({
  user: EvmAddress,
  chainId: ChainId,
  suspense: true,
});
```

Fetch the user's claimable rewards and the transaction to claim them.

```tsx title="Merit Rewards"
import { useUserMeritRewards, evmAddress, chainId } from "@aave/react";

// …

const { data, loading, error } = useUserMeritRewards({
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  chainId: chainId(1),
});

if (loading) {
  return Loading claimable rewards...;
}

if (error) {
  return Error: {error.message};
}

// data: UserMeritRewards | null
```

```tsx title="Filter by Token"
import { useUserMeritRewards, evmAddress, chainId } from "@aave/react";

// …

const { data, loading, error } = useUserMeritRewards({
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  chainId: chainId(1),
  filter: {
    // Filter rewards by token address
    tokens: [evmAddress("0x000000000000000000000000000000000000000A")],
  },
});

if (loading) {
  return Loading claimable rewards...;
}

if (error) {
  return Error: {error.message};
}

// data: UserMeritRewards | null
```

If `data` is `null`, the user has no claimable rewards.

</tab>
<tab label="TypeScript">

Use the `userMeritRewards` action to fetch the user's claimable rewards and the transaction to claim them.

```ts title="Merit Rewards"
import { userMeritRewards } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";

import { client } from "./client";

const result = await userMeritRewards(client, {
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  chainId: chainId(1),
});

if (result.isErr()) {
  console.error("Merit claim rewards error:", result.error);
} else {
  // result.value: UserMeritRewards | null
  console.log(result.value);
}
```

```ts title="Filter by Token"
import { userMeritRewards } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";

import { client } from "./client";

const result = await userMeritRewards(client, {
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  chainId: chainId(1),
  filter: {
    // Filter rewards by token address
    tokens: [evmAddress("0x000000000000000000000000000000000000000A")],
  },
});

if (result.isErr()) {
  console.error("Merit claim rewards error:", result.error);
} else {
  // result.value: UserMeritRewards | null
  console.log(result.value);
}
```

If `result.value` is `null`, the user has no claimable rewards.

</tab>
<tab label="GraphQL">

Use the `userMeritRewards` query to fetch the user's claimable rewards and the transaction to claim them.

```graphql title="Query"
query {
  userMeritRewards(
    request: {
      user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
      chainId: 1
      # Optional filter
      # filter: {
      #   tokens: ["0x000000000000000000000000000000000000000A"]
      # }
    }
  ) {
    chain
    claimable {
      amount {
        usdPerToken
        usd
        amount {
          value
          decimals
          raw
        }
      }
      currency {
        address
        imageUrl
        name
        symbol
        decimals
        chainId
      }
    }
    transaction {
      to
      from
      data
      value
      chainId
      operation
    }
  }
}
```

If the query result is `null`, the user has no claimable rewards.

</tab>
</tabgroup>
### Claim Rewards

Finally, if the user has claimable rewards, they can claim them by sending the transaction.

<tabgroup>
<tab label="React">

Use the `useSendTransaction` hook for the [wallet library of your choice](../getting-started/react#integrations-send-aave-transactions) to send the transactions in the execution plan.

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useUserMeritRewards } from "@aave/react";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: walletClient } = useWalletClient();
const { data } = useUserMeritRewards({
  // …
  suspense: true,
});

const [sendTransaction, sending] = useSendTransaction(walletClient);

// …

const execute = async () => {
  if (data !== null) {
    const result = await sendTransaction(data.transaction);

    if (result.isErr()) {
      console.error(result.error.message);
    } else {
      console.log("Merit claim rewards successful with hash:", result.value);
    }
  }
};
```

</tab>
<tab label="TypeScript">

Use `sendWith` for your [chosen wallet library](../getting-started/typescript#integrations-send-aave-transactions) to send the transaction.

```ts title="Viem"
import { userMeritRewards } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const meritRewards = await userMeritRewards(client, {
  // …
});

if (meritRewards.isErr()) {
  console.error(meritRewards.error);
  process.exit(1); // or eager return if in a function
}

if (!meritRewards.value) {
  console.log("No rewards to claim");
  process.exit(1); // or eager return if in a function
}

const result = await sendWith(wallet)(meritRewards.value.transaction);

if (result.isErr()) {
  console.error("Claiming Merit rewards failed:", result.error);
} else {
  console.log("Merit rewards claimed successfully:", result.value);
}
```

</tab>
<tab label="GraphQL">

Send the `transaction` request directly using the wallet associated with the from address.

```json title="UserMeritRewards"
{
  "data": {
    "userMeritRewards": {
      "chainId": 1,
      "claimable": [
        {
          "amount": {
            "usdPerToken": "1.000000000000000000",
            "usd": "1.00",
            "amount": {
              "value": "1.000000000000000000",
              "decimals": 18,
              "raw": "1000000000000000000"
            }
          },
          "currency": {
            "address": "0x000000000000000000000000000000000000000A",
            "name": "Example Token",
            "symbol": "EXAMPLE",
            "decimals": 18,
            "chainId": 1,
            "imageUrl": "https://example.com/image.png"
          }
        }
      ],
      "transaction": {
        "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x69328dec000000000000000000000000c02…",
        "value": "0",
        "chainId": 1,
        "operation": "MERIT_CLAIM_REWARDS"
      }
    }
  }
}
```

</tab>
</tabgroup>
