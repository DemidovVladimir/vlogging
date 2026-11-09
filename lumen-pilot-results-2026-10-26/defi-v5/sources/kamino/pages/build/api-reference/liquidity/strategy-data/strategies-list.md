> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get all strategies

> Get all Kamino Liquidity strategies with addresses, pool metadata, and status.



## OpenAPI

````yaml kamino-extra-api.json GET /strategies
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
  /strategies:
    get:
      tags:
        - Kamino Liquidity Strategies
      summary: Get all strategies
      description: >-
        Get all Kamino Liquidity strategies with addresses, pool metadata, and
        status.
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
              - LIVE
              - SHADOW
              - DEPRECATED
              - IGNORED
            example: LIVE
          required: false
          description: Filter strategies by status.
          name: status
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/LiquidityStrategyListItem'
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
    LiquidityStrategyListItem:
      type: object
      properties:
        address:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Public key of the strategy
              example: 3VXtabCgrd3RYuHa6HisufMfiE4aUk84Hu5quDFhqECD
        type:
          type: string
          enum:
            - NON_PEGGED
            - PEGGED
          description: Strategy type
          example: NON_PEGGED
        shareMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Mint address of the strategy share token
        status:
          type: string
          enum:
            - LIVE
            - SHADOW
            - DEPRECATED
            - IGNORED
          description: Strategy status
          example: LIVE
        tokenAMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Mint address of token A
        tokenBMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Mint address of token B
      required:
        - address
        - type
        - shareMint
        - status
        - tokenAMint
        - tokenBMint
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