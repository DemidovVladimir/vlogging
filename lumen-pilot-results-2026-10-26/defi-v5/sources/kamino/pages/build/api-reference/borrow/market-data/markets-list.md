> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get all Kamino Markets config

> Get all Kamino Lending markets configuration for a specific program ID. This is the V2 endpoint that allows filtering by program ID instead of cluster.



## OpenAPI

````yaml kamino-api.json GET /v2/kamino-market
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
  /v2/kamino-market:
    get:
      tags:
        - Kamino Lend Markets
      summary: Get all Kamino Markets config
      description: >-
        Get all Kamino Lending markets configuration for a specific program ID.
        This is the V2 endpoint that allows filtering by program ID instead of
        cluster.
      parameters:
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
                type: array
                items:
                  $ref: '#/components/schemas/MarketConfigResponseV2'
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
components:
  schemas:
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
    AddressBase58:
      type: string
      description: Valid base58-encoded address
      example: VEG1EMtttdHunMbSza8uoms1R18VXmYSph2bBpHcSJd

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.