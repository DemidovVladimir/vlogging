> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get transactions for a distributor code in a vault

> Cursor-paginated list of deposits into and withdrawals out of one Kamino Earn vault whose transaction carried this distributor code, newest first. One row per instruction. Private (authorized) API access only, please add a basic auth header to your request.



## OpenAPI

````yaml kamino-api.json GET /kvaults/distributors/{code}/vaults/{vault}/transactions
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
  /kvaults/distributors/{code}/vaults/{vault}/transactions:
    get:
      tags:
        - Distributors
      summary: Get transactions tagged with a distributor code on one vault
      description: >-
        Cursor-paginated list of deposits into and withdrawals out of one Kamino
        Earn vault whose transaction carried this distributor code, newest
        first. One row per instruction. Private (authorized) API access only,
        please add a basic auth header to your request.
      parameters:
        - schema:
            type: string
            minLength: 5
            maxLength: 5
            description: Distributor code, matched case-insensitively
            example: ex4mp
          required: true
          description: Distributor code, matched case-insensitively
          name: code
          in: path
        - schema:
            allOf:
              - $ref: '#/components/schemas/AddressBase58'
              - description: Kamino Earn vault address
                example: HDsayqBsE7bTE6ZJLDozDNhDHgc6BsDB1DTn5TBXn8hE
          required: true
          description: Kamino Earn vault address
          name: vault
          in: path
        - schema:
            type: string
            enum:
              - deposit
              - withdraw
            description: >-
              Only return this kind of transaction; omitted returns deposits and
              withdrawals
            example: deposit
          required: false
          description: >-
            Only return this kind of transaction; omitted returns deposits and
            withdrawals
          name: type
          in: query
        - schema:
            type: integer
            minimum: 1
            maximum: 1000
            default: 100
            example: 100
            description: Maximum number of transactions to return (1-1000)
          required: false
          description: Maximum number of transactions to return (1-1000)
          name: limit
          in: query
        - schema:
            type: string
            example: eyJsYXN0SWQiOjgxfQ==
            description: Optional pagination token
          required: false
          description: Optional pagination token
          name: paginationToken
          in: query
        - schema:
            anyOf:
              - type: string
              - type: number
            description: Date input (ISO 8601 string or epoch in ms)
            examples:
              - '2024-01-01T00:00:00.000Z'
              - 1704067200000
            example: 2020-01-01T00:00Z
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
            example: 2020-02-01T00:00Z
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
                $ref: '#/components/schemas/DistributorTransactionsResponse'
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
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Error message describing why it was not authorized
                    example: >-
                      Not authorized for this request. Please include the basic
                      auth headers.
                required:
                  - error
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
    DistributorTransactionsResponse:
      type: object
      properties:
        result:
          type: array
          items:
            $ref: '#/components/schemas/DistributorTransaction'
        paginationToken:
          type: string
          example: eyJsYXN0SWQiOjgxfQ==
          description: Optional pagination token
      required:
        - result
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
    DistributorTransaction:
      type: object
      properties:
        createdOn:
          $ref: '#/components/schemas/TransactionDateTime'
        tx:
          type: string
          description: Transaction signature
          example: >-
            2XWcSQVtR4NoHBhzYpDkYkmYtEFkFXC5ZwrKiPok1kvA86GvnN15qP7RNP6eTeNWgJqgnR1GA2M3QPp1hucW7e1v
        code:
          type: string
          description: Distributor code carried in the transaction memo
          example: ex4mp
        type:
          type: string
          enum:
            - deposit
            - withdraw
          description: >-
            Direction of the flow: a deposit into the vault or a withdrawal out
            of it, whichever instruction made it
          example: deposit
        instruction:
          type: string
          description: Kamino Earn vault instruction that moved the tokens
          example: deposit
          examples:
            - deposit
            - buy
            - withdraw
            - withdrawFromAvailable
            - sell
            - redeemInKind
        wallet:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Valid base58-encoded address of the user wallet
              example: AxqtG9SHDkZTLSWg81Sp7VqAzQpRqXtR9ziJ3VQAS8As
        vault:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Kamino Earn vault the tokens moved into or out of
        tokenMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Valid base58-encoded address of the token mint
              example: So11111111111111111111111111111111111111112
              examples:
                - So11111111111111111111111111111111111111112
                - EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
                - DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
        tokenSymbol:
          type:
            - string
            - 'null'
          description: Symbol of the underlying token, when known
          example: USDC
        amount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: >-
                Amount of the underlying token moved, always positive; for
                redeemInKind the cTokens paid out are converted to the
                underlying token at the reserve exchange rate at that time
      required:
        - createdOn
        - tx
        - code
        - type
        - instruction
        - wallet
        - vault
        - tokenMint
        - tokenSymbol
        - amount
    TransactionDateTime:
      type: string
      format: date-time
      description: Timestamp when the transaction was executed (ISO 8601 format)
      example: '2025-03-01T12:00:00.000Z'
    Decimal:
      type: string
      description: Decimal value represented as string
      example: '1234.56789'

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.