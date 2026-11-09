> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get metrics for leverage/multiply vaults

> Get aggregated metrics for all leverage and multiply positions in a Kamino Lending market, including average leverage, total borrowed, total deposited, and number of obligations.



## OpenAPI

````yaml kamino-api.json GET /kamino-market/{pubkey}/leverage/metrics
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
  /kamino-market/{pubkey}/leverage/metrics:
    get:
      tags:
        - Kamino Lend Markets
      summary: Get metrics for leverage/multiply vaults
      description: >-
        Get aggregated metrics for all leverage and multiply positions in a
        Kamino Lending market, including average leverage, total borrowed, total
        deposited, and number of obligations.
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
                  $ref: '#/components/schemas/LeverageMetricsResponse'
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
    LeverageMetricsResponse:
      type: object
      properties:
        avgLeverage:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Average leverage
        totalBorrowed:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total borrowed amount
        totalDeposited:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total deposited amount
        totalBorrowedUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total borrowed in USD
        totalObligations:
          type: string
          description: Total number of obligations
        totalDepositedUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total deposited in USD
        tvl:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total Value Locked
        updatedOn:
          type: string
          format: date-time
          description: Last update timestamp
        depositReserve:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Deposit reserve public key
        borrowReserve:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Borrow reserve public key
        tag:
          type: string
          description: Tag (Multiply or Leverage)
          example: Multiply
      required:
        - avgLeverage
        - totalBorrowed
        - totalDeposited
        - totalBorrowedUsd
        - totalObligations
        - totalDepositedUsd
        - tvl
        - updatedOn
        - depositReserve
        - borrowReserve
        - tag
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

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.