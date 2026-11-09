> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get summary of the KVault program earnings

> Get an aggregated all-time summary of all Kamino Earn Vault rewards and interest earned, in SOL and USD



## OpenAPI

````yaml kamino-api.json GET /kvaults/summary
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
  /kvaults/summary:
    get:
      tags:
        - Season Rewards
      summary: Get summary of the KVault program earnings
      description: >-
        Get an aggregated all-time summary of all Kamino Earn Vault rewards and
        interest earned, in SOL and USD
      parameters:
        - schema:
            type: string
            enum:
              - default
              - private-credit
            default: default
            description: Type of vaults queried
            example: default
          required: false
          description: Type of vaults queried
          name: type
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  earnings:
                    type: object
                    properties:
                      interest:
                        type: object
                        properties:
                          usd:
                            allOf:
                              - $ref: '#/components/schemas/Decimal'
                              - description: Amount in USD denomination
                          sol:
                            allOf:
                              - $ref: '#/components/schemas/Decimal'
                              - description: Amount in SOL denomination
                        required:
                          - usd
                          - sol
                        description: Earnings from interest
                      rewards:
                        type: object
                        properties:
                          usd:
                            allOf:
                              - $ref: '#/components/schemas/Decimal'
                              - description: Amount in USD denomination
                          sol:
                            allOf:
                              - $ref: '#/components/schemas/Decimal'
                              - description: Amount in SOL denomination
                        required:
                          - usd
                          - sol
                        description: Earnings from vault farm rewards
                      reserveRewards:
                        type: object
                        properties:
                          usd:
                            allOf:
                              - $ref: '#/components/schemas/Decimal'
                              - description: Amount in USD denomination
                          sol:
                            allOf:
                              - $ref: '#/components/schemas/Decimal'
                              - description: Amount in SOL denomination
                        required:
                          - usd
                          - sol
                        description: Earnings from reserve rewards
                      total:
                        type: object
                        properties:
                          usd:
                            allOf:
                              - $ref: '#/components/schemas/Decimal'
                              - description: Amount in USD denomination
                          sol:
                            allOf:
                              - $ref: '#/components/schemas/Decimal'
                              - description: Amount in SOL denomination
                        required:
                          - usd
                          - sol
                        description: Total earnings
                    required:
                      - interest
                      - rewards
                      - reserveRewards
                      - total
                    description: Earnings summary
                required:
                  - earnings
                description: KVault Summary Data
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
components:
  schemas:
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