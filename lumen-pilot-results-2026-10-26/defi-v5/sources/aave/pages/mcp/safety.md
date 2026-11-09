# Safety

Aave MCP reads live protocol data and builds transactions. It never signs them, and the user's wallet is the last gate before anything reaches a chain.

## Non-Custodial by Design

- The server holds **no private keys** and cannot move funds.
- Read tools are side-effect-free.
- A `prepare_*` tool returns an unsigned transaction, an approval step that comes first, or EIP-712 typed data to sign. None of it commits anything.
- Two tools change state. `submit_signed_order` relays an order the user has **already signed**, and `cancel_order` relays a signed cancellation. Neither can create or sign anything of its own.
- Signing happens in the user's wallet, on every version and every action.

> [!NOTE]
> Because building a transaction commits nothing, an agent needs no permission to
> build one. The useful pattern is to prepare it, state the action, the amounts
> and the resulting health factor, and let the user decide at the signature.

## Warnings That Stop an Action

A result may carry `warnings`, each with a `level`, a stable `code`, and a message. The levels are not interchangeable, and `error` is the one with teeth.

| Level     | What to do                                                                                           |
| :-------- | :--------------------------------------------------------------------------------------------------- |
| `error`   | The action cannot succeed as built. Stop, fix the arguments, or tell the user. Do not build or sign past it. |
| `warning` | The action will succeed. Tell the user before they sign.                                              |
| `info`    | Context worth passing on.                                                                             |

## Simulate Before Signing

`preview_action` reports what an action would leave behind, on either version, and commits nothing. Run it before a borrow or a withdraw, the two actions that move a position toward liquidation, and show the result next to the amount.

A clean simulation means the position allows the action. It says nothing about token allowances, so an approval step can still be outstanding.

## Reserve Flags Block Different Things

A status flag is not uniformly disqualifying, and treating it that way pushes a user away from actions they should be taking.

| Flag               | Supply | Borrow | Withdraw | Repay |
| :----------------- | :----- | :----- | :------- | :---- |
| Frozen             | No     | No     | Yes      | Yes   |
| Paused             | No     | No     | No       | No    |
| Supply cap reached | No     | Yes    | Yes      | Yes   |
| Borrow cap reached | Yes    | No     | Yes      | Yes   |

A frozen reserve still lets a position be unwound, so refusing a withdraw or a repay on one tells the user to abandon a position they should be closing. `get_markets` carries these flags along with the liquidity left, and only when set, so a row with none of them is not flagged. That is why a reserve should be ranked on a rate that can actually be entered rather than on APY alone.

## What a Supplier Is Exposed To

None of the following shows up in a health factor, and the server returns the fields behind each one without ranking reserves by risk.

- Supplying puts tokens in a contract. A governance-approved reserve list is curation, not a guarantee.
- A quoted APY is the rate now, not a promise. It moves with utilization, and `get_apy_history` shows how far it has actually moved.
- Getting out is not always immediate. `availableLiquidity` is what can be pulled at this moment, so a high rate on a fully utilized reserve is a rate nobody exits quickly.
- A plain supply cannot be liquidated. Once it is collateral it can, and the liquidator takes a bonus out of it.
- Isolation mode on v3, or a low collateral factor, is the DAO pricing that asset as riskier.
- Reward and incentive rates are separate from the supply rate and can stop, so they are not part of the yield.

## An Empty Result Is Not Always an Answer

A read names the chains it covered under `chainsCovered`, and what it skipped under `chainsNotCovered`. A chain under `chainsNotServed` is one this API holds no market on, so nothing there is a statement about the chain itself.

Those fields matter most in the case that looks harmless. A wallet with no position on a chain and a chain that could not be read both come back with an empty list, and only the coverage fields tell them apart.

## Security Resources

  <IconCard
    href="/aave-v3/umbrella"
    icon="RiskIcon"
    title="Umbrella"
    description="Native coverage for bad debt."
  />
  <IconCard
    href="https://aave.com/security"
    icon="ShieldIcon"
    title="Security"
    description="Security resources and audits."
  />
