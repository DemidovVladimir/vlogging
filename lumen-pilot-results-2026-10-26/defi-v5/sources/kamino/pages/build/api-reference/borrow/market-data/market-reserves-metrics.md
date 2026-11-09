> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get metrics for market reserves

> Get current metrics for all reserves in a Kamino Lending market, including APY, TVL, borrow/supply amounts, and LTV ratios.



## OpenAPI

````yaml kamino-api.json GET /kamino-market/{pubkey}/reserves/metrics
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
  /kamino-market/{pubkey}/reserves/metrics:
    get:
      tags:
        - Kamino Lend Markets
      summary: Get metrics for market reserves
      description: >-
        Get current metrics for all reserves in a Kamino Lending market,
        including APY, TVL, borrow/supply amounts, and LTV ratios.
      parameters:
        - schema:
            allOf:
              - $ref: '#/components/schemas/AddressBase58'
              - description: Market public key
                example: 7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF
          required: true
          description: Market public key
          name: pubkey
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
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/ReserveMetricsResponse'
        '404':
          description: Not Found
          content:
            application/json:
              schema:
                type: object
                properties:
                  metadata:
                    type: string
                    description: Error message describing why it was not found
                    example: Account could not be found
                required:
                  - metadata
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
    ReserveMetricsResponse:
      type: object
      properties:
        reserve:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Reserve public key
        liquidityToken:
          type: string
          description: Liquidity token symbol
          example: SOL
        liquidityTokenMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Liquidity token mint address
        maxLtv:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Maximum loan-to-value ratio
              example: '0.65'
        borrowApy:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Current borrow APY
              example: '0.05450988511483601'
        supplyApy:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Current supply APY
              example: '0.038266801210808055'
        totalSupply:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total supply amount
        totalBorrow:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total borrow amount
        totalBorrowUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total borrow in USD
        totalSupplyUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total supply in USD
      required:
        - reserve
        - liquidityToken
        - liquidityTokenMint
        - maxLtv
        - borrowApy
        - supplyApy
        - totalSupply
        - totalBorrow
        - totalBorrowUsd
        - totalSupplyUsd
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
      description: Decimal value represented as string
      example: '1234.56789'
    Apy:
      type: string
      description: >-
        APY in decimal format (not percentage) represented as string. Multiply
        by 100 to get percentage (%) - 0.1 in API response is 10%.
      example: '0.2'
      examples:
        - '0.123'
        - '0'
        - '1'
        - '1.23'
        - '-0.5'
        - '999999.999999'

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.