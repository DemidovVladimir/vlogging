# Incentive Programs

Learn how to discover and claim incentive rewards on Aave v4.

---

Aave v4 reserves may offer additional incentives beyond base lending rates. These incentives are distributed through [Merkl](https://merkl.xyz/), a decentralized incentive distribution platform, or through **Points programs** that reward users with points multipliers.

## Reward Types

Potential rewards are available in the `rewards` array of the [Reserve Summary](./reserves#reserve-data-structure).

```ts title="TypeScript"
interface Reserve {
  // …
  summary: {
    rewards: Reward[];
    // …
  };
}

type Reward =
  | MerklSupplyReward
  | MerklBorrowReward
  | SupplyPointsReward
  | BorrowPointsReward;
```

```graphql title="GraphQL"
fragment Reserve on Reserve {
  # …
  summary {
    rewards {
      ... on MerklSupplyReward {
        ...MerklSupplyReward
      }

      ... on MerklBorrowReward {
        ...MerklBorrowReward
      }

      ... on SupplyPointsReward {
        ...SupplyPoints
      }

      ... on BorrowPointsReward {
        ...BorrowPoints
      }
    }
    # …
  }
}
```

### Supply Rewards

Supply rewards can be present on suppliable reserves.

#### Merkl Supply Rewards

Merkl supply rewards represent an **extra APY** on top of the base reserve supply APY. The accrued extra interest is paid in the specified payout token when the incentive campaign reaches its maturity.

```ts title="TypeScript"
interface MerklSupplyReward {
  __typename: "MerklSupplyReward";
  id: string;
  startDate: Date;
  endDate: Date;
  extraApy: PercentNumber;
  payoutToken: Erc20Token;
  criteria: MerklCriteria[];
  userEligible: boolean;
}
```

```graphql title="GraphQL"
fragment MerklSupplyReward on MerklSupplyReward {
  __typename
  id
  startDate
  endDate
  extraApy {
    ...PercentNumber
  }
  payoutToken {
    ...Erc20Token
  }
  criteria {
    ...MerklCriteria
  }
  userEligible
}
```

Where:

- `extraApy` - The additional APY earned on top of the base supply APY
- `payoutToken` - The token used to pay the extra interest accrued from the reward
- `criteria` - [Eligibility requirements](#eligibility-criteria) for earning the reward

#### Points Supply Rewards

Some reserves participate in **Points programs**. Users who supply into these reserves accrue points over time proportional to their position size.

```ts title="TypeScript"
interface SupplyPointsReward {
  __typename: "SupplyPointsReward";
  id: string;
  program: PointsProgram;
  name: string;
  startDate: Date;
  endDate: Date | null;
  multiplier: number;
  criteria: PointsCriteria[];
  userEligible: boolean;
}
```

```graphql title="GraphQL"
fragment SupplyPoints on SupplyPointsReward {
  __typename
  id
  program {
    ...PointsProgram
  }
  name
  startDate
  endDate
  multiplier
  criteria {
    ...PointsCriteria
  }
  userEligible
}
```

Where:

- `program` - The [Points program](#points-program) issuing the reward
- `multiplier` - Boost factor on the base points accrual rate
- `criteria` - [Eligibility requirements](#eligibility-criteria) for earning the reward

### Borrow Rewards

Borrow rewards can be present on borrowable reserves.

#### Merkl Borrow Rewards

Merkl borrow rewards represent an **APY discount** on the user's borrow rate (which includes their [Risk Premium](../positions/conditions#user-risk-premium)). The accrued interest discount is paid in the specified payout token when the incentive campaign reaches its maturity.

```ts title="TypeScript"
interface MerklBorrowReward {
  __typename: "MerklBorrowReward";
  id: string;
  startDate: Date;
  endDate: Date;
  discountApy: PercentNumber;
  payoutToken: Erc20Token;
  criteria: MerklCriteria[];
  userEligible: boolean;
}
```

```graphql title="GraphQL"
fragment MerklBorrowReward on MerklBorrowReward {
  __typename
  id
  startDate
  endDate
  discountApy {
    ...PercentNumber
  }
  payoutToken {
    ...Erc20Token
  }
  criteria {
    ...MerklCriteria
  }
  userEligible
}
```

Where:

- `discountApy` - The APY discount applied to the user's borrow rate
- `payoutToken` - The token used to pay the reward
- `criteria` - [Eligibility requirements](#eligibility-criteria) for earning the reward

#### Points Borrow Rewards

Similarly, borrowing from certain reserves can accrue points in a **Points program**.

```ts title="TypeScript"
interface BorrowPointsReward {
  __typename: "BorrowPointsReward";
  id: string;
  program: PointsProgram;
  name: string;
  startDate: Date;
  endDate: Date | null;
  multiplier: number;
  criteria: PointsCriteria[];
  userEligible: boolean;
}
```

```graphql title="GraphQL"
fragment BorrowPoints on BorrowPointsReward {
  __typename
  id
  program {
    ...PointsProgram
  }
  name
  startDate
  endDate
  multiplier
  criteria {
    ...PointsCriteria
  }
  userEligible
}
```

Where:

- `program` - The [Points program](#points-program) issuing the reward
- `multiplier` - Boost factor on the base points accrual rate
- `criteria` - [Eligibility requirements](#eligibility-criteria) for earning the reward

### Points Program

A `PointsProgram` represents a loyalty or incentive system. Users accumulate points over time based on their supply or borrow position. The `externalUrl` links to the program's website where users can view their accumulated points.

```ts title="TypeScript"
interface PointsProgram {
  __typename: "PointsProgram";
  id: string;
  name: string;
  externalUrl: string | null;
  iconUrl: string | null;
}
```

```graphql title="GraphQL"
fragment PointsProgram on PointsProgram {
  __typename
  id
  name
  externalUrl
  iconUrl
}
```

### Eligibility Criteria

Each reward may have eligibility criteria that users must meet. Both Merkl and Points criteria share the same shape (`id`, `text`, `userPassed`) but use distinct GraphQL types.

```ts title="TypeScript"
// Merkl rewards use MerklCriteria
interface MerklCriteria {
  __typename: "MerklGenericCriteria";
  id: string;
  text: string;
  userPassed: boolean;
}

// Points rewards use PointsCriteria
interface PointsCriteria {
  __typename: "PointsGenericCriteria";
  id: string;
  text: string;
  userPassed: boolean;
}
```

```graphql title="GraphQL"
fragment MerklCriteria on MerklCriteria {
  ... on MerklGenericCriteria {
    __typename
    id
    text
    userPassed
  }
}

fragment PointsCriteria on PointsCriteria {
  ... on PointsGenericCriteria {
    __typename
    id
    text
    userPassed
  }
}
```

## Matured Rewards

Rewards become claimable when their incentive campaign reaches maturity. Campaigns are often renewed upon reaching their end date, so users should check for new reward opportunities periodically.

### Claimable Rewards

Fetch the user's matured rewards that are ready to claim.

<tabgroup>
<tab label="React">

Use the `useUserClaimableRewards` hook (or the imperative `useUserClaimableRewardsAction` variant) to fetch all rewards the user can claim.

```tsx title="Loading State"
import {
  chainId,
  useUserClaimableRewards,
  type EvmAddress,
} from "@aave/react";

function ClaimableRewards({ user }: { user: EvmAddress }) {
  const { data, loading, error } = useUserClaimableRewards({
    user,
    chainId: chainId(1),
  });

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  if (data.length === 0) return <div>No claimable rewards</div>;

  return (
    <div>
      {data.map((reward) => (
        <div key={reward.id}>
          Amount: {reward.claimable.amount.value.toDecimalPlaces(2)}
          Claim until: {reward.claimUntil.toLocaleDateString()}
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import {
  chainId,
  useUserClaimableRewards,
  type EvmAddress,
} from "@aave/react";

function ClaimableRewards({ user }: { user: EvmAddress }) {
  const { data } = useUserClaimableRewards({
    user,
    chainId: chainId(1),
    suspense: true,
  });

  if (data.length === 0) return <div>No claimable rewards</div>;

  return (
    <div>
      {data.map((reward) => (
        <div key={reward.id}>
          Amount: {reward.claimable.amount.value.toDecimalPlaces(2)}
          Claim until: {reward.claimUntil.toLocaleDateString()}
        </div>
      ))}
    </div>
  );
}
```

```tsx title="Imperative Read"
import {
  chainId,
  useUserClaimableRewardsAction,
  type EvmAddress,
} from "@aave/react";

// …

const [fetch, { called, data, error, loading }] =
  useUserClaimableRewardsAction();

const handler = async (user: EvmAddress) => {
  const result = await fetch({
    user,
    chainId: chainId(1),
  });

  if (result.isOk()) {
    console.log(result.value); // UserClaimableReward[]
  } else {
    console.error(result.error);
  }
};
```

> [!WARNING]
> The `useUserClaimableRewardsAction` hook does **not** watch for updates. Use
> it when you need on-demand, fresh data (e.g., in an event handler).

</tab>
<tab label="TypeScript">

Use the `userClaimableRewards` action to fetch all rewards the user can claim.

```ts title="Claimable Rewards"
import { userClaimableRewards } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";

import { client } from "./client";

const result = await userClaimableRewards(client, {
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  chainId: chainId(1),
});

if (result.isErr()) {
  console.error("claimable rewards error:", result.error);
} else {
  // result.value: UserClaimableReward[]
  console.log(result.value);
}
```

If `result.value` is an empty array, the user has no claimable rewards.

</tab>
<tab label="GraphQL">

Use the `userClaimableRewards` query to fetch all rewards the user can claim.

```graphql title="Query"
query {
  userClaimableRewards(
    request: { 
      user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      chainId: 1
    }
  ) {
    __typename
    ... on UserMerklClaimableReward {
      id
      claimable {
        token {
          address
          symbol
          decimals
          chainId
        }
        amount {
          value
          decimals
          raw
        }
        usd
      }
      startDate
      endDate
      claimUntil
    }
  }
}
```

If the query returns an empty array, the user has no claimable rewards.

</tab>
</tabgroup>
The `UserMerklClaimableReward` type contains details about each claimable reward:

```ts title="TypeScript"
interface UserMerklClaimableReward {
  __typename: "UserMerklClaimableReward";
  id: string;
  claimable: Erc20Amount;
  startDate: Date;
  endDate: Date;
  claimUntil: Date;
}
```

```graphql title="GraphQL"
fragment UserMerklClaimableReward on UserMerklClaimableReward {
  __typename
  id
  claimable {
    ...Erc20Amount
  }
  startDate
  endDate
  claimUntil
}
```

Where:

- `id` - Unique identifier for the reward (used when claiming)
- `claimable` - The claimable token amount
- `startDate` - When the reward period started
- `endDate` - When the reward period ended
- `claimUntil` - Deadline to claim the reward

### Claim Rewards

Once you have claimable rewards, collect them individually or all at once in a single transaction.

> [!WARNING]
> After claiming, the claimable rewards list may not update immediately. The
> update depends on Merkl signaling that the rewards have been claimed, which
> can take some time.

<tabgroup>
<tab label="React">

To claim rewards with AaveKit React, follow these steps.

#### Configure Wallet Integration

First, instantiate the `useSendTransaction` hook for the [wallet library of your choice](../getting-started/react#integrations).

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: wallet } = useWalletClient();
const [sendTransaction] = useSendTransaction(wallet);
```

#### Define the Claim Flow

Then, use the `useClaimRewards` hook to prepare the claim operation.

```tsx title="Basic Usage"
import { useClaimRewards } from "@aave/react";

const [claim, { loading, error }] = useClaimRewards((transaction) =>
  sendTransaction(transaction),
);
```

```tsx title="Update Component State"
import { useClaimRewards } from "@aave/react";

const [status, setStatus] = useState("");

const [claim, { loading, error }] = useClaimRewards((transaction) => {
  setStatus("Please sign the claim transaction in your wallet");
  return sendTransaction(transaction).andTee(() => setStatus("Claiming…"));
});
```

```tsx title="Cancel Flow"
import { useClaimRewards } from "@aave/react";

const [claim, { loading, error }] = useClaimRewards(
  (transaction, { cancel }) => {
    if (window.confirm("Are you sure you want to claim?") === false) {
      return cancel("User cancelled the operation");
    }
    return sendTransaction(transaction);
  },
);
```

#### Execute the Claim Operation

Then, execute the claim operation with the reward IDs from the claimable rewards.

```tsx title="Claim Rewards"
import {
  chainId,
  useUserClaimableRewards,
  rewardId,
  evmAddress,
} from "@aave/react";

const { data: claimableRewards } = useUserClaimableRewards({
  user: evmAddress(wallet.account.address),
  chainId: chainId(1),
  suspense: true,
});

const execute = async () => {
  if (claimableRewards.length > 0) {
    const result = await claim({
      ids: claimableRewards.map((reward) => rewardId(reward.id)),
      user: evmAddress(wallet.account.address),
      chainId: chainId(1),
    });

    // …
  }
};
```

#### Handle the Result

Finally, handle the result.

```tsx title="Example"
const execute = async () => {
  const result = await claim(/* … */);

  if (result.isErr()) {
    switch (result.error.name) {
      case "CancelError":
        // The user cancelled the operation
        return;

      case "SigningError":
        console.error(
          `Failed to sign the transaction: ${result.error.message}`,
        );
        break;

      case "TimeoutError":
        console.error(`Transaction timed out: ${result.error.message}`);
        break;

      case "TransactionError":
        console.error(`Transaction failed: ${result.error.message}`);
        break;

      case "UnexpectedError":
        console.error(result.error.message);
        break;
    }
    return;
  }

  console.log("Rewards claimed successfully with hash:", result.value.txHash);
};
```

</tab>
<tab label="TypeScript">

To claim rewards with AaveKit TypeScript, follow these steps.

#### Prepare the Claim Request

First, use the `claimRewards` action with the reward IDs from the claimable rewards.

```ts title="Claim Rewards"
import { userClaimableRewards, claimRewards } from "@aave/client/actions";
import { chainId, evmAddress, rewardId } from "@aave/client";

import { client } from "./client";

const result = await userClaimableRewards(client, {
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
}).andThen((rewards) =>
  claimRewards(client, {
    ids: rewards.map((reward) => rewardId(reward.id)),
    user: evmAddress('0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234'),
    chainId: chainId(1),
  }),
);

// …
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

#### Process the Execution Plan

Then, use `sendWith` for the [wallet library of your choice](../getting-started/typescript#integrations) to send the transaction, and await indexing with `client.waitForTransaction`.

```ts title="Viem"
import { claimRewards } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";
import { chainId, evmAddress, rewardId } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await claimRewards(client, {
  ids: rewards.map((reward) => rewardId(reward.id)),
  user: evmAddress(wallet.account.address),
  chainId: chainId(1),
})
  .andThen(sendWith(wallet))
  .andThen(client.waitForTransaction);
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

```ts title="wallet.ts"
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

export const wallet = createWalletClient({
  account: privateKeyToAccount(process.env.PRIVATE_KEY as Hex),
  chain: mainnet,
  transport: http(),
});
```

#### Handle the Result

Finally, handle the result.

```ts title="Example"
if (result.isErr()) {
  switch (result.error.name) {
    case "CancelError":
      // The user cancelled the operation
      return;

    case "SigningError":
      console.error(`Failed to sign the transaction: ${result.error.message}`);
      break;

    case "TimeoutError":
      console.error(`Transaction timed out: ${result.error.message}`);
      break;

    case "TransactionError":
      console.error(`Transaction failed: ${result.error.message}`);
      break;

    case "UnexpectedError":
      console.error(result.error.message);
      break;
  }
} else {
  console.log("Rewards claimed successfully with hash:", result.value.txHash);
}
```

</tab>
<tab label="GraphQL">

To claim rewards with AaveKit API, follow these steps.

#### Prepare the Claim Request

First, use the `claimRewards` query with the reward IDs from the claimable rewards.

```graphql title="Query"
query {
  claimRewards(
    request: {
      ids: ["reward-id-1", "reward-id-2"]
      user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
      chainId: 1
    }
  ) {
    to
    from
    data
    value
    chainId
  }
}
```

#### Execute the Transaction

Then, send the returned transaction using the wallet associated with the `from` address.

```json title="Response"
{
  "data": {
    "claimRewards": {
      "to": "0x1234567890abcdef1234567890abcdef12345678",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0x...",
      "value": "0",
      "chainId": 1
    }
  }
}
```

</tab>
</tabgroup>
