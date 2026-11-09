> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get profit and loss for an obligation

> Get profit and loss (PnL) for a specific obligation. For xSOL pairs, `useStakeRate` can be set to true to calculate the PnL using the stake rate.



## OpenAPI

````yaml kamino-api.json GET /v2/kamino-market/{marketPubkey}/obligations/{obligationPubkey}/pnl
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
  /v2/kamino-market/{marketPubkey}/obligations/{obligationPubkey}/pnl:
    get:
      tags:
        - Kamino Lend User Loans
      summary: Get profit and loss for an obligation
      description: >-
        Get profit and loss (PnL) for a specific obligation. For xSOL pairs,
        `useStakeRate` can be set to true to calculate the PnL using the stake
        rate.
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
              - description: Kamino Lend obligation public key
                example: 63QrAB1okxCc4FpsgcKYHjYTp1ua8ch6mLReyKRdc22o
          required: true
          description: Kamino Lend obligation public key
          name: obligationPubkey
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
            type: string
            default: KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD
            description: KLend program ID
            example: KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD
          required: false
          description: KLend program ID
          name: programId
          in: query
        - schema:
            type: string
            enum:
              - 'true'
              - 'false'
            default: 'false'
            description: For xSOL pairs, calculate the PnL using the stake rate
            example: 'true'
          required: false
          description: For xSOL pairs, calculate the PnL using the stake rate
          name: useStakeRate
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PnlResponse'
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
        '422':
          description: Unprocessable Entity
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: >-
                      Error message describing why the request could not be
                      processed
                    example: The requested calculation is not supported for this asset
                required:
                  - error
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
    PnlResponse:
      type: object
      properties:
        usd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: PnL in USD
              example: '25.21'
        sol:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: PnL in SOL
              example: '1.0'
        invested:
          type: object
          properties:
            usd:
              $ref: '#/components/schemas/Decimal'
            sol:
              $ref: '#/components/schemas/Decimal'
          required:
            - usd
            - sol
          description: Invested amounts
        truncatedHistory:
          type: boolean
          description: >-
            Set when the obligation transaction history exceeded the computation
            cap and older transactions were dropped from the PnL calculation
        accountingVersion:
          type: number
          enum:
            - 2
          description: PnL accounting version
        status:
          type: string
          enum:
            - complete
            - partial
            - unavailable
          description: Accounting completeness
        reasons:
          type: array
          items:
            type: string
          description: Reasons for partial or unavailable accounting
      required:
        - usd
        - sol
        - accountingVersion
        - status
        - reasons
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