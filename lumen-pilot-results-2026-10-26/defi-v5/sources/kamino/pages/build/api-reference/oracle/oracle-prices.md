> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get oracle prices

> Fetches all oracle prices for all public Klend Market assets



## OpenAPI

````yaml kamino-api.json GET /oracles/prices
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
  /oracles/prices:
    get:
      tags:
        - Other
      summary: Get Kamino oracle prices
      description: Fetches all oracle prices for all public Klend Market assets
      parameters:
        - schema:
            type: string
            enum:
              - main
              - all
            default: main
            description: >-
              Controls which market set to query. 'main': select oracle prices
              from SOL/BTC Market assets, 'all': select oracle prices from all
              public klend market assets.
            example: main
          required: false
          description: >-
            Controls which market set to query. 'main': select oracle prices
            from SOL/BTC Market assets, 'all': select oracle prices from all
            public klend market assets.
          name: markets
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                anyOf:
                  - $ref: '#/components/schemas/OraclePrices'
                  - type: array
                    items:
                      $ref: '#/components/schemas/OracleMarketPrices'
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
components:
  schemas:
    OraclePrices:
      type: array
      items:
        $ref: '#/components/schemas/OraclePriceItem'
      description: List of oracle prices for assets in the market
    OracleMarketPrices:
      allOf:
        - $ref: '#/components/schemas/MarketConfigResponseV2'
        - type: object
          properties:
            prices:
              type: array
              items:
                $ref: '#/components/schemas/OraclePriceItem'
              description: Oracle prices for assets in this market
          required:
            - prices
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
    OraclePriceItem:
      type: object
      properties:
        price:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Price value of the asset
        mint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Valid base58-encoded address of the token mint
              example: So11111111111111111111111111111111111111112
              examples:
                - So11111111111111111111111111111111111111112
                - EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
                - DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
        maxAgeInSeconds:
          allOf:
            - $ref: '#/components/schemas/Integer'
            - description: Maximum allowed age of the price feed in seconds
              example: '120'
        timestamp:
          $ref: '#/components/schemas/UnixTimestamp'
        name:
          type: string
          description: Name of the token
          example: SOL
      required:
        - price
        - mint
        - maxAgeInSeconds
        - timestamp
        - name
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
    Decimal:
      type: string
      description: Decimal value represented as string
      example: '1234.56789'
    AddressBase58:
      type: string
      description: Valid base58-encoded address
      example: VEG1EMtttdHunMbSza8uoms1R18VXmYSph2bBpHcSJd
    Integer:
      type: string
      description: Total number of unique users participating in the airdrop
      example: '1'
      examples:
        - '0'
        - '1'
        - '100'
        - '-1'
    UnixTimestamp:
      type: string
      description: Epoch Unix timestamp in seconds
      example: '1763568282'
      examples:
        - '0'
        - '1'
        - '100'
        - '-1'

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.