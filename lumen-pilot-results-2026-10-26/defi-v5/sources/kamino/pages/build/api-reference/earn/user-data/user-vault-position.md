> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get user position for a specific KVault

> Get a single user position for a Kamino Earn Vault the user currently has currently deposited into. Returns staked and unstaked shares.



## OpenAPI

````yaml kamino-api.json GET /kvaults/users/{userPubkey}/positions/{vaultPubkey}
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
  /kvaults/users/{userPubkey}/positions/{vaultPubkey}:
    get:
      tags:
        - Kamino Earn User
      summary: Get user position for a specific KVault
      description: >-
        Get a single user position for a Kamino Earn Vault the user currently
        has currently deposited into. Returns staked and unstaked shares.
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
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  vaultAddress:
                    allOf:
                      - $ref: '#/components/schemas/AddressBase58'
                      - description: Address of the Kamino Earn Vault
                  stakedShares:
                    allOf:
                      - $ref: '#/components/schemas/Decimal'
                      - description: >-
                          The number of Kamino Earn Vault shares staked in a
                          farm
                  unstakedShares:
                    allOf:
                      - $ref: '#/components/schemas/Decimal'
                      - description: >-
                          The number of Kamino Earn Vault shares held in the
                          user wallet
                  totalShares:
                    allOf:
                      - $ref: '#/components/schemas/Decimal'
                      - description: >-
                          The total number of Kamino Earn Vault shares both held
                          and staked by the user
                required:
                  - vaultAddress
                  - stakedShares
                  - unstakedShares
                  - totalShares
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
    Decimal:
      type: string
      description: Decimal value represented as string
      example: '1234.56789'
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