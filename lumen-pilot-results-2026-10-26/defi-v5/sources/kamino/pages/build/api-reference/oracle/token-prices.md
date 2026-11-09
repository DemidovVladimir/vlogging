> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get token prices

> Get the USD price for tokens tracked by Kamino, keyed by mint address and token symbol.



## OpenAPI

````yaml kamino-extra-api.json GET /prices
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
  /prices:
    get:
      tags:
        - Kamino Oracle Prices
      summary: Get token prices
      description: >-
        Get the USD price for tokens tracked by Kamino, keyed by mint address
        and token symbol.
      parameters:
        - schema:
            type: string
            default: scope
            example: scope
          required: false
          description: Price source. Defaults to scope.
          name: source
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/PriceItem'
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
    PriceItem:
      type: object
      properties:
        mint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Token mint address
              example: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
        token:
          type: string
          description: Token symbol
          example: USDC
        usdPrice:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Token price in USD
              example: '0.9996'
      required:
        - mint
        - token
        - usdPrice
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