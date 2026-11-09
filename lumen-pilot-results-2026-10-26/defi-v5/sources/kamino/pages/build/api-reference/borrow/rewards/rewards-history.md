> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get KLend reward history

> Fetches historical KLend reward metrics for a specific deposit and borrow reserve pair



## OpenAPI

````yaml kamino-api.json GET /klend/{depositReservePubkey}/{borrowReservePubkey}/rewards/history
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
  /klend/{depositReservePubkey}/{borrowReservePubkey}/rewards/history:
    get:
      tags:
        - Kamino Lend Yield
      summary: Get KLend reward history
      description: >-
        Fetches historical KLend reward metrics for a specific deposit and
        borrow reserve pair
      parameters:
        - schema:
            allOf:
              - $ref: '#/components/schemas/AddressBase58'
              - description: Deposit reserve public key
          required: true
          description: Deposit reserve public key
          name: depositReservePubkey
          in: path
        - schema:
            allOf:
              - $ref: '#/components/schemas/AddressBase58'
              - description: Borrow reserve public key
          required: true
          description: Borrow reserve public key
          name: borrowReservePubkey
          in: path
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
            description: Frequency of historical data aggregation
            example: hour
            examples:
              - hour
              - day
          required: false
          description: Frequency of historical data aggregation
          name: frequency
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/KlendRewardHistory'
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
    KlendRewardHistory:
      type: array
      items:
        $ref: '#/components/schemas/KlendRewardHistoryRow'
      description: List of historical klend reward metrics
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
    KlendRewardHistoryRow:
      type: object
      properties:
        timestamp:
          type: string
          format: date-time
          description: Timestamp of the data point
        depositReserve:
          anyOf:
            - $ref: '#/components/schemas/AddressBase58'
            - type: 'null'
          description: Deposit reserve public key, if applicable
        borrowReserve:
          anyOf:
            - $ref: '#/components/schemas/AddressBase58'
            - type: 'null'
          description: Borrow reserve public key, if applicable
        rewardToken:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Mint address of the reward token
        rewardApy:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Annual Percentage Yield from rewards at this point in time
      required:
        - timestamp
        - depositReserve
        - borrowReserve
        - rewardToken
        - rewardApy
    Apy:
      type: string
      description: >-
        APY in decimal format (not percentage) represented as string. Multiply
        by 100 to get percentage (%) - 0.1 in API response is 10%.
      example: '0.2'
      examples:
        - '0.123'
        - '0'
        - '1'
        - '1.23'
        - '-0.5'
        - '999999.999999'

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.