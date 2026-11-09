> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get token price history

> Get the historical USD price for a token tracked by Kamino. Returns an array of `[price, timestamp]` pairs ordered oldest to newest, where `price` is the USD price as a string and `timestamp` is a Unix time in seconds.



## OpenAPI

````yaml kamino-extra-api.json GET /prices/history
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
  /prices/history:
    get:
      tags:
        - Kamino Oracle Prices
      summary: Get token price history
      description: >-
        Get the historical USD price for a token tracked by Kamino. Returns an
        array of `[price, timestamp]` pairs ordered oldest to newest, where
        `price` is the USD price as a string and `timestamp` is a Unix time in
        seconds.
      parameters:
        - schema:
            type: string
            example: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
          required: true
          description: >-
            Token identifier. Accepts either the token mint address or its
            symbol (for example `USDC`).
          name: token
          in: query
        - schema:
            type: string
            enum:
              - minute
              - hour
              - day
            example: day
          required: false
          description: >-
            Sampling interval for the returned series. One of `minute`, `hour`,
            or `day`. If omitted, raw price ticks are returned.
          name: frequency
          in: query
        - schema:
            type: string
            format: date-time
            example: '2026-06-01T00:00:00Z'
          required: false
          description: Start of the time range, as an ISO 8601 timestamp.
          name: start
          in: query
        - schema:
            type: string
            format: date-time
            example: '2026-06-10T00:00:00Z'
          required: false
          description: End of the time range, as an ISO 8601 timestamp.
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
                  $ref: '#/components/schemas/PriceHistoryPoint'
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
                    example: Token query parameter missing
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
    PriceHistoryPoint:
      type: array
      description: A single price sample as a `[price, timestamp]` pair.
      prefixItems:
        - type: string
          description: Token price in USD
          example: '0.99978779'
        - type: integer
          description: Unix timestamp in seconds
          example: 1780272000
      minItems: 2
      maxItems: 2
      example:
        - '0.99978779'
        - 1780272000
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