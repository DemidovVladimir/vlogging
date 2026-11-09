# Skills

A skill is a short procedure for one Aave flow, written for the model rather than for a person: which tools to call, in what order, and what a finished answer has to contain.

Aave publishes one skill per flow where the tool list alone tends to leave an agent a step short. Each is a single `SKILL.md` in the [aave/skills](https://github.com/aave/skills) repository.

## Skill Examples

  <IconCard
    href="https://github.com/aave/skills/blob/main/plugins/mcp/skills/safe-transactions/SKILL.md"
    icon="KeyIcon"
    title="safe-transactions"
    description="Discover, inspect, simulate, build, then hand over unsigned."
  />
  <IconCard
    href="https://github.com/aave/skills/blob/main/plugins/mcp/skills/yield-analysis/SKILL.md"
    icon="MarketsIcon"
    title="yield-analysis"
    description="Compare rates across chains and versions, against their recent range."
  />
  <IconCard
    href="https://github.com/aave/skills/blob/main/plugins/mcp/skills/deleverage/SKILL.md"
    icon="RepayIcon"
    title="deleverage"
    description="Lift a health factor by simulating every route, never estimating."
  />
  <IconCard
    href="https://github.com/aave/skills/blob/main/plugins/mcp/skills/account-activity/SKILL.md"
    icon="UserIcon"
    title="account-activity"
    description="A wallet's history, with the chains the feed actually covered."
  />
  <IconCard
    href="https://github.com/aave/skills/blob/main/plugins/mcp/skills/tx-confirmation/SKILL.md"
    icon="DashboardIcon"
    title="tx-confirmation"
    description="Confirm what a signed transaction did by reading the position it left."
  />

## How a Client Gets Them

**As a plugin.** The skills are bundled with the Aave MCP plugin, which also connects the client to `https://mcp.aave.com`. It is published to each provider's own marketplace, currently Claude Code and Cursor.

```bash
/plugin marketplace add aave/skills
/plugin install aave-mcp@aave
```

**From the repository.** An agent that loads skills from a directory can take the `SKILL.md` files from [aave/skills](https://github.com/aave/skills) as they are.

## Using a Skill

Nothing has to be invoked by name.

1. **Install the plugin,** which connects the client to `https://mcp.aave.com` and loads the skills. [Getting Started](/mcp/getting-started) covers connecting a client on its own.
2. **Ask in plain language.** "Get my health factor up on Aave", "did my supply go through". A client with skill support loads the matching procedure.
3. **Review and sign.** Skills change which reads happen and what an answer covers. They grant nothing: every state change is still an unsigned transaction your own wallet approves, as described in [Safety](/mcp/safety).

## Contributing

The skills are maintained in [aave/skills](https://github.com/aave/skills). Proposals and corrections are welcome there.
