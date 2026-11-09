# Solidity

Get started with the Aave smart contracts

---

The Aave smart contract interfaces provide methods for interacting with Aave Protocol v4. They enable lending, borrowing, and collateral workflows inside custom integrations. We recommend using [Foundry](https://getfoundry.sh/) for Solidity development.

For those beginning a new project, the [Foundry boilerplate](https://github.com/aave/aave-v4-foundry-template) tailored for Aave v4 is highly recommended. It offers a foundational setup for efficiently deploying and testing smart contracts that integrate with the protocol.

Included in the boilerplate are:

- `/src`: A sample smart contract demonstrating how to fetch user positions.
- `/script`: Deployment scripts for your contracts.
- `/test`: Example tests for your contracts.
- `foundry.toml`: A Foundry configuration file customized for Aave v4.

Install or update [Foundry](https://getfoundry.sh/):

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Then, follow these steps to get started:

## Clone the Repository

Clone the boilerplate repository into a new project directory:

```bash
git clone https://github.com/aave/aave-v4-foundry-template.git my-project
cd my-project
```

## Install Dependencies

Install the project dependencies:

```bash
forge install
```

## Setup Environment

Create `.env` file from the `.env.example` template:

```bash
cp .env.example .env
```

and populate the required environment variables:

```text
PRIVATE_KEY=0x…
```

## Usage

The project includes several Foundry commands designed to streamline your workflow:

- `forge build`: Compiles the contracts.
- `forge test`: Executes tests.
- `forge script <script-path>`: Deploys contracts using deployment scripts.
- `forge clean`: Removes build artifacts from the project.
- `forge fmt`: Formats the Solidity code.

## Example Deployment

To deploy the example `UserPositions` contract:

```bash
forge script script/Deploy_UserPositions.s.sol:DeployUserPositions \
  --sig "run(address)" <SPOKE_ADDRESS> \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
```

## Advanced

### Add to Existing Project

If you have an existing Foundry project and want to add Aave v4 contracts, install the dependency:

```bash
forge install aave/aave-v4
```

Update `remappings.txt` for imports to resolve correctly:

```text
aave-v4/=lib/aave-v4/
forge-std/=lib/forge-std/src/
```

Then explore the Solidity section in the rest of the documentation for integration examples.
