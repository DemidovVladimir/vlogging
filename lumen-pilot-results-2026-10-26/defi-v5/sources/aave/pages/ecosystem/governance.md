# Governance

The Aave DAO is a decentralised collective of AAVE token holders and contributors who work together to shape the future of the protocol through a structured governance process. This community-driven model enables participants to propose, discuss, and vote on critical changes, guiding the evolution of the protocol and aligning with the collective goals of its members.

The Aave Protocol is governed by the AAVE token holder community (AAVE, stkAAVE, and aAAVE token holders on **Ethereum mainnet**) through procedures, voting, and smart contract execution, collectively known as **Aave Governance**.

[Aave Governance v3](https://github.com/aave-dao/aave-governance-v3) introduces the ability to vote on lower transaction fee networks such as Avalanche C-Chain while token balances remain on Ethereum mainnet.

## Architecture

Aave Governance v3 is designed with a modular architecture to meet the comprehensive needs of an on-chain DAO like Aave. The system is divided into three main components, each corresponding to different stages in the proposal lifecycle:

- **Core Network**: Acts as the settlement and security layer where voting power resides. It handles high-level validations on proposals and manages governance token balances. Ethereum Mainnet serves as the Core Network.
- **Voting Networks**: Environments where voting occurs based on storage proofs. These networks are typically lower-cost environments like Polygon POS and Avalanche C-Chain, enabling users to vote without migrating funds from the Core Network.
- **Execution Networks**: Networks where proposal payloads are registered and executed. They handle the execution of approved proposals across various networks, including all Voting Networks and the Core Network.

Communication between these components is facilitated by the [Aave Delivery Infrastructure](https://github.com/aave-dao/aave-delivery-infrastructure) (a.DI), providing secure and efficient cross-chain interactions. Additionally, the [Aave Robot](https://github.com/aave-dao/aave-robots-cre) automates permissionless actions in Aave Governance such as queueing and executing proposals.

## Processes

Aave's governance process is structured so that the protocol remains decentralised, secure, and adaptable. The lifecycle of a proposal is carefully designed to allow community members to present ideas, vote on them, and implement approved changes through a transparent, structured process, as an AAVE, stkAAVE, or aAAVE delegate.

Every type of governance action falls into one of three processes, based on who implements it:

- **Standard Process**: The default process. It consists of an ARFC governance proposal, a Snapshot vote, and an onchain vote to implement the upgrade. The Short Executor implements the vast majority of AIPs, with the Long Executor reserved for major upgrades. The full process takes 13 days.
- **Direct-to-AIP Process**: A refined onchain voting process that lets simple parameter adjustments, not otherwise performed by Stewards, be implemented quickly.
- **Steward Process**: High-cadence operational updates implemented by service providers within a tightly controlled, limited-access, and bounded environment.

As Steward roles are introduced, a growing share of routine upgrades shifts from the Direct-to-AIP process to the Steward Process. Token holders retain key decision-making power and delegate daily operations to trusted actors who operate the Steward roles.

### Standard Process

1. **Governance Forum**
   The proposal process begins with an idea introduced to the [Aave Governance Forum](https://governance.aave.com). The process starts with a business case that determines whether a new asset or market should be deployed.
2. **ARFC (Aave Request for Comments)**
   Service providers and community members provide detailed feedback over a 4-day period on how the proposal would affect the protocol, preparing it for the AIP stage. The ARFC is followed by a binding vote in the [Aave Snapshot Space](https://snapshot.org/#/aave.eth). If the proposal meets the Snapshot threshold, it proceeds to the AIP stage; otherwise, it fails.
3. **AIP (Aave Improvement Proposal)**
   The AIP stage is where the proposal becomes a formal, onchain submission. It includes two parts: metadata (stored on IPFS) and the contract payload. These are submitted through Aave's governance contracts, primarily on Ethereum Mainnet.
4. **Voting**
   Once onchain, the AIP is voted on through Aave's governance contracts. A proposal succeeds if it meets quorum and the vote differential requirements. See [Voting](#voting) for details.
5. **Execution**
   A successful proposal moves to the execution phase, where it is enacted via Aave's governance infrastructure. Depending on the type of proposal, a timelock delay (either 1 day or 7 days) is imposed before the changes are implemented. Cross-chain proposals are executed using Aave's Delivery Infrastructure (a.DI).

The ARFC vote is binding. This allows the Aave DAO to make commitments before deploying technical resources for larger initiatives, such as deploying Aave Protocol instances, entering new markets within an existing instance, or committing to payment upon delivery of work scopes.

#### Long Executor

The Long Executor (Level 2) governs the most sensitive parts of the protocol, those that define governance itself. It controls upgrades to the AAVE, stkAAVE, and aAAVE tokens, changes to the governance contracts and their permissions, and modifications to the executors and timelocks themselves. In short, it covers any change that could affect voting or proposition power.

Because these changes carry the highest impact, the Long Executor applies stricter requirements than the Short Executor (Level 1), which handles day-to-day protocol matters such as asset listings, parameter updates, and treasury operations. A Level 2 proposal runs a longer 10-day voting period, requires a higher quorum and vote differential, and passes through a 7-day timelock before execution, compared with the 3-day vote and 1-day timelock of a Level 1 proposal.

### Direct-to-AIP Process

The Direct-to-AIP process is a streamlined 2-step process: a forum post followed by an AIP. By removing the Snapshot vote, it shortens governance by 4 days and reduces governance burden. It is intended to expedite minor changes and can only be proposed by active Aave DAO Service Providers.

An active Service Provider can submit a Direct-to-AIP proposal that addresses one of the following areas:

- Existing asset listing
- Existing asset parameter update (excluding parameters controlled by Stewards)
- Existing rolling maturity asset listing (e.g., Pendle PTs)
- Emission Manager updates
- Funding updates
- Whitelisting flashloan borrowers (remove fee)
- Technical maintenance
- Whitelisting addresses to claim rewards
- Extending SVR integrations to new instances or assets
- Creating new hubs and spokes on Aave V4 with existing assets
- Risk parameters not amendable by the Steward role

### Steward Process

Stewards assist the DAO in mitigating risk by making controlled, incremental exposure adjustments and responding quickly to changing market conditions without the delay of the full governance process. See [Stewards](#stewards) for the current set of Steward contracts.

### Proposal Frameworks

Aave has predefined frameworks for common types of proposals, simplifying the governance process:

- **Asset Onboarding Framework**: Standardised lifecycle for onboarding new assets to the protocol, providing a structured process for risk assessments and community discussions. Assets are prioritised by verifiable demand, credible commitments, and strategic fit with the wider Aave business, and are onboarded only once they meet the DAO's risk and technical standards.
- **New Network Deployment Framework**: A transparent approach to evaluating and deploying new instances of the Aave Protocol, weighing the network's liquidity potential, GHO utility, revenue and integration commitments, and partner distribution.
- **Direct-to-AIP Framework**: Enables non-controversial, precise parameter updates and routine operational matters to be implemented quickly, for parameters or access not supported by Steward roles.

Each proposal must satisfy the public criteria of the [Aave Risk Framework](https://governance.aave.com/) and the Technical Asset Listing Framework before it can advance.

#### New Asset Listing

New asset listings use the Standard Process and are expected to take 13 days. During the ARFC stage:

- **Business Case**: A recognised Service Provider (Aave Labs or TokenLogic) publishes the listing proposal on the governance forum, including the proposed initial market structure and parameters, how the asset fits the DAO's strategy, and any supporting commitments such as expected user deposits and debt, incentive budget, liquidity, and planned integrations.
- **Risk Analysis**: The Risk Service Provider, LlamaRisk, publishes a Risk Assessment covering market risk (volatility, liquidity, and secondary-market depth), historical performance, and asset-specific legal and compliance considerations. Refined parameters are incorporated into the original proposal. Any material finding, such as insufficient DEX liquidity, pauses the listing until it is resolved.
- **Technical Review**: The Technical Service Provider, Aave Labs, publishes a Technical Assessment covering the asset's contracts, oracle configuration, access controls, and dependencies, against the Technical Asset Listing Framework. Any finding that falls short of Aave's security standards pauses the listing until resolved.

New listing candidates must deposit at least $150 worth of the intended asset into the Aave Short Executor before the market goes live.

#### Existing Asset Listing

The Existing Asset framework applies only to assets already listed on the Aave Protocol. Extending an existing asset to another instance follows the Direct-to-AIP process and can take as little as 5 days. The same Business Case, Risk Analysis, and Technical Analysis requirements apply before an AIP is published, with Risk and Technical Service Providers commenting on the proposed parameters and highlighting concerns such as bridges and liquidity. The same $150 deposit requirement applies.

#### New Network Deployment

New network deployments follow the Standard Process. The initial ARFC presents the business case and overall strategy, details the initial assets to be listed, and proposes a tentative market configuration. Given the early stage of most networks, some risk considerations, such as DEX liquidity assessments, are based on commitments made ahead of launch.

A single ARFC Snapshot authorises the deployment and can trigger up to three separate onchain AIP votes:

1. **a.DI Path Activation**: Registers the Aave Delivery Infrastructure for the new network.
2. **CCIP GHO Lanes Activation**: Activates the GHO lane on Chainlink's CCIP.
3. **Aave Protocol Activation**: Brings the market live.

The a.DI and CCIP GHO Lanes votes are completed before the Protocol Activation AIP is published. A deployment without GHO omits the CCIP GHO Lanes vote. At least $150 worth of each listed asset must be deposited into the Aave Short Executor before the market goes live.

## Voting

Voting in the Aave DAO allows AAVE, stkAAVE, and aAAVE holders to participate directly or delegate their voting power to representatives. Voting takes place both off-chain and onchain.

#### Off-chain Voting (Snapshot)

Off-chain votes take place in the [Aave Snapshot Space](https://snapshot.org/#/aave.eth) and are binding on a proposal before it moves onchain. They allow token holders to participate without transaction fees, and enable the Aave DAO to make a public commitment to deliver something when there is a difference in timing or payment between when the commitment is made and when it is fulfilled.

- **Authors and proposition power**: To open a Snapshot vote, the author must be on the approved list of Authors for the Aave space, or hold at least 80,000 AAVE of proposition power. This filters spam while allowing recognised service providers and delegates to propose without holding a large balance.
- **Voting power**: Voting weight is the combined balance of AAVE, stkAAVE, and aAAVE that an address holds or has been delegated, measured at the snapshot block taken when the vote opens.
- **Timing and threshold**: Once submitted, a Snapshot enters a one-day voting delay, followed by a three-day voting period. A 320,000 AAVE threshold applies: if it is met, the proposal proceeds to the AIP stage; if not, the proposal fails.
- **Controller**: The Aave DAO Snapshot space is administered by the Aave Finance Committee SAFE `0x22740deBa78d5a0c24C58C740e3715ec29de1bFa`, while the Controller is configured to `0x9F8F33e0e22F747617654A50305e61AA9811070C`, held by Aave Labs as contingency.
- **Quorum-failure rule**: A proposal that fails the Snapshot vote due to a lack of quorum, rather than a rejecting majority, may reopen the Snapshot once without restarting from the ARFC stage.

#### Onchain Voting (Governance Interfaces)

Once a proposal reaches the AIP stage, onchain voting is required. Token holders, delegates, or delegators vote on proposals using their AAVE, stkAAVE, or aAAVE tokens through the [Aave Governance Portal](https://app.aave.com/governance) and other governance interfaces, including [Boardroom](https://boardroom.io/aave). With Governance v3, it is possible to vote across multiple chains and cast gasless votes.

The onchain voting process has four stages:

1. **Security review**: Security Service Providers review the proposal and payload to ensure they are not malicious and contain no errors that could put the protocol at risk.
2. **Voting delay**: If no issues are identified, the proposal moves onchain. A 1-day voting delay must pass before it becomes active.
3. **Voting period**: The proposal becomes active and available for voting for 3 days.
4. **Result and execution**: When voting ends, the proposal is either SUCCEEDED or FAILED, depending on whether it reached quorum and received a majority of YAE votes. A passed proposal's payload is queued with a 1-day timelock, after which it may be executed. If the proposal is not executed before the end of the 7-day grace period, it expires and must be deployed and voted on again from the start of the onchain voting process.

For a proposal to succeed, at least 320,000 AAVE, stkAAVE, or aAAVE must participate in the vote, and the winning option must receive at least 320,000 votes.

The process includes several safeguards:

- **Anti-spam brake**: The proposition power and whitelist gate at Snapshot submission.
- **Final token-holder brake**: The onchain AIP vote and the one-day timelock.
- **Malicious-proposal backstop**: The Governance Emergency Guardian retains its power to cancel.

In Governance v3, each proposal specifies a voting network and all voting for the proposal occurs on this network. The Governance v3 activation enables Polygon POS, Avalanche C-Chain, and Ethereum Mainnet (backup) as initial voting networks. Since voting can occur on multiple networks, this can create limitations for smart contract wallets that only exist on one network. To accommodate this, governance interfaces can be used to setup **voting representatives**, which allows a separate voting address to be designated for each network.

Voters do not need to migrate funds to the voting network, all governance token balances and delegations are still stored on Ethereum mainnet, and are validated on the voting network using storage proofs.

Voting is performed by calling the `submitVote()` function on the `VotingMachine` of the corresponding proposal’s voting network.

An [aave-cli](https://github.com/aave-dao/aave-cli/blob/main/README.md) has been developed to generate the necessary storage proof parameters, or voting can be performed with the [GovernanceV3Helpers](https://github.com/aave-dao/aave-helpers?tab=readme-ov-file#govv3helpers) Foundry script.

### Voting Power

AAVE, stkAAVE (AAVE staked in protocol safety module), and aAAVE (aToken representing AAVE supplied to Ethereum v3 market) token holders receive governance powers proportional to the sum of their balances on Ethereum mainnet.

There are two powers associated with each governance token:

- The **proposal power** that gives access to creating a proposal.
- The **voting power** which is used to vote for or against active proposals.

Governance powers can be either jointly or separately delegated to any Ethereum address.

### Voting Representatives

Smart contract wallets cannot sign messages for storage proof voting and may not exist on all networks, this creates a challenge to interact with the cross-chain voting contracts.

To accommodate cross-chain voting for smart contract wallets and allow greater flexibility for all governance participants, wallets have the ability to link a representative address on other chains.

To choose a representative, an address in Ethereum should call the `updateRepresentativesPerChain()` function on the `GovernanceCore` smart contract.

This representative address is able to vote on the specified network, using the delegators balances and received delegations on Ethereum Mainnet. An address can be the representative of multiple other addresses.

### Storage Proofs

Aave Governance v3 uses block hashes on the Core network (Ethereum Mainnet) as the source of information for voting balances, and storage proofs as the core mechanism for validation.

For any proposal, the system takes a “snapshot” (block hash of the block before `activateVote` method gets called) of voting token balances/delegations on the Core network, forwards it to an Aave Voting Network and sets it as the main source of balances/delegation to validate against whenever an address submits a vote there.

Ethereum block hashes contain the state tree of the network, which in turn contains all the data of all the smart contracts at that exact block. Amongst those contracts: AAVE, stkAAVE, and other voting assets are present, and within them, the balances and delegations of all Ethereum addresses.

Storage proofs are a mechanism allowing to cryptographically prove that a piece of data is contained in a tree. In this case, they allow proving that a specific address has voting balance/delegation on the state tree of an Ethereum block.

What happens in practice when an address votes is that the voter inputs the balance of the voting assets they hold at the proposal's Ethereum block, together with a storage proof over the Ethereum block hash for that proposal. The Voting Network then cryptographically verifies the storage proof against the Ethereum block data, along with all additional validations (e.g., no double-voting), and stores the results accordingly.

## Onchain Proposal Lifecycle

1. **Payload Registration**: Proposal payloads containing executable logic are deployed and registered on the `PayloadsController` of the target Execution Network. This process is permissionless.

2. **Proposal Creation**: A proposer with sufficient proposal power creates the proposal on the Core Network (Ethereum Mainnet) by interacting with the `Governance` contract. The proposer specifies the payload IDs and target networks.

3. **Proposal Activation**: After a cooldown period (`coolDownBeforeVotingStart`), the proposal is activated. This involves taking a snapshot of the Core Network's state and forwarding it to the specified Voting Network using a.DI.

4. **Voting Setup**: On the Voting Network, the necessary data (Ethereum block hash, state tree, voting asset roots) is settled in the `DataWarehouse` contract. This step is permissionless and can be performed by any address.

5. **Voting Period**: Voting occurs on the Voting Network. Voters submit their votes by calling `submitVote()` on the `VotingMachine`, providing their token balances at the snapshot block along with storage proofs.

6. **Vote Closure**: After the voting duration (`votingDuration`) elapses, voting is closed. The `VotingMachine` contract sends the voting results (YES and NO counts) back to the Core Network via a.DI.

7. **Result Validation**: The `Governance` contract on the Core Network validates the voting results against success metrics, such as minimum thresholds and vote differentials.

8. **Proposal Queuing**: If the proposal meets the success criteria, it is forwarded to the `PayloadsController` on the Execution Network, where it is queued in a timelock mechanism.

9. **Proposal Execution**: After the timelock expires, any address can execute the proposal by calling `executePayload()` on the `PayloadsController`, which forwards it to the appropriate `Executor` for execution.

## Community

### Delegates

Delegates are community members who have received voting power from other community members or through self-delegation. They actively participate in governance by voting on proposals on behalf of those who have entrusted them with their voting power. Delegates are not compensated.

### Delegators

Delegators are community members who hold AAVE, stkAAVE, or aAAVE tokens but choose to delegate their voting power to another individual or entity. This allows them to have their interests represented in governance without directly participating in every vote.

### Contributors

Contributors dedicate time and resources to the Aave DAO by engaging in working groups, completing bounties, building on the protocol, or working through grants. These efforts help maintain and improve the Aave ecosystem.

### Service Providers

Service providers are specialised entities or groups that offer essential services to maintain and enhance the Aave Protocol. The current service providers are:

- LlamaRisk (risk service provider)
- Certora (security service provider)
- TokenLogic (finance and growth service provider)
- Aave Labs (development and growth service provider)

### Guardians

The Aave Guardians safeguard the protocol and the integrity of its governance. They operate as two independent multisigs with distinct mandates: the Protocol Emergency Guardian, which can pause markets and act in a protocol emergency, and the Governance Emergency Guardian, which can cancel malicious or erroneous governance proposals.

Across the DAO's emergency and treasury SAFEs, individual signer identities are increasingly withheld and held within organisation-controlled nested SAFEs, a deliberate practice to reduce attack surface.

#### Protocol Emergency Guardian

The Protocol Emergency Guardian holds the `EMERGENCY_ADMIN` role in Aave V3 and equivalent roles in V2 and related systems, and is the failsafe emergency actor for cross-chain messaging in Emergency Mode. Its purpose is to act quickly in an emergency to protect the protocol, for example by pausing a market.

The Protocol Emergency Guardian is a 4 of 7 [multi-signature wallet](https://etherscan.io/address/0x2CFe3ec4d5a6811f4B8067F0DE7e47DfA938Aa30) consisting of the following signers:

- 0x4Ab2Bed1d667260dB34244Ba412817651C2dD52b
- 0xc2674C1A1aF0557E1d217fF4F13DF44A637c7C13
- 0xe6838d834674eC35EDd53D485770Baa10bdd6AAe
- 0xb291232F480F41c75802C4a60F1D2AC03404Afef
- 0xd4af2E86a27F8F77B0556E081F97B215C9cA8f2E
- 0xa2DCdD6e0b5e0d118E2Fa8922552AC0Fe26EFe58
- 0x3fa960f8355D00874D9C7E3350147f5E94859bc2

#### Governance Emergency Guardian

The Governance Emergency Guardian cancels governance proposals detected as malicious or containing errors, typically identified during the onchain verification stage by Certora. Speed is less critical for this role, since governance proposals unfold over several days, allowing adequate time for issues to be identified and addressed.

The Governance Emergency Guardian is a 4 of 7 [multi-signature wallet](https://etherscan.io/address/0xCe52ab41C40575B072A18C9700091Ccbe4A06710) consisting of the following signers:

- 0x61C2dAE896f93e5f0f10425914CE7868eE8A0e44
- 0x2694B8A8490f10f98Da6F83d18267Eae9412CbF1
- 0x1e3804357eD445251FfECbb6e40107bf03888885
- 0xb291232F480F41c75802C4a60F1D2AC03404Afef
- 0xDA5Ae43e179987a66B9831F92223567e1F38BE7D
- 0x985F3290d7971a840152E46d00b5ceb60A56f235
- 0x9EF7c9A17c5881d54A4694785637acD93E790403
- 0x4f96743057482a2E10253AFDacDA3fd9CF2C1DC9
- 0xA3103D0ED00d24795Faa2d641ACf6A320EeD7396

### Stewards

Stewards enable high-cadence operational updates within tightly controlled bounds. Each steward is a DAO-owned contract with delegated authority over a narrow set of parameters or operations, bounded in magnitude and frequency by hard-coded and governance-set limits. Governance owns every steward and can revoke it at any time. The current stewards span risk parameters, the GHO stablecoin, treasury and finance operations, cross-chain bridging (in development), bad-debt maintenance, and oracle migration. The source code for GHO Steward contracts can be found on [GitHub](https://github.com/aave/gho-core/tree/main/src/contracts/misc).

#### GHO Stewards

The current design is GHO Steward v2, a set of four modular contracts. Each is gated by a one-day timelock and a maximum change per update, and is callable only by the GHO Risk Council multisig `0x8513e6F37dBc52De87b166980Fa3F50639694B60`, whose signers are TokenLogic, LlamaRisk, and Aave Labs.

| Steward            | Scope                                                                                                                                                                                                                        | Cooldown                 | Address                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------- |
| GHO Aave Steward   | GHO borrow and supply caps (up to +100% per update); optimal usage, base rate, slope 1, and slope 2 (each ±500 bps per update), with a borrow-rate ceiling of 25% APR. Cannot change collateral parameters, the oracle, or any non-GHO reserve. | 1 day per parameter      | `0x98217A06721Ebf727f2C8d9aD7718ec28b7aAe34` |
| GHO Bucket Steward | Facilitator bucket capacities (up to +100% per update), only for facilitators on its controlled list.                                                                                                                        | 1 day per facilitator    | `0x46Aa1063e5265b43663E81329333B47c517A5409` |
| GHO GSM Steward    | GSM exposure cap (up to ±100% per update) and buy and sell fees (up to ±0.50% per update). Freeze, unfreeze, and price-strategy changes require governance.                                                                    | 1 day per GSM, parameter | `0xD1E856a947CdF56b4f000ee29d34F5808E0A6848` |
| GHO CCIP Steward   | Chainlink CCIP bridge limit and inbound and outbound rate limits (each ±100% per update).                                                                                                                                    | 1 day per parameter      | `0xC5BcC58BE6172769ca1a78B8A45752E3C5059c39` |

#### Risk Stewards

Risk Stewards manage risk parameters within bounds defined by the Aave Risk Framework. They may tighten or calibrate only within these limits; loosening beyond them or releasing a freeze requires governance. The manual Risk Steward is operated by LlamaRisk together with Aave Labs, with a progressive migration to Chainlink Runtime Environment (CRE) automation. The Aave DAO retains full control of the automation.

The **Risk Steward** can adjust supply and borrow caps, collateral parameters (LTV, liquidation threshold, liquidation bonus), interest-rate parameters, CAPO price-cap and Pendle discount parameters, and e-mode collateral parameters. It cannot set caps, LTV, LT, or liquidation bonus to zero, change an e-mode's isolated flag or label, or act on restricted assets and oracles (for example, GHO on Ethereum).

| Parameter                | Max change per update | Minimum delay | Pending change (ARFC) |
| ------------------------ | --------------------- | ------------- | --------------------- |
| LTV, LT, LB              | 0.5% absolute         | 72 hours      | -                     |
| E-mode LTV, LB           | 0.5% absolute         | 72 hours      | -                     |
| E-mode LT                | 0.1% absolute         | 72 hours      | -                     |
| Base rate, Slope 1       | 1% absolute           | 72 hours      | 36h                   |
| Slope 2                  | 20% absolute          | 72 hours      | 36h                   |
| Optimal usage ratio      | 3% absolute           | 72 hours      | 36h                   |
| Supply and borrow caps   | 100% relative         | 72 hours      | 36h                   |
| CAPO dynamic cap         | 5% relative           | 72 hours      | -                     |
| CAPO stable cap          | 0.5% relative         | 72 hours      | -                     |
| PT discount rate         | 2.5% absolute         | 48 hours      | -                     |

The **Freezing Steward** can freeze a reserve immediately, blocking new supply and borrow while existing positions may still repay and withdraw. It cannot unfreeze; that requires governance.

#### Finance Stewards

Finance Stewards execute pre-approved, budgeted treasury operations on behalf of the DAO through contracts that act as admins of the Collector, without a full onchain vote. They are operated by the Aave Finance Committee (AFC), the 2 of 3 organisation-controlled multisig `0x22740deBa78d5a0c24C58C740e3715ec29de1bFa`. The DAO retains ownership and can revoke the role.

- **Mainnet Swap Steward** (live): Executes treasury token swaps via CoW Protocol with a Chainlink oracle price check and slippage bounds, supporting market, limit, and TWAP orders, as well as cancellation. It can only swap into DAO-whitelisted tokens, within per-token budgets, and proceeds always return to the Collector. Address: `0xb7D402138Cb01BfE97d95181C849379d6AD14d19`.
- **Pool Exposure Steward** (live): Migrates assets from Aave V2 to V3, and deposits or withdraws Collector funds within Aave V3. It cannot move funds outside approved Aave pools or deplete a reserve below its minimum floor. Address: `0x22aC12a6937BBBC0a301AF9154d08EaD95673122`.
- **Collector Budget Steward**: Transfers or streams Collector tokens to pre-approved recipients within DAO-defined budgets. It cannot send to non-whitelisted addresses or exceed a budget.
- **Rewards Steward** (live): Claims liquidity-mining and Merit rewards accrued to the Collector and forwards them to the Collector. It holds no discretionary transfer power and must first be granted claim rights by the Emission Manager.
- **Bridge Stewards** (in development): A family of per-route stewards (Polygon, Arbitrum, Optimism, plus CCTP and LayerZero routes) that will move Collector funds cross-chain back to the Ethereum Collector without a full a.DI governance vote. Operators will be set at deployment.

#### Maintenance Stewards

- **Clinic Steward** (live): Batch-liquidates dust and underwater positions and repays accumulated bad debt, funded from the Collector, within a fixed USD budget cap that only an admin can raise. Address: `0xf00E2de0E78DFf055A92AD4719a179CE275b6Ef7`.
- **Deficit Offset Clinic Steward** (live): The Umbrella-linked sibling of the Clinic Steward, used to offset reserve deficits through Umbrella's deficit-elimination flow. Address: `0x6c1DC85f2aE71C3DAcd6E44Bb57DEeF61b540a5A`.
- **SVR Oracle Steward** (live): Migrates an asset to a Chainlink Smart Value Recapture (SVR) price feed only when its deviation from the current feed is minimal, and lets the Protocol Guardian revert to the previous feed if needed. Address: `0x8b493f416F5F7933cC146b1899c069F2361cad60`.

#### Horizon

Horizon is configured through a delegated model rather than standard governance. The Executive role is assigned to Aave Labs, which manages day-to-day risk parameters, asset listings, oracle configuration, and supply and borrow caps directly, without an AIP vote for each change. The Aave DAO retains ownership of the contracts and controls upgrades, and still configures the GHO facilitator and credit line by governance vote.

## Deployed Contracts

### Ethereum

| Name                    | Address                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| CrossChainController    | [0xEd42a7D8559a463722Ca4beD50E0Cc05a386b0e1](https://etherscan.io/address/0xEd42a7D8559a463722Ca4beD50E0Cc05a386b0e1) |
| Governance              | [0x9AEE0B04504CeF83A65AC3f0e838D0593BCb2BC7](https://etherscan.io/address/0x9AEE0B04504CeF83A65AC3f0e838D0593BCb2BC7) |
| PayloadsController      | [0xdAbad81aF85554E9ae636395611C58F7eC1aAEc5](https://etherscan.io/address/0xdAbad81aF85554E9ae636395611C58F7eC1aAEc5) |
| VotingMachine           | [0x617332a777780F546261247F621051d0b98975Eb](https://etherscan.io/address/0x617332a777780F546261247F621051d0b98975Eb) |
| VotingPortalEthEth      | [0xf23f7De3AC42F22eBDA17e64DC4f51FB66b8E21f](https://etherscan.io/address/0xf23f7De3AC42F22eBDA17e64DC4f51FB66b8E21f) |
| VotingPortalEthAvax     | [0x33aCEf7365809218485873B7d0d67FeE411B5D79](https://etherscan.io/address/0x33aCEf7365809218485873B7d0d67FeE411B5D79) |
| VotingPortalEthPol      | [0x9b24C168d6A76b5459B1d47071a54962a4df36c3](https://etherscan.io/address/0x9b24C168d6A76b5459B1d47071a54962a4df36c3) |
| PayloadDataHelper       | [0xE3B770Dc4ae3f8bECaB3Ed12dE692c741603e16A](https://etherscan.io/address/0xE3B770Dc4ae3f8bECaB3Ed12dE692c741603e16A) |
| GovernanceDataHelper    | [0x971c82c8316aD611904F95616c21ce90837f1856](https://etherscan.io/address/0x971c82c8316aD611904F95616c21ce90837f1856) |
| VotingDataHelper        | [0x77976B51569896523EE215962Ee91ff236Fa50E8](https://etherscan.io/address/0x77976B51569896523EE215962Ee91ff236Fa50E8) |
| MetaDelegateHelper      | [0x94363B11b37BC3ffe43AB09cff5A010352FE85dC](https://etherscan.io/address/0x94363B11b37BC3ffe43AB09cff5A010352FE85dC) |
| EmergencyRegistry       | [0x73C6Fb358dDA8e84D50e98A98F7c0dF32e15C7e9](https://etherscan.io/address/0x73C6Fb358dDA8e84D50e98A98F7c0dF32e15C7e9) |
| GovernancePowerStrategy | [0xa198Fac58E02A5C5F8F7e877895d50cFa9ad1E04](https://etherscan.io/address/0xa198Fac58E02A5C5F8F7e877895d50cFa9ad1E04) |
| GranularGuardian        | [0x4457cA11E90f416Cc1D3a8E1cA41C0cdEcC251d4](https://etherscan.io/address/0x4457cA11E90f416Cc1D3a8E1cA41C0cdEcC251d4) |
| ExecutorLvl1            | [0x5300A1a15135EA4dc7aD5a167152C01EFc9b192A](https://etherscan.io/address/0x5300A1a15135EA4dc7aD5a167152C01EFc9b192A) |
| ExecutorLvl2            | [0x17Dd33Ed0e3dD2a80E37489B8A63063161BE6957](https://etherscan.io/address/0x17Dd33Ed0e3dD2a80E37489B8A63063161BE6957) |
| VotingStrategy          | [0x5642A5A5Ec284B4145563aBF319620204aCCA7f4](https://etherscan.io/address/0x5642A5A5Ec284B4145563aBF319620204aCCA7f4) |
| DataWarehouse           | [0x1699FE9CaDC8a0b6c93E06B62Ab4592a0fFEcF61](https://etherscan.io/address/0x1699FE9CaDC8a0b6c93E06B62Ab4592a0fFEcF61) |
| V4 Security Council | [0x187AAE17d4931310B3fc75743e7F16Bdc9eD77e9](https://etherscan.io/address/0x187AAE17d4931310B3fc75743e7F16Bdc9eD77e9) |

### Arbitrum

| Name                 | Address                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| CrossChainController | [0xCbFB78a3Eeaa611b826E37c80E4126c8787D29f0](https://arbiscan.io/address/0xCbFB78a3Eeaa611b826E37c80E4126c8787D29f0) |
| PayloadsController   | [0x89644CA1bB8064760312AE4F03ea41b05dA3637C](https://arbiscan.io/address/0x89644CA1bB8064760312AE4F03ea41b05dA3637C) |
| PayloadDataHelper    | [0xE3B770Dc4ae3f8bECaB3Ed12dE692c741603e16A](https://arbiscan.io/address/0xE3B770Dc4ae3f8bECaB3Ed12dE692c741603e16A) |
| GranularGuardian     | [0x4922093c476CfbCF903C7C4082d2D64bAE8A37cE](https://arbiscan.io/address/0x4922093c476CfbCF903C7C4082d2D64bAE8A37cE) |
| ExecutorLvl1         | [0xFF1137243698CaA18EE364Cc966CF0e02A4e6327](https://arbiscan.io/address/0xFF1137243698CaA18EE364Cc966CF0e02A4e6327) |

### Avalanche

| Name                 | Address                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| CrossChainController | [0x27FC7D54C893dA63C0AE6d57e1B2B13A70690928](https://snowtrace.io/address/0x27FC7D54C893dA63C0AE6d57e1B2B13A70690928) |
| EmergencyOracle      | [0x41185495Bc8297a65DC46f94001DC7233775EbEe](https://snowtrace.io/address/0x41185495Bc8297a65DC46f94001DC7233775EbEe) |
| VotingMachine        | [0x9b6f5ef589A3DD08670Dd146C11C4Fb33E04494F](https://snowtrace.io/address/0x9b6f5ef589A3DD08670Dd146C11C4Fb33E04494F) |
| PayloadsController   | [0x1140CB7CAfAcC745771C2Ea31e7B5C653c5d0B80](https://snowtrace.io/address/0x1140CB7CAfAcC745771C2Ea31e7B5C653c5d0B80) |
| PayloadDataHelper    | [0xE3B770Dc4ae3f8bECaB3Ed12dE692c741603e16A](https://snowtrace.io/address/0xE3B770Dc4ae3f8bECaB3Ed12dE692c741603e16A) |
| VotngDataHelper      | [0x77976B51569896523EE215962Ee91ff236Fa50E8](https://snowtrace.io/address/0x77976B51569896523EE215962Ee91ff236Fa50E8) |
| GranularGuardian     | [0xc1162BCb2E5E3ca4725512008c7522dF8C8B7B65](https://snowtrace.io/address/0xc1162BCb2E5E3ca4725512008c7522dF8C8B7B65) |
| ExecutorLvl1         | [0x3C06dce358add17aAf230f2234bCCC4afd50d090](https://snowtrace.io/address/0x3C06dce358add17aAf230f2234bCCC4afd50d090) |
| VotingStrategy       | [0x690C218668B440204F369Af1541245d367cc805C](https://snowtrace.io/address/0x690C218668B440204F369Af1541245d367cc805C) |
| DataWarehouse        | [0x9626F9d60CC0B7e1c9a0A47b7f0bd618fb6f40ff](https://snowtrace.io/address/0x9626F9d60CC0B7e1c9a0A47b7f0bd618fb6f40ff) |
| V4 Security Council | [0x187AAE17d4931310B3fc75743e7F16Bdc9eD77e9](https://snowscan.xyz/address/0x187AAE17d4931310B3fc75743e7F16Bdc9eD77e9) |

### BNB

| Name                 | Address                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| CrossChainController | [0x9d33ee6543C9b2C8c183b8fb58fB089266cffA19](https://bscscan.com/address/0x9d33ee6543C9b2C8c183b8fb58fB089266cffA19) |
| EmergencyOracle      | [0xcabb46FfB38c93348Df16558DF156e9f68F9F7F1](https://bscscan.com/address/0xcabb46FfB38c93348Df16558DF156e9f68F9F7F1) |
| PayloadsController   | [0xE5EF2Dd06755A97e975f7E282f828224F2C3e627](https://bscscan.com/address/0xE5EF2Dd06755A97e975f7E282f828224F2C3e627) |
| PayloadDataHelper    | [0xE3B770Dc4ae3f8bECaB3Ed12dE692c741603e16A](https://bscscan.com/address/0xE3B770Dc4ae3f8bECaB3Ed12dE692c741603e16A) |
| GranularGuardian     | [0xe4FB5e3F506BE0095f38004f993D16fdA8224383](https://bscscan.com/address/0xe4FB5e3F506BE0095f38004f993D16fdA8224383) |
| ExecutorLvl1         | [0x9390B1735def18560c509E2d0bc090E9d6BA257a](https://bscscan.com/address/0x9390B1735def18560c509E2d0bc090E9d6BA257a) |

### Base

| Name                 | Address                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| CrossChainController | [0x529467C76f234F2bD359d7ecF7c660A2846b04e2](https://basescan.org/address/0x529467C76f234F2bD359d7ecF7c660A2846b04e2) |
| PayloadsController   | [0x2DC219E716793fb4b21548C0f009Ba3Af753ab01](https://basescan.org/address/0x2DC219E716793fb4b21548C0f009Ba3Af753ab01) |
| PayloadDataHelper    | [0xE3B770Dc4ae3f8bECaB3Ed12dE692c741603e16A](https://basescan.org/address/0xE3B770Dc4ae3f8bECaB3Ed12dE692c741603e16A) |
| GranularGuardian     | [0xa1c6aF35E0205f42256382C05243C543FEDBf4bB](https://basescan.org/address/0xa1c6aF35E0205f42256382C05243C543FEDBf4bB) |
| ExecutorLvl1         | [0x9390B1735def18560c509E2d0bc090E9d6BA257a](https://basescan.org/address/0x9390B1735def18560c509E2d0bc090E9d6BA257a) |

### BNB Chain

| Name                 | Address                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| CrossChainController | [0x9d33ee6543C9b2C8c183b8fb58fB089266cffA19](https://bscscan.com/address/0x9d33ee6543C9b2C8c183b8fb58fB089266cffA19) |
| EmergencyOracle      | [0xcabb46FfB38c93348Df16558DF156e9f68F9F7F1](https://bscscan.com/address/0xcabb46FfB38c93348Df16558DF156e9f68F9F7F1) |
| PayloadsController   | [0xE5EF2Dd06755A97e975f7E282f828224F2C3e627](https://bscscan.com/address/0xE5EF2Dd06755A97e975f7E282f828224F2C3e627) |
| PayloadDataHelper    | [0xE3B770Dc4ae3f8bECaB3Ed12dE692c741603e16A](https://bscscan.com/address/0xE3B770Dc4ae3f8bECaB3Ed12dE692c741603e16A) |
| ExecutorLvl1         | [0x9390B1735def18560c509E2d0bc090E9d6BA257a](https://bscscan.com/address/0x9390B1735def18560c509E2d0bc090E9d6BA257a) |

### Gnosis

| Name                 | Address                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| CrossChainController | [0x8Dc5310fc9D3D7D1Bb3D1F686899c8F082316c9F](https://gnosisscan.io/address/0x8Dc5310fc9D3D7D1Bb3D1F686899c8F082316c9F) |
| EmergencyOracle      | [0xF937ffAeA1363e4Fa260760bDFA2aA8Fc911F84D](https://gnosisscan.io/address/0xF937ffAeA1363e4Fa260760bDFA2aA8Fc911F84D) |
| PayloadsController   | [0x9A1F491B86D09fC1484b5fab10041B189B60756b](https://gnosisscan.io/address/0x9A1F491B86D09fC1484b5fab10041B189B60756b) |
| PayloadDataHelper    | [0xF1c11BE0b4466728DDb7991A0Ac5265646ec9672](https://gnosisscan.io/address/0xF1c11BE0b4466728DDb7991A0Ac5265646ec9672) |
| GranularGuardian     | [0x4A9F571E3C1f2F13567bb59e38988e74d7d72602](https://gnosisscan.io/address/0x4A9F571E3C1f2F13567bb59e38988e74d7d72602) |
| ExecutorLvl1         | [0x1dF462e2712496373A347f8ad10802a5E95f053D](https://gnosisscan.io/address/0x1dF462e2712496373A347f8ad10802a5E95f053D) |

### Metis

| Name                 | Address                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| CrossChainController | [0x6fDaFb26915ABD6065a1E1501a37Ac438D877f70](https://explorer.metis.io/address/0x6fDaFb26915ABD6065a1E1501a37Ac438D877f70) |
| PayloadsController   | [0x2233F8A66A728FBa6E1dC95570B25360D07D5524](https://explorer.metis.io/address/0x2233F8A66A728FBa6E1dC95570B25360D07D5524) |
| PayloadDataHelper    | [0x81d32B36380e6266e1BDd490eAC56cdB300afBe0](https://explorer.metis.io/address/0x81d32B36380e6266e1BDd490eAC56cdB300afBe0) |
| GranularGuardian     | [0x61BE97d3a0550549f67CA7421725fA73Fa2036B5](https://explorer.metis.io/address/0x61BE97d3a0550549f67CA7421725fA73Fa2036B5) |
| ExecutorLvl1         | [0x6fD45D32375d5aDB8D76275A3932c740F03a8718](https://explorer.metis.io/address/0x6fD45D32375d5aDB8D76275A3932c740F03a8718) |

### Optimism

| Name                 | Address                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| CrossChainController | [0x48A9FE90bce5EEd790f3F4Ce192d1C0B351fd4Ca](https://optimistic.etherscan.io/address/0x48A9FE90bce5EEd790f3F4Ce192d1C0B351fd4Ca) |
| PayloadsController   | [0x0E1a3Af1f9cC76A62eD31eDedca291E63632e7c4](https://optimistic.etherscan.io/address/0x0E1a3Af1f9cC76A62eD31eDedca291E63632e7c4) |
| PayloadDataHelper    | [0xE3B770Dc4ae3f8bECaB3Ed12dE692c741603e16A](https://optimistic.etherscan.io/address/0xE3B770Dc4ae3f8bECaB3Ed12dE692c741603e16A) |
| GranularGuardian     | [0x6c5264C380C7022e54f585c4E354ffb6f221a03b](https://optimistic.etherscan.io/address/0x6c5264C380C7022e54f585c4E354ffb6f221a03b) |
| ExecutorLvl1         | [0x746c675dAB49Bcd5BB9Dc85161f2d7Eb435009bf](https://optimistic.etherscan.io/address/0x746c675dAB49Bcd5BB9Dc85161f2d7Eb435009bf) |

### Polygon

| Name                 | Address                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| CrossChainController | [0xF6B99959F0b5e79E1CC7062E12aF632CEb18eF0d](https://polygonscan.com/address/0xF6B99959F0b5e79E1CC7062E12aF632CEb18eF0d) |
| EmergencyOracle      | [0xDAFA1989A504c48Ee20a582f2891eeB25E2fA23F](https://polygonscan.com/address/0xDAFA1989A504c48Ee20a582f2891eeB25E2fA23F) |
| VotingMachine        | [0xc8a2ADC4261c6b669CdFf69E717E77C9cFeB420d](https://polygonscan.com/address/0xc8a2ADC4261c6b669CdFf69E717E77C9cFeB420d) |
| PayloadsController   | [0x401B5D0294E23637c18fcc38b1Bca814CDa2637C](https://polygonscan.com/address/0x401B5D0294E23637c18fcc38b1Bca814CDa2637C) |
| PayloadDataHelper    | [0xE3B770Dc4ae3f8bECaB3Ed12dE692c741603e16A](https://polygonscan.com/address/0xE3B770Dc4ae3f8bECaB3Ed12dE692c741603e16A) |
| VotingDataHelper     | [0x77976B51569896523EE215962Ee91ff236Fa50E8](https://polygonscan.com/address/0x77976B51569896523EE215962Ee91ff236Fa50E8) |
| GranularGuardian     | [0x0D2CccD3dD420dC6DE2f24DB44aA22fADE290a02](https://polygonscan.com/address/0x0D2CccD3dD420dC6DE2f24DB44aA22fADE290a02) |
| ExecutorLvl1         | [0xDf7d0e6454DB638881302729F5ba99936EaAB233](https://polygonscan.com/address/0xDf7d0e6454DB638881302729F5ba99936EaAB233) |
| VotingStrategy       | [0x59e6CAD5d7E7b9A26a45a1d1E74C7aF008170042](https://polygonscan.com/address/0x59e6CAD5d7E7b9A26a45a1d1E74C7aF008170042) |
| DataWarehouse        | [0xf41193E25408F652AF878c47E4401A01B5E4B682](https://polygonscan.com/address/0xf41193E25408F652AF878c47E4401A01B5E4B682) |

### Scroll

| Name                 | Address                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| CrossChainController | [0x03073D3F4769f6b6604d616238fD6c636C99AD0A](https://scrollscan.com/address/0x03073D3F4769f6b6604d616238fD6c636C99AD0A) |
| PayloadsController   | [0x6b6B41c0f8C223715f712BE83ceC3c37bbfDC3fE](https://scrollscan.com/address/0x6b6B41c0f8C223715f712BE83ceC3c37bbfDC3fE) |
| PayloadDataHelper    | [0xf438e33dCCEE260ee4371F9dceF408b0d7DBe424](https://scrollscan.com/address/0xf438e33dCCEE260ee4371F9dceF408b0d7DBe424) |
| GranularGuardian     | [0xa835707d28e6C37C49d661742f2Fb5987367cEd4](https://scrollscan.com/address/0xa835707d28e6C37C49d661742f2Fb5987367cEd4) |
| ExecutorLvl1         | [0xc1ABF87FfAdf4908f4eC8dc54A25DCFEabAE4A24](https://scrollscan.com/address/0xc1ABF87FfAdf4908f4eC8dc54A25DCFEabAE4A24) |

### ZkSync

| Name                 | Address                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| CrossChainController | [0x800813f4714BC7A0a95310e3fB9e4f18872CA92C](https://era.zksync.network/address/0x800813f4714BC7A0a95310e3fB9e4f18872CA92C) |
| PayloadsController   | [0x2E79349c3F5e4751E87b966812C9E65E805996F1](https://era.zksync.network/address/0x2E79349c3F5e4751E87b966812C9E65E805996F1) |
| PayloadDataHelper    | [0xe28A3235DCF1Acb8397B546bd588bAAFD7081505](https://era.zksync.network/address/0xe28A3235DCF1Acb8397B546bd588bAAFD7081505) |
| GranularGuardian     | [0xe0e23196D42b54F262a3DE952e6B34B197D1A228](https://era.zksync.network/address/0xe0e23196D42b54F262a3DE952e6B34B197D1A228) |
| GovernanceGuardian   | [0x4257bf0746D783f0D962913d7d8AFA408B62547E](https://era.zksync.network/address/0x4257bf0746D783f0D962913d7d8AFA408B62547E) |
| ExecutorLvl1         | [0x04cE39789e11a49595cD0ECEf6f4Bd54ABF4d020](https://era.zksync.network/address/0x04cE39789e11a49595cD0ECEf6f4Bd54ABF4d020) |

### Linea

| Name                 | Address                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| CrossChainController | [0x0D3f821e9741C8a8Bcac231162320251Db0cdf52](https://lineascan.build/address/0x0D3f821e9741C8a8Bcac231162320251Db0cdf52) |
| PayloadsController   | [0x3BcE23a1363728091bc57A58a226CF2940C2e074](https://lineascan.build/address/0x3BcE23a1363728091bc57A58a226CF2940C2e074) |
| PayloadDataHelper    | [0x6d4F341d8Bb3Dc5ABe822Aa940F1884508C13f99](https://lineascan.build/address/0x6d4F341d8Bb3Dc5ABe822Aa940F1884508C13f99) |
| GranularGuardian     | [0xc1cd6faF6e9138b4e6C21d438f9ebF2bd6F6cA16](https://lineascan.build/address/0xc1cd6faF6e9138b4e6C21d438f9ebF2bd6F6cA16) |
| GovernanceGuardian   | [0x056E4C4E80D1D14a637ccbD0412CDAAEc5B51F4E](https://lineascan.build/address/0x056E4C4E80D1D14a637ccbD0412CDAAEc5B51F4E) |
| ExecutorLvl1         | [0x8c2d95FE7aeB57b86961F3abB296A54f0ADb7F88](https://lineascan.build/address/0x8c2d95FE7aeB57b86961F3abB296A54f0ADb7F88) |

### Soneium

| Name                 | Address                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| CrossChainController | [0xD92b37a5114b33F668D274Fb48f23b726a854d6E](https://soneium.blockscout.com/address/0xD92b37a5114b33F668D274Fb48f23b726a854d6E) |
| PayloadsController   | [0x44D73D7C4b2f98F426Bf8B5e87628d9eE38ef0Cf](https://soneium.blockscout.com/address/0x44D73D7C4b2f98F426Bf8B5e87628d9eE38ef0Cf) |
| PayloadDataHelper    | [0xd0929668178973d5994D5654929aCB3d6c2b9949](https://soneium.blockscout.com/address/0xd0929668178973d5994D5654929aCB3d6c2b9949) |
| GranularGuardian     | [0xD8E6956718784B914740267b7A50B952fb516656](https://soneium.blockscout.com/address/0xD8E6956718784B914740267b7A50B952fb516656) |
| GovernanceGuardian   | [0x19CE4363FEA478Aa04B9EA2937cc5A2cbcD44be6](https://soneium.blockscout.com/address/0x19CE4363FEA478Aa04B9EA2937cc5A2cbcD44be6) |
| ExecutorLvl1         | [0x47aAdaAE1F05C978E6aBb7568d11B7F6e0FC4d6A](https://soneium.blockscout.com/address/0x47aAdaAE1F05C978E6aBb7568d11B7F6e0FC4d6A) |

### Plasma

| Name                 | Address                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| CrossChainController | [0x643441742f73e270e565619be6DE5f4D55E08cd6](https://plasmascan.to/address/0x643441742f73e270e565619be6DE5f4D55E08cd6) |
| PayloadsController   | [0xe76EB348E65eF163d85ce282125FF5a7F5712A1d](https://plasmascan.to/address/0xe76EB348E65eF163d85ce282125FF5a7F5712A1d) |
| PayloadDataHelper    | [0xA806DA549FcB2B4912a7dFFE4c1aA7A1ed0Bd5C9](https://plasmascan.to/address/0xA806DA549FcB2B4912a7dFFE4c1aA7A1ed0Bd5C9) |
| GranularGuardian     | [0x60665b4F4FF7073C5fed2656852dCa271DfE2684](https://plasmascan.to/address/0x60665b4F4FF7073C5fed2656852dCa271DfE2684) |
| GovernanceGuardian   | [0x19CE4363FEA478Aa04B9EA2937cc5A2cbcD44be6](https://plasmascan.to/address/0x19CE4363FEA478Aa04B9EA2937cc5A2cbcD44be6) |
| EmergencyOracle      | [0xF61FE74Ec1cFbd9Ee8Bd27592D2EDEe0E2aA85Cf](https://plasmascan.to/address/0xF61FE74Ec1cFbd9Ee8Bd27592D2EDEe0E2aA85Cf) |
| ExecutorLvl1         | [0x47aAdaAE1F05C978E6aBb7568d11B7F6e0FC4d6A](https://plasmascan.to/address/0x47aAdaAE1F05C978E6aBb7568d11B7F6e0FC4d6A) |

### Monad

| Name                 | Address                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| CrossChainController | [0x8dd5b84b26ae3916A5Fb34C8968F93d206216b63](https://monadscan.com/address/0x8dd5b84b26ae3916A5Fb34C8968F93d206216b63) |
| PayloadsController   | [0x442CA936e5E6Db875357d0A16481145c96dd9a82](https://monadscan.com/address/0x442CA936e5E6Db875357d0A16481145c96dd9a82) |
| PayloadDataHelper    | [0xFBEa38C851B7B5A4626b0348aa2Db70921Cd3f92](https://monadscan.com/address/0xFBEa38C851B7B5A4626b0348aa2Db70921Cd3f92) |
| GranularGuardian     | [0xD3DD0bE957fcE2dCd359e09374Cbc99f60337D42](https://monadscan.com/address/0xD3DD0bE957fcE2dCd359e09374Cbc99f60337D42) |
| GovernanceGuardian   | [0x056E4C4E80D1D14a637ccbD0412CDAAEc5B51F4E](https://monadscan.com/address/0x056E4C4E80D1D14a637ccbD0412CDAAEc5B51F4E) |
| ExecutorLvl1         | [0xa9d0EAFF48cE1DF468f9eAeb7e628c413343F6A2](https://monadscan.com/address/0xa9d0EAFF48cE1DF468f9eAeb7e628c413343F6A2) |

### Celo

| Name                 | Address                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| CrossChainController | [0x50F4dAA86F3c747ce15C3C38bD0383200B61d6Dd](https://celoscan.io/address/0x50F4dAA86F3c747ce15C3C38bD0383200B61d6Dd) |
| EmergencyOracle      | [0x91b21900E91CD302EBeD05E45D8f270ddAED944d](https://celoscan.io/address/0x91b21900E91CD302EBeD05E45D8f270ddAED944d) |
| PayloadsController   | [0xE48E10834C04E394A04BF22a565D063D40b9FA42](https://celoscan.io/address/0xE48E10834C04E394A04BF22a565D063D40b9FA42) |
| PayloadDataHelper    | [0x8657Cd5a0957e8C5BE15c69C67078b5d730D720a](https://celoscan.io/address/0x8657Cd5a0957e8C5BE15c69C67078b5d730D720a) |
| GranularGuardian     | [0xbE815420A63A413BB8D508d8022C0FF150Ea7C39](https://celoscan.io/address/0xbE815420A63A413BB8D508d8022C0FF150Ea7C39) |
| GovernanceGuardian   | [0x056E4C4E80D1D14a637ccbD0412CDAAEc5B51F4E](https://celoscan.io/address/0x056E4C4E80D1D14a637ccbD0412CDAAEc5B51F4E) |
| ExecutorLvl1         | [0x1dF462e2712496373A347f8ad10802a5E95f053D](https://celoscan.io/address/0x1dF462e2712496373A347f8ad10802a5E95f053D) |

### Mantle

| Name                 | Address                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| CrossChainController | [0x1283C5015B1Fb5616FA3aCb0C18e6879a02869cB](https://mantlescan.xyz/address/0x1283C5015B1Fb5616FA3aCb0C18e6879a02869cB) |
| PayloadsController   | [0xF089f77173A3009A98c45f49D547BF714A7B1e01](https://mantlescan.xyz/address/0xF089f77173A3009A98c45f49D547BF714A7B1e01) |
| PayloadDataHelper    | [0x5e06b10B3b9c3E1c0996D2544A35B9839Be02922](https://mantlescan.xyz/address/0x5e06b10B3b9c3E1c0996D2544A35B9839Be02922) |
| GranularGuardian     | [0xb26670d2800DBB9cfCe2f2660FfDcA48C799c86d](https://mantlescan.xyz/address/0xb26670d2800DBB9cfCe2f2660FfDcA48C799c86d) |
| GovernanceGuardian   | [0x14816fC7f443A9C834d30eeA64daD20C4f56fBCD](https://mantlescan.xyz/address/0x14816fC7f443A9C834d30eeA64daD20C4f56fBCD) |
| ExecutorLvl1         | [0x70884634D0098782592111A2A6B8d223be31CB7b](https://mantlescan.xyz/address/0x70884634D0098782592111A2A6B8d223be31CB7b) |

### MegaEth

| Name                 | Address                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| CrossChainController | [0x5EE63ACb37AeCDc7e23ACA283098f8ffD9677BBe](https://mega.etherscan.io/address/0x5EE63ACb37AeCDc7e23ACA283098f8ffD9677BBe) |
| PayloadsController   | [0x80e11cB895a23C901a990239E5534054C66476B5](https://mega.etherscan.io/address/0x80e11cB895a23C901a990239E5534054C66476B5) |
| PayloadDataHelper    | [0x9fE056F44510F970d724adA16903ba5D75CC4742](https://mega.etherscan.io/address/0x9fE056F44510F970d724adA16903ba5D75CC4742) |
| GranularGuardian     | [0x8Fa22D09b13486A40cd6b04398b948AA8bD5853A](https://mega.etherscan.io/address/0x8Fa22D09b13486A40cd6b04398b948AA8bD5853A) |
| GovernanceGuardian   | [0x5a578ee1dA2c798Be60036AdDD223Ac164d948Af](https://mega.etherscan.io/address/0x5a578ee1dA2c798Be60036AdDD223Ac164d948Af) |
| ExecutorLvl1         | [0xE2E8Badc5d50f8a6188577B89f50701cDE2D4e19](https://mega.etherscan.io/address/0xE2E8Badc5d50f8a6188577B89f50701cDE2D4e19) |

### Sonic

| Name                 | Address                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| CrossChainController | [0x58e003a3C6f2Aeed6a2a6Bc77B504566523cb15c](https://sonicscan.org/address/0x58e003a3C6f2Aeed6a2a6Bc77B504566523cb15c) |
| PayloadsController   | [0x0846C28Dd54DEA4Fd7Fb31bcc5EB81673D68c695](https://sonicscan.org/address/0x0846C28Dd54DEA4Fd7Fb31bcc5EB81673D68c695) |
| PayloadDataHelper    | [0x6fD45D32375d5aDB8D76275A3932c740F03a8718](https://sonicscan.org/address/0x6fD45D32375d5aDB8D76275A3932c740F03a8718) |
| GranularGuardian     | [0x10078c1D8E46dd1ed5D8df2C42d5ABb969b11566](https://sonicscan.org/address/0x10078c1D8E46dd1ed5D8df2C42d5ABb969b11566) |
| CLEmergencyOracle    | [0xECB564e91f620fBFb59d0C4A41d7f10aDb0D1934](https://sonicscan.org/address/0xECB564e91f620fBFb59d0C4A41d7f10aDb0D1934) |
| ExecutorLvl1         | [0x7b62461a3570c6AC8a9f8330421576e417B71EE7](https://sonicscan.org/address/0x7b62461a3570c6AC8a9f8330421576e417B71EE7) |

### ARC

| Name | Address |
| ---- | ------- |
| V4 Security Council | [0x187AAE17d4931310B3fc75743e7F16Bdc9eD77e9](https://explorer.arc.io/address/0x187AAE17d4931310B3fc75743e7F16Bdc9eD77e9) |
