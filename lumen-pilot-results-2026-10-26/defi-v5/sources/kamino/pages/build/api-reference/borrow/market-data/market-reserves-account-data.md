> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get KLend market reserves account data

> Fetch reserve account data for given Klend markets. Returns base64-encoded account data for all reserves in the specified markets.



## OpenAPI

````yaml kamino-api.json GET /kamino-market/reserves/account-data
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
  /kamino-market/reserves/account-data:
    get:
      tags:
        - Kamino Lend Markets
      summary: Get KLend market reserves account data
      description: >-
        Fetch reserve account data for given Klend markets. Returns
        base64-encoded account data for all reserves in the specified markets.
      parameters:
        - schema:
            type: string
            default: KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD
          required: false
          name: programId
          in: query
        - schema:
            anyOf:
              - type: string
              - type: array
                items:
                  type: string
          required: true
          name: markets
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/ReserveAccountDataResponse'
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
components:
  schemas:
    ReserveAccountDataResponse:
      type: object
      properties:
        market:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Market public key
        reserves:
          type: array
          items:
            type: object
            properties:
              pubkey:
                allOf:
                  - $ref: '#/components/schemas/AddressBase58'
                  - description: Reserve public key
              data:
                type: string
                description: Base64 encoded reserve account data
            required:
              - pubkey
              - data
      required:
        - market
        - reserves
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
    AddressBase58:
      type: string
      description: Valid base58-encoded address
      example: VEG1EMtttdHunMbSza8uoms1R18VXmYSph2bBpHcSJd

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.