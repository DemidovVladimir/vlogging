> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get user KVault transactions

> Get all Kamino Earn Vault transactions for a given user



## OpenAPI

````yaml kamino-api.json GET /kvaults/users/{pubkey}/transactions
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
  /kvaults/users/{pubkey}/transactions:
    get:
      tags:
        - Kamino Earn User
      summary: Get user KVault transactions
      description: Get all Kamino Earn Vault transactions for a given user
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
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/KVaultInstruction'
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
    KVaultInstruction:
      type: object
      properties:
        createdOn:
          type: string
          format: date-time
          description: Date when the instruction was created
        instruction:
          type: string
          description: Type of instruction
        tokenMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Token mint address
        tokenAmount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Amount of tokens involved
        tokenPrice:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Price of the token at the time of instruction
        solPrice:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Price of SOL at the time of instruction
        sharePrice:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Price per share at the time of instruction
        numberOfShares:
          anyOf:
            - $ref: '#/components/schemas/Decimal'
            - type: 'null'
          description: >-
            Number of shares involved, or null for vault-level instructions such
            as invest
        usdValue:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: USD value of the transaction
        transaction:
          type: string
          description: Transaction signature
        kvault:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: KVault identifier
        latestPosition:
          type: boolean
          description: Indicates if this is the latest position
      required:
        - createdOn
        - instruction
        - tokenMint
        - tokenAmount
        - tokenPrice
        - solPrice
        - sharePrice
        - numberOfShares
        - usdValue
        - transaction
        - kvault
        - latestPosition
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