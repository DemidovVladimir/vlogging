> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get user PnL history

> Get time-series PnL snapshots for a user position in a specific strategy.



## OpenAPI

````yaml kamino-extra-api.json GET /v2/strategies/{strategyPubkey}/shareholders/{walletPubkey}/pnl/history
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
  /v2/strategies/{strategyPubkey}/shareholders/{walletPubkey}/pnl/history:
    get:
      tags:
        - Kamino Liquidity Strategies
      summary: Get user PnL history
      description: >-
        Get time-series PnL snapshots for a user position in a specific
        strategy.
      parameters:
        - schema:
            allOf:
              - $ref: '#/components/schemas/AddressBase58'
              - description: Public key of the strategy
                example: 3VXtabCgrd3RYuHa6HisufMfiE4aUk84Hu5quDFhqECD
          required: true
          description: Public key of the strategy
          name: strategyPubkey
          in: path
        - schema:
            allOf:
              - $ref: '#/components/schemas/AddressBase58'
              - description: Wallet address of the user
                example: AcNSmd5CxwLs21TYUmhWt7CW2v159TdYRkvQxb1iBYRj
          required: true
          description: Wallet address of the user
          name: walletPubkey
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
                $ref: '#/components/schemas/LiquidityUserPnlHistory'
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
    LiquidityUserPnlHistory:
      type: object
      properties:
        strategy:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Public key of the strategy
        wallet:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Wallet address of the user
        totalPnl:
          $ref: '#/components/schemas/LiquidityPnlDenomination'
        totalCostBasis:
          $ref: '#/components/schemas/LiquidityPnlDenomination'
        history:
          type: array
          items:
            type: object
          description: Time-series PnL snapshots
      required:
        - strategy
        - wallet
        - totalPnl
        - totalCostBasis
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
    LiquidityPnlDenomination:
      type: object
      properties:
        usd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Value in USD
        sol:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Value in SOL
        a:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Value in token A
        b:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Value in token B
      required:
        - usd
        - sol
        - a
        - b
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