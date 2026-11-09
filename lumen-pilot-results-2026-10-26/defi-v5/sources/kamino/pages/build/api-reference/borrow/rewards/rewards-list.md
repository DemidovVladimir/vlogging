> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get KLend rewards

> Fetches all active KLend reward metrics for a specific points source



## OpenAPI

````yaml kamino-api.json GET /klend/rewards
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
  /klend/rewards:
    get:
      tags:
        - Kamino Lend Yield
      summary: Get KLend rewards
      description: Fetches all active KLend reward metrics for a specific points source
      parameters:
        - schema:
            type: string
            description: Points source identifier
            example: Season1
            examples:
              - Season1
              - Season2
              - Season3
              - Season4
          required: false
          description: Points source identifier
          name: source
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/KlendRewardMetrics'
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
    KlendRewardMetrics:
      type: array
      items:
        $ref: '#/components/schemas/KlendRewardMetric'
      description: List of klend reward metrics
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
    KlendRewardMetric:
      type: object
      properties:
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
        market:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Market public key
        rewardToken:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Mint address of the reward token
        lastCalculated:
          type: string
          format: date-time
          description: Timestamp of the last calculation
        apy:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Annual Percentage Yield from rewards
        tokensPerSecond:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Number of reward tokens distributed per second
        activePositionsUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total USD value of active positions receiving rewards
      required:
        - depositReserve
        - borrowReserve
        - market
        - rewardToken
        - lastCalculated
        - apy
        - tokensPerSecond
        - activePositionsUsd
    AddressBase58:
      type: string
      description: Valid base58-encoded address
      example: VEG1EMtttdHunMbSza8uoms1R18VXmYSph2bBpHcSJd
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
    Decimal:
      type: string
      description: Decimal value represented as string
      example: '1234.56789'

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.