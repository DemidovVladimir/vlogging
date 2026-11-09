> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get user rewards history

> Get historical rewards earned by a wallet across all Kamino Liquidity strategies.



## OpenAPI

````yaml kamino-extra-api.json GET /strategies/shareholders/{walletPubkey}/rewards/history
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
  /strategies/shareholders/{walletPubkey}/rewards/history:
    get:
      tags:
        - Kamino Liquidity Strategies
      summary: Get user rewards history
      description: >-
        Get historical rewards earned by a wallet across all Kamino Liquidity
        strategies.
      parameters:
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
                $ref: '#/components/schemas/LiquidityUserRewardsHistory'
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
    LiquidityUserRewardsHistory:
      type: object
      properties:
        ownerPubkey:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Wallet address of the user
        rewards:
          type: array
          items:
            type: object
          description: Historical reward entries across all strategies
      required:
        - ownerPubkey
        - rewards
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

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.