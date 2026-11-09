> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get historical user metrics for all KVault positions

> Get historical timeseries of total usd/sol/interest/apy for all user Kamino Earn Vault positions



## OpenAPI

````yaml kamino-api.json GET /kvaults/users/{pubkey}/metrics/history
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
  /kvaults/users/{pubkey}/metrics/history:
    get:
      tags:
        - Kamino Earn User
      summary: Get historical user metrics for all KVault positions
      description: >-
        Get historical timeseries of total usd/sol/interest/apy for all user
        Kamino Earn Vault positions
      parameters:
        - schema:
            allOf:
              - $ref: '#/components/schemas/AddressBase58'
              - description: Valid base58-encoded address of the user wallet
                example: AxqtG9SHDkZTLSWg81Sp7VqAzQpRqXtR9ziJ3VQAS8As
          required: true
          description: Valid base58-encoded address of the user wallet
          name: pubkey
          in: path
        - schema:
            anyOf:
              - type: string
              - type: number
            default: '1970-01-01T00:00:00.000Z'
            description: >-
              Start date of the range (defaults to Unix epoch). Accepts ISO
              string or epoch in ms.
            examples:
              - '1970-01-01T00:00:00.000Z'
              - 0
          required: false
          description: >-
            Start date of the range (defaults to Unix epoch). Accepts ISO string
            or epoch in ms.
          name: start
          in: query
        - schema:
            anyOf:
              - type: string
              - type: number
            description: >-
              End date of the range (defaults to current time). Accepts ISO
              string or epoch in ms.
            examples:
              - '2025-01-01T00:00:00.000Z'
              - 1735689600000
          required: false
          description: >-
            End date of the range (defaults to current time). Accepts ISO string
            or epoch in ms.
          name: end
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/UserKVaultTotal'
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: High-level error message describing the failure
                    example: Invalid query params
                  details:
                    type: array
                    items:
                      type: object
                      additionalProperties: {}
                    description: >-
                      Detailed validation issues (present only for validation
                      errors)
                required:
                  - error
                description: Bad request response (400)
                example:
                  error: Invalid query request
                  details:
                    - code: invalid_union
                      errors:
                        - - code: custom
                            path: []
                            message: Invalid date string
                        - - expected: number
                            code: invalid_type
                            path: []
                            message: 'Invalid input: expected number, received string'
                      path:
                        - start
                      message: Invalid input
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
    UserKVaultTotal:
      type: object
      properties:
        createdOn:
          $ref: '#/components/schemas/SnapshotDateTime'
        usdAmount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: User's total amount across all vaults in USD
        solAmount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: User's total amount across all vaults in SOL
        weightedApy:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Weighted average APY across all vaults in decimal format
        cumulativeInterestEarnedUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total interest earned in USD across all vaults
        cumulativeInterestEarnedSol:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total interest earned in SOL across all vaults
        interestEarnedPerSecondUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Interest earned per second at that specific moment in USD
        interestEarnedPerSecondSol:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Interest earned per second at that specific moment in SOL
      required:
        - createdOn
        - usdAmount
        - solAmount
        - weightedApy
        - cumulativeInterestEarnedUsd
        - cumulativeInterestEarnedSol
        - interestEarnedPerSecondUsd
        - interestEarnedPerSecondSol
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
    SnapshotDateTime:
      type: string
      format: date-time
      description: Timestamp when the snapshot was created (ISO 8601 format)
      example: '2025-03-01T12:00:00.000Z'
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