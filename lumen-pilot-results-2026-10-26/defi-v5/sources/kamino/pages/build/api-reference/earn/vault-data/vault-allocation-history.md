> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get historical KVault allocation volume

> Get historical Kamino Earn Vault allocation volume for a given vault and date range (max 1 year)



## OpenAPI

````yaml kamino-api.json GET /kvaults/vaults/{pubkey}/allocation-volume/history
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
  /kvaults/vaults/{pubkey}/allocation-volume/history:
    get:
      tags:
        - Kamino Earn Vaults
      summary: Get historical KVault allocation volume
      description: >-
        Get historical Kamino Earn Vault allocation volume for a given vault and
        date range (max 1 year)
      parameters:
        - schema:
            $ref: '#/components/schemas/AddressBase58'
          required: true
          description: Valid base58-encoded address
          name: pubkey
          in: path
        - schema:
            anyOf:
              - type: string
              - type: number
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
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    timestamp:
                      type: string
                      format: date-time
                      description: Timestamp of the investment volume data point
                    volumeUsd:
                      allOf:
                        - $ref: '#/components/schemas/Decimal'
                        - description: Investment volume in USD
                  required:
                    - timestamp
                    - volumeUsd
                description: Array of investment volume data points
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
    Decimal:
      type: string
      description: Decimal value represented as string
      example: '1234.56789'
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