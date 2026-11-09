> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get strategy metrics

> Get real-time metrics for a specific strategy including share price, TVL, APY breakdown, and token balances.



## OpenAPI

````yaml kamino-extra-api.json GET /strategies/{pubkey}/metrics
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
  /strategies/{pubkey}/metrics:
    get:
      tags:
        - Kamino Liquidity Strategies
      summary: Get strategy metrics
      description: >-
        Get real-time metrics for a specific strategy including share price,
        TVL, APY breakdown, and token balances.
      parameters:
        - schema:
            allOf:
              - $ref: '#/components/schemas/AddressBase58'
              - description: Public key of the strategy
                example: 3VXtabCgrd3RYuHa6HisufMfiE4aUk84Hu5quDFhqECD
          required: true
          description: Public key of the strategy
          name: pubkey
          in: path
        - schema:
            type: string
            default: mainnet-beta
            example: mainnet-beta
          required: false
          description: Solana cluster environment. Defaults to mainnet-beta.
          name: env
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LiquidityStrategyMetrics'
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: High-level error message
                    example: Invalid query params
                  details:
                    type: array
                    items:
                      type: object
                      properties: {}
                    description: Detailed validation issues
                required:
                  - error
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
      description: Market public key
      example: 9pMFoVgsG2cNiUCSBEE69iWFN7c1bz9gu9TtPeXkAMTs
    LiquidityStrategyMetrics:
      type: object
      properties:
        strategy:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Public key of the strategy
        tokenAMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Mint address of token A
        tokenBMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Mint address of token B
        tokenA:
          type: string
          description: Token A symbol
          example: KMNO
        tokenB:
          type: string
          description: Token B symbol
          example: USDC
        rewardMints:
          type: array
          items:
            $ref: '#/components/schemas/AddressBase58'
          description: Mint addresses of DEX reward tokens
        krewardMints:
          type: array
          items:
            $ref: '#/components/schemas/AddressBase58'
          description: Mint addresses of Kamino reward tokens
        profitAndLoss:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Profit and loss value
        sharePrice:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Current share price in USD
        sharesIssued:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total shares issued
        totalValueLocked:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total value locked in USD
        kaminoApy:
          type: object
          properties:
            vault:
              $ref: '#/components/schemas/LiquidityKaminoApyVault'
            kamino:
              type: array
              items:
                type: object
              description: Kamino reward APY entries
            totalApy:
              allOf:
                - $ref: '#/components/schemas/Decimal'
                - description: Total Kamino APY
        apy:
          type: object
          properties:
            vault:
              $ref: '#/components/schemas/LiquidityVaultApy'
            kamino:
              type: array
              items:
                type: object
              description: Kamino reward APY entries
            totalApy:
              allOf:
                - $ref: '#/components/schemas/Decimal'
                - description: Total APY
        vaultBalances:
          type: object
          properties:
            tokenA:
              $ref: '#/components/schemas/LiquidityTokenBalance'
            tokenB:
              $ref: '#/components/schemas/LiquidityTokenBalance'
          required:
            - tokenA
            - tokenB
      required:
        - strategy
        - tokenAMint
        - tokenBMint
        - tokenA
        - tokenB
        - rewardMints
        - krewardMints
        - sharePrice
        - sharesIssued
        - totalValueLocked
        - kaminoApy
        - apy
        - vaultBalances
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
    Decimal:
      type: string
      description: Total Value Locked in USD
      example: '234.14377328764223'
      examples:
        - '0.123'
        - '0'
        - '1'
        - '1.23'
        - '-42.0'
        - '999999.999999'
    LiquidityKaminoApyVault:
      type: object
      properties:
        apr7d:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: 7-day APR
        apy7d:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: 7-day APY
        apr24h:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: 24-hour APR
        apy24h:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: 24-hour APY
        apr30d:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: 30-day APR
        apy30d:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: 30-day APY
        krewardsApr7d:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Kamino rewards 7-day APR
        krewardsApy7d:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Kamino rewards 7-day APY
        krewardsApr24h:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Kamino rewards 24-hour APR
        krewardsApy24h:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Kamino rewards 24-hour APY
        krewardsApr30d:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Kamino rewards 30-day APR
        krewardsApy30d:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Kamino rewards 30-day APY
        lastCalculated:
          type: string
          format: date-time
          description: Timestamp of last APY calculation
    LiquidityVaultApy:
      type: object
      properties:
        feeApr:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Fee APR
        feeApy:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Fee APY
        totalApr:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total APR
        totalApy:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total APY
        poolPrice:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Current pool price
        priceLower:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Lower bound of the price range
        priceUpper:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Upper bound of the price range
        rewardsApr:
          type: array
          items:
            $ref: '#/components/schemas/Decimal'
          description: Per-reward APR values
        rewardsApy:
          type: array
          items:
            $ref: '#/components/schemas/Decimal'
          description: Per-reward APY values
        strategyOutOfRange:
          type: boolean
          description: Whether the strategy is currently out of range
    LiquidityTokenBalance:
      type: object
      properties:
        invested:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Amount invested in the active position
        available:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Amount available (not in the active position)
        total:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total amount (invested + available)
        totalUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total value in USD
      required:
        - invested
        - available
        - total
        - totalUsd

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.