> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get wallet totals for a distributor code

> For each wallet that transacted under this distributor code in the range: the total amount per token and direction, deposits and withdrawals as separate lines. Private (authorized) API access only, please add a basic auth header to your request.



## OpenAPI

````yaml kamino-api.json GET /kvaults/distributors/{code}/wallets
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
  /kvaults/distributors/{code}/wallets:
    get:
      tags:
        - Distributors
      summary: Get per-wallet totals for a distributor code
      description: >-
        For each wallet that transacted under this distributor code in the
        range: the total amount per token and direction, deposits and
        withdrawals as separate lines. Private (authorized) API access only,
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
            description: Maximum number of wallets to return (1-1000)
          required: false
          description: Maximum number of wallets to return (1-1000)
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
                $ref: '#/components/schemas/DistributorWalletsResponse'
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
    DistributorWalletsResponse:
      type: object
      properties:
        result:
          type: array
          items:
            $ref: '#/components/schemas/DistributorWallet'
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
    DistributorWallet:
      type: object
      properties:
        wallet:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Valid base58-encoded address of the user wallet
              example: AxqtG9SHDkZTLSWg81Sp7VqAzQpRqXtR9ziJ3VQAS8As
        tokens:
          type: array
          items:
            $ref: '#/components/schemas/DistributorWalletToken'
      required:
        - wallet
        - tokens
    AddressBase58:
      type: string
      description: Valid base58-encoded address
      example: VEG1EMtttdHunMbSza8uoms1R18VXmYSph2bBpHcSJd
    DistributorWalletToken:
      type: object
      properties:
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
          example: USDC
        type:
          type: string
          enum:
            - deposit
            - withdraw
          description: >-
            Direction of the flow: a deposit into the vault or a withdrawal out
            of it, whichever instruction made it
          example: deposit
        amount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total amount of this token the wallet moved in this direction
      required:
        - tokenMint
        - tokenSymbol
        - type
        - amount
    Decimal:
      type: string
      description: Decimal value represented as string
      example: '1234.56789'

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.