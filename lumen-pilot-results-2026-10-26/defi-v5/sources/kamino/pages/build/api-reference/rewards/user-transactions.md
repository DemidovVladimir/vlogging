> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get user farm transactions

> Get all farms program transactions for a given user (with pagination).



## OpenAPI

````yaml kamino-api.json GET /farms/users/{pubkey}/transactions
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
  /farms/users/{pubkey}/transactions:
    get:
      tags:
        - Farms
      summary: Get user farms transactions
      description: Get all farms program transactions for a given user (with pagination).
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
            type: integer
            minimum: 1
            maximum: 1000
            default: 100
            example: 100
            description: Maximum number of results to return (1-1000)
          required: false
          description: Maximum number of results to return (1-1000)
          name: limit
          in: query
        - schema:
            type: string
            example: eyJsYXN0SWQiOiIxMjM0In0=
            description: Token for fetching the next page of results
          required: false
          description: Token for fetching the next page of results
          name: paginationToken
          in: query
        - schema:
            type: string
            example: false
            description: When true, returns all transactions without pagination
          required: false
          description: When true, returns all transactions without pagination
          name: noPagination
          in: query
        - schema:
            type: string
            enum:
              - asc
              - desc
            default: asc
            description: Sort order (asc for oldest first, desc for newest first)
            example: desc
          required: false
          description: Sort order (asc for oldest first, desc for newest first)
          name: sort
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  result:
                    type: array
                    items:
                      $ref: '#/components/schemas/FarmsInstruction'
                  paginationToken:
                    type: string
                    description: >-
                      Token for fetching the next page. Absent when no more
                      results.
                required:
                  - result
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
    FarmsInstruction:
      type: object
      properties:
        createdOn:
          type: string
          format: date-time
          description: Date when the instruction was created
        transactionSignature:
          type: string
          description: Transaction signature
          example: >-
            2XWcSQVtR4NoHBhzYpDkYkmYtEFkFXC5ZwrKiPok1kvA86GvnN15qP7RNP6eTeNWgJqgnR1GA2M3QPp1hucW7e1v
        instruction:
          type: string
          description: Instruction display name
          example: claim
        tokenAmount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Amount of tokens involved
        usdAmount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: USD value of the transaction
        farm:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Farm public key
        token:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Token mint public key
      required:
        - createdOn
        - transactionSignature
        - instruction
        - tokenAmount
        - usdAmount
        - farm
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