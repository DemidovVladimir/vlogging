> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get metadata for KVault token

> Get metadata for a given Kamino Earn Vault receipt token mint



## OpenAPI

````yaml kamino-api.json GET /kvaults/mints/{pubkey}/metadata
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
  /kvaults/mints/{pubkey}/metadata:
    get:
      tags:
        - Kamino Earn Vault Metadata
      summary: Get metadata for KVault token
      description: Get metadata for a given Kamino Earn Vault receipt token mint
      parameters:
        - schema:
            $ref: '#/components/schemas/AddressBase58'
          required: true
          description: Valid base58-encoded address
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
                type: object
                properties:
                  name:
                    type: string
                    description: The name of the token
                  symbol:
                    type: string
                    description: The symbol of the token
                  description:
                    type: string
                    description: A description of the token
                  image:
                    type: string
                    format: uri
                    description: A URL pointing to an image of the token
                required:
                  - name
                  - symbol
                  - description
                  - image
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