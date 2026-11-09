> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get all user obligations

> Get all obligations (loans) for a specific user wallet in a Kamino Lending market.



## OpenAPI

````yaml kamino-api.json GET /kamino-market/{marketPubkey}/users/{userPubkey}/obligations
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
  /kamino-market/{marketPubkey}/users/{userPubkey}/obligations:
    get:
      tags:
        - Kamino Lend User Loans
      summary: Get all user obligations
      description: >-
        Get all obligations (loans) for a specific user wallet in a Kamino
        Lending market.
      parameters:
        - schema:
            allOf:
              - $ref: '#/components/schemas/AddressBase58'
              - description: Kamino Lend market public key
                example: 7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF
          required: true
          description: Kamino Lend market public key
          name: marketPubkey
          in: path
        - schema:
            allOf:
              - $ref: '#/components/schemas/AddressBase58'
              - description: User wallet public key
                example: AcNSmd5CxwLs21TYUmhWt7CW2v159TdYRkvQxb1iBYRj
          required: true
          description: User wallet public key
          name: userPubkey
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
              schema: {}
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '503':
          description: Service Unavailable
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                required:
                  - error
components:
  schemas:
    AddressBase58:
      type: string
      description: Valid base58-encoded address
      example: VEG1EMtttdHunMbSza8uoms1R18VXmYSph2bBpHcSJd
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