> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get KLend obligation history

> Get historical metrics for a specific obligation in a Kamino Lending market. This V2 endpoint supports using stake rate for obligation value calculation when `useStakeRateForObligation` is true.



## OpenAPI

````yaml kamino-api.json GET /v2/kamino-market/{marketPubkey}/obligations/{obligationPubkey}/metrics/history
openapi: 3.1.0
info:
  version: 1.0.0
  title: Kamino Public API
  description: >
    The Kamino API provides a comprehensive way to interact with Kamino without
    reading directly from the blockchain.


    The API also provides the ability to fetch data that might not be available
    from just reading the chain.


    The API is rate-limited for unauthenticated users. If you feel you need to
    make more requests or run into rate-limit issues, please reach out.
servers:
  - url: https://api.kamino.finance
security: []
paths:
  /v2/kamino-market/{marketPubkey}/obligations/{obligationPubkey}/metrics/history:
    get:
      tags:
        - Kamino Lend User Loans
      summary: Get KLend obligation history
      description: >-
        Get historical metrics for a specific obligation in a Kamino Lending
        market. This V2 endpoint supports using stake rate for obligation value
        calculation when `useStakeRateForObligation` is true.
      parameters:
        - schema:
            allOf:
              - $ref: '#/components/schemas/AddressBase58'
              - description: Kamino Lend market public key
                example: 7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF
          required: true
          description: Kamino Lend market public key
          name: marketPubkey
          in: path
        - schema:
            allOf:
              - $ref: '#/components/schemas/AddressBase58'
              - description: Kamino Lend obligation public key
                example: 63QrAB1okxCc4FpsgcKYHjYTp1ua8ch6mLReyKRdc22o
          required: true
          description: Kamino Lend obligation public key
          name: obligationPubkey
          in: path
        - schema:
            type: string
            enum:
              - mainnet-beta
              - devnet
              - localnet
            default: mainnet-beta
            description: Solana cluster environment
            example: mainnet-beta
          required: false
          description: Solana cluster environment
          name: env
          in: query
        - schema:
            anyOf:
              - type: string
              - type: number
            default: '1970-01-01T00:00:00.000Z'
            description: Date input (ISO 8601 string or epoch in ms)
            examples:
              - '2024-01-01T00:00:00.000Z'
              - 1704067200000
            example: 2020-01-01T00:00Z
          required: false
          description: Date input (ISO 8601 string or epoch in ms)
          name: start
          in: query
        - schema:
            anyOf:
              - type: string
              - type: number
            description: Date input (ISO 8601 string or epoch in ms)
            examples:
              - '2024-01-01T00:00:00.000Z'
              - 1704067200000
            example: 2020-02-01T00:00Z
          required: false
          description: Date input (ISO 8601 string or epoch in ms)
          name: end
          in: query
        - schema:
            type: string
            enum:
              - 'true'
              - 'false'
            default: 'false'
            description: Use stake rate to calculate net SOL value
            example: 'true'
          required: false
          description: Use stake rate to calculate net SOL value
          name: useStakeRateForObligation
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ObligationMetricsHistoryResponse'
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
components:
  schemas:
    AddressBase58:
      type: string
      description: Valid base58-encoded address
      example: VEG1EMtttdHunMbSza8uoms1R18VXmYSph2bBpHcSJd
    ObligationMetricsHistoryResponse:
      type: object
      properties:
        obligation:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Obligation public key
              example: 3HdrCvoJ91bwgVTejdDXfguo6S2A9jjUkBR5fasq4WhB
        history:
          type: array
          items:
            $ref: '#/components/schemas/ObligationMetrics'
          description: Historical metrics for the obligation
      required:
        - obligation
        - history
    Error:
      type: object
      properties:
        error:
          type: string
          description: Error message for internal server failure
          example: An internal error occurred
      required:
        - error
      description: Internal server error response (500)
      example:
        error: An internal error occurred
    ObligationMetrics:
      type: object
      properties:
        timestamp:
          allOf:
            - $ref: '#/components/schemas/SnapshotDateTime'
            - description: Timestamp of the metrics snapshot
              example: '2025-10-17T00:00:00.000Z'
        refreshedStats:
          $ref: '#/components/schemas/ObligationStats'
        deposits:
          type: array
          items:
            $ref: '#/components/schemas/Position'
          description: Array of deposit positions
        borrows:
          type: array
          items:
            $ref: '#/components/schemas/Position'
          description: Array of borrow positions
        tag:
          type: integer
          minimum: 0
          maximum: 6
          description: >-
            Obligation type tag (0 = Vanilla, 1 = Multiply, 2 = Lending, 3 =
            Leverage, 4 = MultiplyFixedRate, 5 = LendingFixedRate, 6 =
            LeverageFixedRate)
          example: 0
        obligationSolValues:
          $ref: '#/components/schemas/ObligationSolValues'
      required:
        - timestamp
        - refreshedStats
        - deposits
        - borrows
        - tag
        - obligationSolValues
    SnapshotDateTime:
      type: string
      format: date-time
      description: Timestamp when the snapshot was created (ISO 8601 format)
      example: '2025-03-01T12:00:00.000Z'
    ObligationStats:
      type: object
      properties:
        leverage:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Leverage ratio of the obligation
              example: '1.0580080950430842892'
        borrowLimit:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Maximum borrow limit
              example: '1.3496969599567630906'
        loanToValue:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Current loan-to-value ratio
              example: '0.054827647647367082766'
        liquidationLtv:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Liquidation loan-to-value threshold
              example: '0.75000000000000000001'
        netAccountValue:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Net account value
              example: '1.7239138521696367095'
        userTotalBorrow:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total amount borrowed by the user
              example: '0.10000095858274584538'
        userTotalDeposit:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total amount deposited by the user
              example: '1.8239148107523825549'
        borrowUtilization:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Borrow utilization ratio
              example: '0.074091415739685246983'
        borrowLiquidationLimit:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Borrow liquidation limit
              example: '1.3679361080642869162'
        userTotalCollateralDeposit:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total collateral deposited by the user
              example: '1.8239148107523825549'
        userTotalLiquidatableDeposit:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total liquidatable deposit amount
              example: '1.8239148107523825549'
        potentialElevationGroupUpdate:
          type: number
          description: Potential elevation group update indicator
          example: 0
        userTotalBorrowBorrowFactorAdjusted:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total borrow adjusted by borrow factor
              example: '0.10000095858274584538'
      required:
        - leverage
        - borrowLimit
        - loanToValue
        - liquidationLtv
        - netAccountValue
        - userTotalBorrow
        - userTotalDeposit
        - borrowUtilization
        - borrowLiquidationLimit
        - userTotalCollateralDeposit
        - userTotalLiquidatableDeposit
        - potentialElevationGroupUpdate
        - userTotalBorrowBorrowFactorAdjusted
      description: Refreshed obligation statistics
    Position:
      type: object
      properties:
        amount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Amount in the position
              example: '10000708.005624756258'
        mintAddress:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Token mint address
              example: So11111111111111111111111111111111111111112
        marketValueRefreshed:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Refreshed market value of the position
              example: '1.8239148107523825549'
        reserve:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: >-
                Address of the reserve backing the position. Absent on snapshots
                taken before reserve tracking was added to the indexer
                (2026-01-16).
              example: D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59
      required:
        - amount
        - mintAddress
        - marketValueRefreshed
    ObligationSolValues:
      type: object
      properties:
        netValueSol:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Net value in SOL
              example: '0.009469142566566941841900274495955292427975'
        collateralValueSol:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Collateral value in SOL
              example: '0.01001842948854487210536205388880118310325'
        debtValueSol:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Debt value in SOL
              example: '0.0005492869219779302633519230615141419874818'
        solPrice:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: SOL price in USD
              example: '182.05596125'
        timestampSolPrice:
          allOf:
            - $ref: '#/components/schemas/SnapshotDateTime'
            - description: Timestamp of the SOL price
              example: '2025-10-17T00:00:00.000Z'
        timestampObligation:
          allOf:
            - $ref: '#/components/schemas/SnapshotDateTime'
            - description: Timestamp of the obligation snapshot
              example: '2025-10-17T00:00:00.000Z'
      required:
        - netValueSol
        - collateralValueSol
        - debtValueSol
        - solPrice
        - timestampSolPrice
        - timestampObligation
      description: Obligation values denominated in SOL
    Decimal:
      type: string
      description: Decimal value represented as string
      example: '1234.56789'

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.