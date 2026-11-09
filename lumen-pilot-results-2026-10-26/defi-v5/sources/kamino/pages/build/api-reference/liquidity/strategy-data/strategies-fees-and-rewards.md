> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get strategy fees and rewards

> Get fees and rewards earned across all strategies over a chosen time period.



## OpenAPI

````yaml kamino-extra-api.json GET /strategies/fees-and-rewards
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
  /strategies/fees-and-rewards:
    get:
      tags:
        - Kamino Liquidity Strategies
      summary: Get strategy fees and rewards
      description: >-
        Get fees and rewards earned across all strategies over a chosen time
        period.
      parameters:
        - schema:
            type: string
            default: mainnet-beta
            example: mainnet-beta
          required: false
          description: Solana cluster environment. Defaults to mainnet-beta.
          name: env
          in: query
        - schema:
            type: string
            enum:
              - 24h
              - 7d
              - 30d
            default: 24h
            example: 24h
          required: false
          description: Time period. Defaults to 24h.
          name: period
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/LiquidityFeesAndRewardsItem'
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
    LiquidityFeesAndRewardsItem:
      type: object
      properties:
        strategyPubkey:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Public key of the strategy
        feesAEarned:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Token A fees earned
        feesBEarned:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Token B fees earned
        rewards0Earned:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: DEX reward 0 earned
        rewards1Earned:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: DEX reward 1 earned
        rewards2Earned:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: DEX reward 2 earned
        kaminoRewards0Earned:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Kamino reward 0 earned
        kaminoRewards1Earned:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Kamino reward 1 earned
        kaminoRewards2Earned:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Kamino reward 2 earned
        feesAEarnedUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Token A fees in USD
        feesBEarnedUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Token B fees in USD
        rewards0EarnedUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: DEX reward 0 in USD
        rewards1EarnedUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: DEX reward 1 in USD
        rewards2EarnedUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: DEX reward 2 in USD
        kaminoRewards0EarnedUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Kamino reward 0 in USD
        kaminoRewards1EarnedUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Kamino reward 1 in USD
        kaminoRewards2EarnedUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Kamino reward 2 in USD
        totalUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total fees and rewards in USD
        lastCalculated:
          type: string
          format: date-time
          description: Timestamp of last calculation
      required:
        - strategyPubkey
        - feesAEarned
        - feesBEarned
        - totalUsd
        - lastCalculated
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
    AddressBase58:
      type: string
      description: Market public key
      example: 9pMFoVgsG2cNiUCSBEE69iWFN7c1bz9gu9TtPeXkAMTs
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

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.