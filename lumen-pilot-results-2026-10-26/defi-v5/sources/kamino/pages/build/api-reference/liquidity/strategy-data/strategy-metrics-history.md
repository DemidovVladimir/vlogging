> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get strategy historical metrics

> Get time-series data for a strategy including share price, TVL, fees, rewards, and token prices.



## OpenAPI

````yaml kamino-extra-api.json GET /v2/strategies/{pubkey}/history
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
  /v2/strategies/{pubkey}/history:
    get:
      tags:
        - Kamino Liquidity Strategies
      summary: Get strategy historical metrics
      description: >-
        Get time-series data for a strategy including share price, TVL, fees,
        rewards, and token prices.
      parameters:
        - schema:
            allOf:
              - $ref: '#/components/schemas/AddressBase58'
              - description: Public key of the strategy
                example: 3VXtabCgrd3RYuHa6HisufMfiE4aUk84Hu5quDFhqECD
          required: true
          description: Public key of the strategy
          name: pubkey
          in: path
        - schema:
            anyOf:
              - type: string
              - type: number
          required: false
          description: Start date (ISO string or epoch ms).
          name: start
          in: query
        - schema:
            anyOf:
              - type: string
              - type: number
          required: false
          description: End date (ISO string or epoch ms). Defaults to now.
          name: end
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/LiquidityStrategyHistoryItem'
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: High-level error message
                    example: Invalid query params
                  details:
                    type: array
                    items:
                      type: object
                      properties: {}
                    description: Detailed validation issues
                required:
                  - error
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
      description: Market public key
      example: 9pMFoVgsG2cNiUCSBEE69iWFN7c1bz9gu9TtPeXkAMTs
    LiquidityStrategyHistoryItem:
      type: object
      properties:
        timestamp:
          type: string
          format: date-time
          description: Snapshot timestamp
          example: '2025-05-01T00:00:00.000Z'
        sharePrice:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Share price at this snapshot
        sharesIssued:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total shares issued
        totalValueLocked:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total value locked in USD
        tokenAAmounts:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Token A amount in the strategy
        tokenBAmounts:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Token B amount in the strategy
        tokenAPrice:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Token A price in USD
        tokenBPrice:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Token B price in USD
        solPrice:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: SOL price in USD
        profitAndLoss:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative profit and loss
        feesCollectedCumulativeA:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative token A fees collected
        feesCollectedCumulativeB:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative token B fees collected
        rewardsCollectedCumulative0:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative DEX reward 0 collected
        rewardsCollectedCumulative1:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative DEX reward 1 collected
        rewardsCollectedCumulative2:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative DEX reward 2 collected
        kaminoRewardsIssuedCumulative0:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative Kamino reward 0 issued
        kaminoRewardsIssuedCumulative1:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative Kamino reward 1 issued
        kaminoRewardsIssuedCumulative2:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative Kamino reward 2 issued
        reward0Price:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: DEX reward 0 price in USD
        reward1Price:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: DEX reward 1 price in USD
        reward2Price:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: DEX reward 2 price in USD
        kaminoReward0Price:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Kamino reward 0 price in USD
        kaminoReward1Price:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Kamino reward 1 price in USD
        kaminoReward2Price:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Kamino reward 2 price in USD
      required:
        - timestamp
        - sharePrice
        - sharesIssued
        - totalValueLocked
        - tokenAAmounts
        - tokenBAmounts
        - tokenAPrice
        - tokenBPrice
        - solPrice
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
      description: Total Value Locked in USD
      example: '234.14377328764223'
      examples:
        - '0.123'
        - '0'
        - '1'
        - '1.23'
        - '-42.0'
        - '999999.999999'

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.