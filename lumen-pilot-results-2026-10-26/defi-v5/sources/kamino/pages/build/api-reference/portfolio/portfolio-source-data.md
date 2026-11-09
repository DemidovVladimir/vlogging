> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get portfolio source data for a wallet

> Returns source position rows across Kamino products (lending, multiply, leverage, liquidity, earn, private credit, staking). Portfolio totals, counts, fees, historical PnL, and display-only rollups are intentionally left to client composition or their dedicated endpoints.



## OpenAPI

````yaml kamino-api.json GET /portfolio/{pubkey}
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
  /portfolio/{pubkey}:
    get:
      tags:
        - Portfolio
      summary: Get portfolio source data for a wallet
      description: >-
        Returns source position rows across Kamino products (lending, multiply,
        leverage, liquidity, earn, private credit, staking). Portfolio totals,
        counts, fees, historical PnL, and display-only rollups are intentionally
        left to client composition or their dedicated endpoints.
      operationId: getPortfolio
      parameters:
        - schema:
            $ref: '#/components/schemas/AddressBase58'
          required: true
          description: Valid base58-encoded address
          name: pubkey
          in: path
        - schema:
            type: string
            default: KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD
            description: KLend program ID
            example: KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD
          required: false
          description: KLend program ID
          name: programId
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              example:
                timestamp: '2026-06-12T11:16:12.657Z'
                sections:
                  lending:
                    indexed: true
                    positionsRefreshedOn: '2026-06-11T23:14:19.969Z'
                    pricesRefreshedOn: '2026-06-12T11:12:29.057Z'
                    appliedSlot: 454526593
                    errors: []
                  multiply:
                    indexed: true
                    positionsRefreshedOn: '2026-06-11T23:13:54.680Z'
                    pricesRefreshedOn: '2026-06-12T11:12:29.057Z'
                    appliedSlot: 454526593
                    errors: []
                  leverage:
                    indexed: true
                    positionsRefreshedOn: '2026-06-11T23:14:00.518Z'
                    pricesRefreshedOn: '2026-06-12T11:12:29.057Z'
                    appliedSlot: 454526593
                    errors: []
                  liquidity:
                    indexed: true
                    positionsRefreshedOn: '2026-06-11T23:11:53.211Z'
                    pricesRefreshedOn: '2026-06-11T23:14:24.861Z'
                    appliedSlot: 454526593
                    errors: []
                  earn:
                    indexed: true
                    positionsRefreshedOn: '2026-06-11T23:12:29.633Z'
                    pricesRefreshedOn: '2026-06-12T11:12:29.057Z'
                    appliedSlot: 454526593
                    errors: []
                  privateCredit:
                    indexed: true
                    positionsRefreshedOn: '2026-06-11T23:12:29.846Z'
                    pricesRefreshedOn: '2026-06-12T11:12:29.057Z'
                    appliedSlot: 454526593
                    errors: []
                  staking:
                    indexed: true
                    positionsRefreshedOn: '2026-06-11T23:04:34.002Z'
                    pricesRefreshedOn: '2026-06-12T11:12:29.057Z'
                    appliedSlot: 454526593
                    errors: []
                lending:
                  - obligation: HpAQMFgpSJ3XZWEXtSQgJmuL3Fd8QepJSG79csgq3hoB
                    market: 5wJeMrUYECGq41fxRESKALVcHnNX26TAWy4W98yULsua
                    tag: Vanilla
                    netValue: '262.00710654164595037'
                    totalDepositValue: '491.89391304710577576'
                    totalBorrowValue: '229.88680650545982539'
                    ltv: '0.4673503786241097951'
                    maxLtv: '0.5727335057760832411'
                    liquidationLtv: '0.63241141170317723635'
                    leverage: '1.8774067602205262589'
                    netApy: '-0.0446'
                    baseApy: '-0.057'
                    farmRewardsApy: '0.0124'
                    assetYieldApy: '0'
                    deposits:
                      - mint: XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W
                        symbol: SPYx
                        amount: '0.16082255065800625522'
                        value: '119.1703926699327137'
                        price: '741.005488237479553'
                        reserve: UvXjBuC7YZYaGB9Rn1PpBD1GySmjzunXgE8Zev9ua8d
                        maxLtv: '0.73'
                        liquidationLtv: '0.75'
                    borrows:
                      - mint: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
                        symbol: USDC
                        amount: '229.95449131043213799'
                        value: '229.88680650545982539'
                        price: '0.99970566'
                        reserve: 97zoywd8mPZsGTg8q1wdD2Wgkdrs2tqusp1Qqcxbyj7E
                        borrowFactor: '1'
                multiply:
                  - obligation: 2JsWdyxA15WodMBzRY5uNUJDvL71xm9NwfMj6qdYi3SC
                    market: 7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF
                    tag: Multiply
                    netValue: '39.032947857306441512'
                    totalDepositValue: '124.32509095187057771'
                    totalBorrowValue: '85.292143094564136198'
                    ltv: '0.68604126843215345899'
                    maxLtv: '0.87000000000000000002'
                    liquidationLtv: '0.91999999999999999997'
                    leverage: '3.1851319917308934971'
                    netApy: '0.141793'
                    baseApy: '-0.118591'
                    farmRewardsApy: '0.0215'
                    assetYieldApy: '0.238884'
                    deposits:
                      - mint: J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn
                        symbol: JitoSOL
                        amount: '1.4488817124626824571'
                        value: '124.32509095187057771'
                        price: '85.807619685221685924'
                        reserve: EVbyPKrHG6WBfm4dLxLMJpUDY43cCAcHSpV3KYjKsktW
                        maxLtv: '0.87'
                        liquidationLtv: '0.92'
                    borrows:
                      - mint: So11111111111111111111111111111111111111112
                        symbol: SOL
                        amount: '1.276825076608483649'
                        value: '85.292143094564136198'
                        price: '66.80017855'
                        reserve: d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q
                        borrowFactor: '1'
                    depositMint: J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn
                    borrowMint: So11111111111111111111111111111111111111112
                leverage:
                  - obligation: VgtvJ1iCDAb65pWbwhvX33X6CWMWMdrYRABEhNTJ9xq
                    market: 7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF
                    tag: Leverage
                    netValue: '8.774498333310038026'
                    totalDepositValue: '23.724451929066735492'
                    totalBorrowValue: '14.949953595756697466'
                    ltv: '0.6301495874575001704'
                    maxLtv: '0.75'
                    liquidationLtv: '0.80000000000000000002'
                    leverage: '2.7037958214663046734'
                    netApy: '-0.116562'
                    baseApy: '-0.116562'
                    farmRewardsApy: '0'
                    assetYieldApy: '0'
                    deposits:
                      - mint: 7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs
                        symbol: ETH
                        amount: '0.014174648995927885562'
                        value: '23.724451929066735492'
                        price: '1673.72412085'
                        reserve: febGYTnFX4GbSGoFHFeJXUHgNaK53fB23uDins9Jp1E
                        maxLtv: '0.75'
                        liquidationLtv: '0.8'
                    borrows:
                      - mint: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
                        symbol: USDC
                        amount: '14.954355260684127232'
                        value: '14.949953595756697466'
                        price: '0.99970566'
                        reserve: D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59
                        borrowFactor: '1'
                    depositMint: 7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs
                    borrowMint: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
                liquidity:
                  - strategy: HBuYwvq67VKnLyKxPzDjzskyRMk7ps39gwHdvaPGwdmQ
                    shareMint: 7XB1azPg9hmD196uiGNa61EyvXbCmQhg8jSdptRGkRTZ
                    shares: '216.673457'
                    netValue: '26.383693978132575086'
                    tokenA:
                      mint: JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN
                      symbol: JUP
                      amount: '54.602417609162028891'
                      value: '9.1141301646553401798'
                      price: '0.16691807'
                    tokenB:
                      mint: bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1
                      symbol: bSOL
                      amount: '0.19898556021252914791'
                      value: '17.269563813477234906'
                      price: '86.788025196563257466'
                earn:
                  - vault: 7cYGMEwQKhdYdugAyQBEqtwG6KhHyuEDcgUrdfGaV6qV
                    tokenMint: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
                    symbol: USDC
                    name: Core+ USDC Vault
                    netValue: '102.43833649457444653'
                    shares: '97.742099'
                    amount: '102.46849707200261978'
                privateCredit:
                  - vault: 91b1opzHNUQobfLZxGMNYT5qDRKoqV8FdsdQBmH4wBxy
                    tokenMint: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
                    symbol: USDC
                    name: Kamino Institutional USDC
                    netValue: '10.357873888364687946'
                    shares: '10'
                    amount: '10.360923522594328361'
                staking:
                  - mint: KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS
                    symbol: KMNO
                    farm: 2sFZDpBn4sA42uNbAD6QzQ98rPSmqnPyksYe6SJKVvay
                    amount: '1700.2533519964832604'
                    value: '30.92680935374059216'
                    price: '0.01818953'
              schema:
                $ref: '#/components/schemas/PortfolioResponse'
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: High-level error message describing the failure
                    example: Invalid query params
                  details:
                    type: array
                    items:
                      type: object
                      additionalProperties: {}
                    description: >-
                      Detailed validation issues (present only for validation
                      errors)
                required:
                  - error
                description: Bad request response (400)
                example:
                  error: Invalid query request
                  details:
                    - code: invalid_union
                      errors:
                        - - code: custom
                            path: []
                            message: Invalid date string
                        - - expected: number
                            code: invalid_type
                            path: []
                            message: 'Invalid input: expected number, received string'
                      path:
                        - start
                      message: Invalid input
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
    PortfolioResponse:
      type: object
      properties:
        timestamp:
          type: string
          format: date-time
          description: Response timestamp as an ISO-8601 string
        sections:
          $ref: '#/components/schemas/PortfolioSections'
        lending:
          type: array
          items:
            $ref: '#/components/schemas/PortfolioLendingPosition'
        multiply:
          type: array
          items:
            $ref: '#/components/schemas/PortfolioMultiplyPosition'
        leverage:
          type: array
          items:
            $ref: '#/components/schemas/PortfolioLeveragePosition'
        liquidity:
          type: array
          items:
            $ref: '#/components/schemas/PortfolioLiquidityPosition'
        earn:
          type: array
          items:
            $ref: '#/components/schemas/PortfolioEarnPosition'
        privateCredit:
          type: array
          items:
            $ref: '#/components/schemas/PortfolioPrivateCreditPosition'
        staking:
          type: array
          items:
            $ref: '#/components/schemas/PortfolioStakingPosition'
      required:
        - timestamp
        - sections
        - lending
        - multiply
        - leverage
        - liquidity
        - earn
        - privateCredit
        - staking
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
    PortfolioSections:
      type: object
      properties:
        lending:
          $ref: '#/components/schemas/PortfolioSectionState'
        multiply:
          $ref: '#/components/schemas/PortfolioSectionState'
        leverage:
          $ref: '#/components/schemas/PortfolioSectionState'
        liquidity:
          $ref: '#/components/schemas/PortfolioSectionState'
        earn:
          $ref: '#/components/schemas/PortfolioSectionState'
        privateCredit:
          $ref: '#/components/schemas/PortfolioSectionState'
        staking:
          $ref: '#/components/schemas/PortfolioSectionState'
      required:
        - lending
        - multiply
        - leverage
        - liquidity
        - earn
        - privateCredit
        - staking
      description: Per-section indexing and freshness metadata.
    PortfolioLendingPosition:
      type: object
      properties:
        obligation:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Obligation address
        market:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Lending market address
        tag:
          type: string
          enum:
            - Vanilla
            - Lending
            - LendingFixedRate
            - Multiply
            - MultiplyFixedRate
            - Leverage
            - LeverageFixedRate
          description: Obligation type tag
          example: Lending
        netValue:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Net account value in USD from refreshed obligation stats
        totalDepositValue:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Total deposit value in USD from refreshed obligation stats
        totalBorrowValue:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Total borrow value in USD from refreshed obligation stats
        ltv:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current loan-to-value ratio from refreshed obligation stats
        maxLtv:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: >-
            Maximum loan-to-value ratio for the whole obligation from refreshed
            stats
        liquidationLtv:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Liquidation LTV threshold from refreshed obligation stats
        leverage:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current leverage from refreshed obligation stats
        netApy:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: >-
            Current net APY as a signed fraction of equity (deposit value minus
            borrow value): baseApy + farmRewardsApy + assetYieldApy, from the
            cached reserve stats refreshed every minute. This is the current
            rate, not realized APY. Null when a reserve has no cached stats, a
            deposited or borrowed token whose yield applies to that side has its
            underlying yield unavailable (reserve stats underlyingApy null with
            underlyingYieldExpected true), a position has no price, equity is
            below 1 USD, or there are no positions.
        baseApy:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: >-
            Lending interest net of borrow cost as a signed fraction of equity:
            sum of deposit value x supply APY minus borrow value x borrow APY,
            divided by equity. Null under the same conditions as netApy.
        farmRewardsApy:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: >-
            Reserve farm rewards on deposits and borrows plus pair incentives,
            as a signed fraction of equity. A pair incentive counts only when
            the obligation holds both its collateral reserve and its debt
            reserve, and pays on the debt reserve's borrowed value times the
            collateral reserve's share of total deposit value. Null under the
            same conditions as netApy.
        assetYieldApy:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: >-
            The tokens' own yield (LST staking, yield-bearing tokens) as a
            signed fraction of equity; borrowing a yield-bearing token
            contributes negatively. Debt in a token whose yield is paid to
            suppliers rather than accrued by the token (USDe) contributes 0.
            Null under the same conditions as netApy.
        deposits:
          type: array
          items:
            $ref: '#/components/schemas/PortfolioLendingDeposit'
        borrows:
          type: array
          items:
            $ref: '#/components/schemas/PortfolioLendingBorrow'
      required:
        - obligation
        - market
        - tag
        - netValue
        - totalDepositValue
        - totalBorrowValue
        - ltv
        - maxLtv
        - liquidationLtv
        - leverage
        - netApy
        - baseApy
        - farmRewardsApy
        - assetYieldApy
        - deposits
        - borrows
    PortfolioMultiplyPosition:
      type: object
      properties:
        obligation:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Obligation address
        market:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Lending market address
        tag:
          type: string
          enum:
            - Vanilla
            - Lending
            - LendingFixedRate
            - Multiply
            - MultiplyFixedRate
            - Leverage
            - LeverageFixedRate
          description: Obligation type tag
          example: Lending
        netValue:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Net account value in USD from refreshed obligation stats
        totalDepositValue:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Total deposit value in USD from refreshed obligation stats
        totalBorrowValue:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Total borrow value in USD from refreshed obligation stats
        ltv:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current loan-to-value ratio from refreshed obligation stats
        maxLtv:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: >-
            Maximum loan-to-value ratio for the whole obligation from refreshed
            stats
        liquidationLtv:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Liquidation LTV threshold from refreshed obligation stats
        leverage:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current leverage from refreshed obligation stats
        netApy:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: >-
            Current net APY as a signed fraction of equity (deposit value minus
            borrow value): baseApy + farmRewardsApy + assetYieldApy, from the
            cached reserve stats refreshed every minute. This is the current
            rate, not realized APY. Null when a reserve has no cached stats, a
            deposited or borrowed token whose yield applies to that side has its
            underlying yield unavailable (reserve stats underlyingApy null with
            underlyingYieldExpected true), a position has no price, equity is
            below 1 USD, or there are no positions.
        baseApy:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: >-
            Lending interest net of borrow cost as a signed fraction of equity:
            sum of deposit value x supply APY minus borrow value x borrow APY,
            divided by equity. Null under the same conditions as netApy.
        farmRewardsApy:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: >-
            Reserve farm rewards on deposits and borrows plus pair incentives,
            as a signed fraction of equity. A pair incentive counts only when
            the obligation holds both its collateral reserve and its debt
            reserve, and pays on the debt reserve's borrowed value times the
            collateral reserve's share of total deposit value. Null under the
            same conditions as netApy.
        assetYieldApy:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: >-
            The tokens' own yield (LST staking, yield-bearing tokens) as a
            signed fraction of equity; borrowing a yield-bearing token
            contributes negatively. Debt in a token whose yield is paid to
            suppliers rather than accrued by the token (USDe) contributes 0.
            Null under the same conditions as netApy.
        deposits:
          type: array
          items:
            $ref: '#/components/schemas/PortfolioLendingDeposit'
        borrows:
          type: array
          items:
            $ref: '#/components/schemas/PortfolioLendingBorrow'
        depositMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Primary deposit token mint used for this multiply position
        borrowMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Primary borrow token mint used for this multiply position
      required:
        - obligation
        - market
        - tag
        - netValue
        - totalDepositValue
        - totalBorrowValue
        - ltv
        - maxLtv
        - liquidationLtv
        - leverage
        - netApy
        - baseApy
        - farmRewardsApy
        - assetYieldApy
        - deposits
        - borrows
    PortfolioLeveragePosition:
      type: object
      properties:
        obligation:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Obligation address
        market:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Lending market address
        tag:
          type: string
          enum:
            - Vanilla
            - Lending
            - LendingFixedRate
            - Multiply
            - MultiplyFixedRate
            - Leverage
            - LeverageFixedRate
          description: Obligation type tag
          example: Lending
        netValue:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Net account value in USD from refreshed obligation stats
        totalDepositValue:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Total deposit value in USD from refreshed obligation stats
        totalBorrowValue:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Total borrow value in USD from refreshed obligation stats
        ltv:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current loan-to-value ratio from refreshed obligation stats
        maxLtv:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: >-
            Maximum loan-to-value ratio for the whole obligation from refreshed
            stats
        liquidationLtv:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Liquidation LTV threshold from refreshed obligation stats
        leverage:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current leverage from refreshed obligation stats
        netApy:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: >-
            Current net APY as a signed fraction of equity (deposit value minus
            borrow value): baseApy + farmRewardsApy + assetYieldApy, from the
            cached reserve stats refreshed every minute. This is the current
            rate, not realized APY. Null when a reserve has no cached stats, a
            deposited or borrowed token whose yield applies to that side has its
            underlying yield unavailable (reserve stats underlyingApy null with
            underlyingYieldExpected true), a position has no price, equity is
            below 1 USD, or there are no positions.
        baseApy:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: >-
            Lending interest net of borrow cost as a signed fraction of equity:
            sum of deposit value x supply APY minus borrow value x borrow APY,
            divided by equity. Null under the same conditions as netApy.
        farmRewardsApy:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: >-
            Reserve farm rewards on deposits and borrows plus pair incentives,
            as a signed fraction of equity. A pair incentive counts only when
            the obligation holds both its collateral reserve and its debt
            reserve, and pays on the debt reserve's borrowed value times the
            collateral reserve's share of total deposit value. Null under the
            same conditions as netApy.
        assetYieldApy:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: >-
            The tokens' own yield (LST staking, yield-bearing tokens) as a
            signed fraction of equity; borrowing a yield-bearing token
            contributes negatively. Debt in a token whose yield is paid to
            suppliers rather than accrued by the token (USDe) contributes 0.
            Null under the same conditions as netApy.
        deposits:
          type: array
          items:
            $ref: '#/components/schemas/PortfolioLendingDeposit'
        borrows:
          type: array
          items:
            $ref: '#/components/schemas/PortfolioLendingBorrow'
        depositMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Primary deposit token mint used for this leverage position
        borrowMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Primary borrow token mint used for this leverage position
      required:
        - obligation
        - market
        - tag
        - netValue
        - totalDepositValue
        - totalBorrowValue
        - ltv
        - maxLtv
        - liquidationLtv
        - leverage
        - netApy
        - baseApy
        - farmRewardsApy
        - assetYieldApy
        - deposits
        - borrows
    PortfolioLiquidityPosition:
      type: object
      properties:
        strategy:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Strategy address
        shareMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Strategy share mint address
        shares:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total strategy shares held directly or staked in farms
        netValue:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current net position value in USD
        tokenA:
          $ref: '#/components/schemas/PortfolioPositionToken'
        tokenB:
          $ref: '#/components/schemas/PortfolioPositionToken'
      required:
        - strategy
        - shareMint
        - shares
        - netValue
        - tokenA
        - tokenB
    PortfolioEarnPosition:
      type: object
      properties:
        vault:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Vault address
        tokenMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Vault underlying token mint
        symbol:
          type: string
          description: Vault underlying token symbol
          example: USDC
        name:
          type: string
          description: Vault display name from resources or decoded vault state
          example: JitoSOL
        netValue:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current position value in USD
        shares:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Number of shares held
        amount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Underlying token amount for the position
      required:
        - vault
        - tokenMint
        - symbol
        - name
        - netValue
        - shares
        - amount
    PortfolioPrivateCreditPosition:
      type: object
      properties:
        vault:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Vault address
        tokenMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Vault underlying token mint
        symbol:
          type: string
          description: Vault underlying token symbol
          example: USDC
        name:
          type: string
          description: Vault name
          example: Maple USDC
        netValue:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current position value in USD
        shares:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Number of shares held
        amount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Underlying token amount for the position
      required:
        - vault
        - tokenMint
        - symbol
        - name
        - netValue
        - shares
        - amount
    PortfolioStakingPosition:
      type: object
      properties:
        mint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Staked token mint address
        symbol:
          type: string
          description: Staked token symbol
          example: KMNO
        farm:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Farm address where the staking position is held
        amount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Amount of KMNO staked
        value:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current USD value of staked KMNO
        price:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current staked token price in USD
      required:
        - mint
        - symbol
        - farm
        - amount
        - value
        - price
    PortfolioSectionState:
      type: object
      properties:
        indexed:
          type: boolean
          description: Whether this section has been indexed for the wallet.
        positionsRefreshedOn:
          type:
            - string
            - 'null'
          format: date-time
          description: Position freshness for this section.
        pricesRefreshedOn:
          type:
            - string
            - 'null'
          format: date-time
          description: Oldest required price freshness for this section.
        appliedSlot:
          type:
            - integer
            - 'null'
          description: >-
            Every on-chain change to this section's wallet positions up to this
            confirmed slot is reflected in the response, so a client can wait
            for it to reach the slot its transaction confirmed at. Covers
            position rows only, not prices or vault exchange rates. Null when
            the indexer has not reported a slot.
        errors:
          type: array
          items:
            $ref: '#/components/schemas/PortfolioSectionError'
          default: []
      required:
        - indexed
        - positionsRefreshedOn
        - pricesRefreshedOn
        - appliedSlot
    PortfolioLendingDeposit:
      type: object
      properties:
        mint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Token mint address
        symbol:
          type: string
          description: >-
            Best-effort token symbol from known SQL-backed mint metadata, or
            UNKNOWN when unavailable
          example: SOL
        amount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Token amount
        value:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current USD value for this token row
        price:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current token price in USD
        reserve:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Resolved KLend reserve address backing this token row
        maxLtv:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: >-
                Maximum loan-to-value ratio for the reserve as a fraction,
                adjusted for the obligation's elevation group
        liquidationLtv:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: >-
                Liquidation loan-to-value threshold for the reserve as a
                fraction, adjusted for the obligation's elevation group
      required:
        - mint
        - symbol
        - amount
        - value
        - price
        - maxLtv
        - liquidationLtv
    PortfolioLendingBorrow:
      type: object
      properties:
        mint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Token mint address
        symbol:
          type: string
          description: >-
            Best-effort token symbol from known SQL-backed mint metadata, or
            UNKNOWN when unavailable
          example: SOL
        amount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Token amount
        value:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current USD value for this token row
        price:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current token price in USD
        reserve:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Resolved KLend reserve address backing this token row
        borrowFactor:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: >-
                Borrow factor for the reserve as a fraction (e.g. 1.25); 1 when
                an elevation group is active
      required:
        - mint
        - symbol
        - amount
        - value
        - price
        - borrowFactor
    Decimal:
      type: string
      description: Decimal value represented as string
      example: '1234.56789'
    PortfolioPositionToken:
      type: object
      properties:
        mint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Token mint address
        symbol:
          type: string
          description: >-
            Best-effort token symbol from known SQL-backed mint metadata, or
            UNKNOWN when unavailable
          example: SOL
        amount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Token amount
        value:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current USD value for this token row
        price:
          type:
            - string
            - 'null'
          example: '1234.56789'
          description: Current token price in USD
        reserve:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Resolved KLend reserve address backing this token row
      required:
        - mint
        - symbol
        - amount
        - value
        - price
    PortfolioSectionError:
      type: object
      properties:
        code:
          type: string
          description: >-
            Stable subcomponent error code, including klend-slot-stale,
            klend-slot-unavailable, and klend-reserve-accrual-missing
      required:
        - code

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.