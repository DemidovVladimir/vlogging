> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get total strategy TVL

> Get aggregate total value locked across all live Kamino Liquidity strategies.



## OpenAPI

````yaml kamino-extra-api.json GET /strategies/tvl
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
  /strategies/tvl:
    get:
      tags:
        - Kamino Liquidity Strategies
      summary: Get total strategy TVL
      description: >-
        Get aggregate total value locked across all live Kamino Liquidity
        strategies.
      parameters:
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
                type: object
                properties:
                  tvl:
                    allOf:
                      - $ref: '#/components/schemas/Decimal'
                      - description: Aggregate TVL in USD across all live strategies
                required:
                  - tvl
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