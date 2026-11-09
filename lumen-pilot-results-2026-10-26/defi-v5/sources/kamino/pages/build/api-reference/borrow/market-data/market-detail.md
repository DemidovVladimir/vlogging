> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get Kamino Market config

> Get configuration for a specific Kamino Lending market by market address. Optionally filter by program ID.



## OpenAPI

````yaml kamino-api.json GET /v2/kamino-market/{pubkey}
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
  /v2/kamino-market/{pubkey}:
    get:
      tags:
        - Kamino Lend Markets
      summary: Get Kamino Market config
      description: >-
        Get configuration for a specific Kamino Lending market by market
        address. Optionally filter by program ID.
      parameters:
        - schema:
            allOf:
              - $ref: '#/components/schemas/AddressBase58'
              - description: Market public key
                example: 7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF
          required: true
          description: Market public key
          name: pubkey
          in: path
        - schema:
            type: string
            default: KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD
            description: KLend program ID
            example: KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD
          required: false
          description: KLend program ID
          name: programId
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MarketConfigResponseV2'
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
    MarketConfigResponseV2:
      type: object
      properties:
        name:
          type: string
          description: Market name
          example: SOL/BTC Market
        isPrimary:
          type: boolean
          description: Whether this is a primary market
          example: true
        description:
          type: string
          description: Market description
          example: Primary market on mainnet
        lendingMarket:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Lending market public key
              example: 7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF
        lookupTable:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Lookup table address
              example: FGMSBiyVE8TvZcdQnZETAAKw28tkQJ2ccZy6pyp95URb
        isCurated:
          type: boolean
          description: Whether this market is curated
          example: false
      required:
        - name
        - isPrimary
        - description
        - lendingMarket
        - lookupTable
        - isCurated
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