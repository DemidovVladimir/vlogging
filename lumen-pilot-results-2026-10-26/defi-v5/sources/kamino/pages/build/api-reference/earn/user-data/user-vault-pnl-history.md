> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get user KVault PnL history

> Get PnL and cost basis history of user vault position



## OpenAPI

````yaml kamino-api.json GET /kvaults/users/{userPubkey}/vaults/{vaultPubkey}/pnl/history
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
  /kvaults/users/{userPubkey}/vaults/{vaultPubkey}/pnl/history:
    get:
      tags:
        - Kamino Earn User
      summary: Get user KVault PnL history
      description: Get PnL and cost basis history of user vault position
      parameters:
        - schema:
            allOf:
              - $ref: '#/components/schemas/AddressBase58'
              - description: Valid base58-encoded address of the vault
                example: HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E
          required: true
          description: Valid base58-encoded address of the vault
          name: vaultPubkey
          in: path
        - schema:
            allOf:
              - $ref: '#/components/schemas/AddressBase58'
              - description: Valid base58-encoded address of the user wallet
                example: AxqtG9SHDkZTLSWg81Sp7VqAzQpRqXtR9ziJ3VQAS8As
          required: true
          description: Valid base58-encoded address of the user wallet
          name: userPubkey
          in: path
        - schema:
            anyOf:
              - type: string
              - type: number
            description: Date input (ISO 8601 string or epoch in ms)
            examples:
              - '2024-01-01T00:00:00.000Z'
              - 1704067200000
          required: false
          description: Date input (ISO 8601 string or epoch in ms)
          name: start
          in: query
        - schema:
            anyOf:
              - type: string
              - type: number
            description: Date input (ISO 8601 string or epoch in ms)
            examples:
              - '2024-01-01T00:00:00.000Z'
              - 1704067200000
          required: false
          description: Date input (ISO 8601 string or epoch in ms)
          name: end
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  history:
                    type: array
                    items:
                      $ref: '#/components/schemas/KvaultPnlTimeseriesValue'
                  totalPnl:
                    $ref: '#/components/schemas/KvaultMultiValue'
                  totalCostBasis:
                    $ref: '#/components/schemas/KvaultMultiValue'
                required:
                  - history
                  - totalPnl
                  - totalCostBasis
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
    KvaultPnlTimeseriesValue:
      type: object
      properties:
        timestamp:
          type: number
          description: Unix timestamp in milliseconds
        type:
          anyOf:
            - type: string
              enum:
                - buy
            - type: string
              enum:
                - sell
            - type: string
              enum:
                - mark-to-market
        position:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Current position value
        quantity:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Quantity involved in transaction
        tokenPrice:
          allOf:
            - $ref: '#/components/schemas/KvaultMultiValue'
            - description: Token price snapshot
        sharePrice:
          allOf:
            - $ref: '#/components/schemas/KvaultMultiValue'
            - description: Share price snapshot
        costBasis:
          allOf:
            - $ref: '#/components/schemas/KvaultMultiValue'
            - description: Cost basis for position
        realizedPnl:
          allOf:
            - $ref: '#/components/schemas/KvaultMultiValue'
            - description: Realized profit/loss
        pnl:
          allOf:
            - $ref: '#/components/schemas/KvaultMultiValue'
            - description: Total profit/loss
        positionValue:
          allOf:
            - $ref: '#/components/schemas/KvaultMultiValue'
            - description: Value of the position
        investment:
          allOf:
            - $ref: '#/components/schemas/KvaultMultiValue'
            - description: Total invested value
      required:
        - timestamp
        - type
        - position
        - quantity
        - tokenPrice
        - sharePrice
        - costBasis
        - realizedPnl
        - pnl
        - positionValue
        - investment
    KvaultMultiValue:
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
        token:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Value in token denomination
      required:
        - usd
        - sol
        - token
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