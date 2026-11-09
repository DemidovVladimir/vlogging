> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get KLend reserve history

> Get historical metrics for a specific reserve in a Kamino Lending market over a specified time range with configurable frequency (hour or day). Without a frequency, ranges shorter than 32 days are hourly and longer ranges are daily. APYs, amounts and capped available liquidity are means of raw snapshots in each UTC bucket. Other metrics retain the last snapshot.



## OpenAPI

````yaml kamino-api.json GET /kamino-market/{marketPubkey}/reserves/{reservePubkey}/metrics/history
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
  /kamino-market/{marketPubkey}/reserves/{reservePubkey}/metrics/history:
    get:
      tags:
        - Kamino Lend Markets
      summary: Get KLend reserve history
      description: >-
        Get historical metrics for a specific reserve in a Kamino Lending market
        over a specified time range with configurable frequency (hour or day).
        Without a frequency, ranges shorter than 32 days are hourly and longer
        ranges are daily. APYs, amounts and capped available liquidity are means
        of raw snapshots in each UTC bucket. Other metrics retain the last
        snapshot.
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
              - description: Kamino Lend reserve public key
                example: FBSyPnxtHKLBZ4UeeUyAnbtFuAmTHLtso9YtsqRDRWpM
          required: true
          description: Kamino Lend reserve public key
          name: reservePubkey
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
        - schema:
            anyOf:
              - type: string
              - type: number
            default: '1970-01-01T00:00:00.000Z'
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
        - schema:
            type: string
            enum:
              - hour
              - day
            description: >-
              Frequency of the snapshots. Defaults to hour for ranges shorter
              than 32 days and day otherwise.
            example: hour
          required: false
          description: >-
            Frequency of the snapshots. Defaults to hour for ranges shorter than
            32 days and day otherwise.
          name: frequency
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