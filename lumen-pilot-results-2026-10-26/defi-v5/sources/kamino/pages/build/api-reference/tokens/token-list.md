> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get tokens

> Get metadata and market data for tokens known to Kamino. Returns mint address, symbol, name, decimals, logo, verification status, 24-hour trading volume, and market cap. Without filters the endpoint returns the top 20 tokens by trading volume.



## OpenAPI

````yaml kamino-extra-api.json GET /tokens-api/tokens
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
  /tokens-api/tokens:
    get:
      tags:
        - Tokens
      summary: Get tokens
      description: >-
        Get metadata and market data for tokens known to Kamino. Returns mint
        address, symbol, name, decimals, logo, verification status, 24-hour
        trading volume, and market cap. Without filters the endpoint returns the
        top 20 tokens by trading volume.
      parameters:
        - schema:
            type: boolean
            example: true
          required: false
          description: >-
            Filter by verification status. When `true`, returns only
            Kamino-verified tokens.
          name: verified
          in: query
        - schema:
            type: integer
            default: 20
            maximum: 1000
            example: 100
          required: false
          description: Maximum number of tokens to return. Defaults to 20, maximum 1000.
          name: limit
          in: query
        - schema:
            type: string
            example: So11111111111111111111111111111111111111112
          required: false
          description: Filter by token mint address (base58).
          name: mint
          in: query
        - schema:
            type: string
            example: SOL
          required: false
          description: >-
            Filter by token symbol. May return multiple results if unverified
            tokens share the same symbol.
          name: symbol
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/TokenItem'
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
    TokenItem:
      type: object
      properties:
        mint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Token mint address
              example: So11111111111111111111111111111111111111112
        symbol:
          type: string
          description: Token ticker symbol
          example: SOL
        name:
          type: string
          description: Full token name
          example: Wrapped SOL
        decimals:
          type: integer
          description: Number of decimal places for the token's smallest unit
          example: 9
        logoUrl:
          type: string
          format: uri
          nullable: true
          description: >-
            URL to the token's logo image. May be null for tokens without a
            logo.
          example: >-
            https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png
        verified:
          type: boolean
          description: Whether the token is verified by Kamino
          example: true
        tradingVolume24H:
          type: number
          nullable: true
          description: 24-hour trading volume in USD. Null when market data is unavailable.
          example: 8578748269.87
        marketCapUsd:
          type: number
          nullable: true
          description: Market capitalization in USD. Null when market data is unavailable.
          example: 45407824173.6
        priority:
          type: integer
          description: Display priority (lower values appear first)
          example: 0
      required:
        - mint
        - symbol
        - name
        - decimals
        - verified
        - priority
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

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.