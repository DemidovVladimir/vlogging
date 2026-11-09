# BigDecimal

High-precision decimal arithmetic for AaveKit

---

AaveKit represents all decimal numbers using the `BigDecimal` type to ensure high-precision arithmetic for financial computations. Whenever you interact with balances, rates, or amounts in the SDK, they are returned as `BigDecimal` instances.

```ts
// Import from AaveKit React
import { bigDecimal, BigDecimal } from "@aave/react";

// Import from AaveKit TypeScript
import { bigDecimal, BigDecimal } from "@aave/client";
```

**Key Features:**

- Arbitrary precision arithmetic
- Safe conversion from various numeric types
- Display formatting with adaptive precision
- Static utility methods for common operations
- Type-safe operations that return `BigDecimal` instances

> [!NOTE]
> `BigDecimal` is **immutable** — its methods never modify the instance in place
> but always return a new one. It is based on the
> [big.js](https://github.com/MikeMcl/big.js/) library and provides consistent
> behavior across Node.js and browser environments.

## Creating BigDecimals

```ts
// From string (recommended for precision)
const a = bigDecimal("123.456789");

// From number
const b = bigDecimal(123.456);

// From bigint
const c = bigDecimal(123456789n);
```

## Arithmetic Operations

All arithmetic operations return new `BigDecimal` instances, making them safe for immutable workflows.

### Addition

```ts
const a = bigDecimal("100");
const b = bigDecimal("50");

a.plus(b); // BigDecimal('150')
a.add(b); // Alias for .plus()
```

### Subtraction

```ts
const a = bigDecimal("100");
const b = bigDecimal("30");

a.minus(b); // BigDecimal('70')
a.sub(b); // Alias for .minus()
```

### Multiplication

```ts
const a = bigDecimal("10");
const b = bigDecimal("5");

a.times(b); // BigDecimal('50')
a.mul(b); // Alias for .times()
```

### Division

```ts
const a = bigDecimal("100");
const b = bigDecimal("3");

a.div(b); // BigDecimal('33.333...')

// Division by zero throws
bigDecimal("10").div("0"); // Throws: ±Infinity
bigDecimal("0").div("0"); // Throws: NaN
```

### Modulo

```ts
const a = bigDecimal("10");
const b = bigDecimal("3");

a.mod(b); // BigDecimal('1')
```

### Power

```ts
const a = bigDecimal("2");

a.pow(3); // BigDecimal('8')
a.pow(-1); // BigDecimal('0.5')

// Range: -1e+6 to 1e+6 inclusive
```

### Square Root

```ts
const a = bigDecimal("16");

a.sqrt(); // BigDecimal('4')

// Negative numbers throw
bigDecimal("-1").sqrt(); // Throws: NaN
```

### Absolute Value

```ts
const a = bigDecimal("-123.45");

a.abs(); // BigDecimal('123.45')
```

### Negation

```ts
const a = bigDecimal("123.45");

a.neg(); // BigDecimal('-123.45')
```

## Comparison Methods

All comparison methods are inherited from big.js:

```ts
const a = bigDecimal("100");
const b = bigDecimal("50");

a.gt(b); // true  - greater than
a.gte(b); // true  - greater than or equal
a.lt(b); // false - less than
a.lte(b); // false - less than or equal
a.eq(b); // false - equal to
a.cmp(b); // 1     - compare (-1, 0, or 1)
```

## Rounding & Precision

### Rounding Modes

```ts
enum RoundingMode {
  Down = 0, // Towards zero (truncate)
  HalfUp = 1, // Nearest neighbor; away from zero if equidistant
  HalfEven = 2, // Nearest neighbor; towards even if equidistant
  Up = 3, // Away from zero
}
```

### Round to Decimal Places

```ts
const a = bigDecimal("123.456789");

a.round(2, RoundingMode.HalfUp); // BigDecimal('123.46')
a.round(0, RoundingMode.Down); // BigDecimal('123')
a.round(); // BigDecimal('123') - defaults to 0 dp
```

### Round to Significant Digits

```ts
const a = bigDecimal("123.456789");

a.prec(4, RoundingMode.HalfUp); // BigDecimal('123.5')
a.prec(2, RoundingMode.Down); // BigDecimal('120')
```

## Scaling

Multiply by 10^decimals (commonly used for on-chain conversions):

```ts
const amount = bigDecimal("1.5");

// Scale up (e.g., ETH to wei)
amount.rescale(18); // BigDecimal('1500000000000000000')

// Scale down (e.g., wei to ETH)
const wei = bigDecimal("1500000000000000000");
wei.rescale(-18); // BigDecimal('1.5')
```

## Display Formatting

### Adaptive Precision Display

The `toDisplayString` method provides intelligent formatting based on number magnitude:

```ts
const large = bigDecimal("1234.5678");
const small = bigDecimal("0.0001234");

// For numbers >= 1: preserves integer digits, controls decimal precision
large.toDisplayString(6); // '1234.57' (all integer digits + 2 decimals)

// For numbers < 1: uses significant figures
small.toDisplayString(3); // '0.000123' (3 significant figures)
```

### Formatting Options

```ts
const num = bigDecimal("123.456789");

// Basic precision
num.toDisplayString(5);
// '123.46'

// With rounding mode
num.toDisplayString(4, { rounding: RoundingMode.Down });
// '123.4'

// With minimum fraction digits
num.toDisplayString(3, { minFractionDigits: 4 });
// '123.4568' (enforces 4 decimal places)

// Trim trailing zeros
num.toDisplayString(10, { trimTrailingZeros: true });
// '123.456789' (no trailing zeros)

// Combined options
bigDecimal("100.5000").toDisplayString(5, {
  minFractionDigits: 2,
  trimTrailingZeros: true,
});
// '100.5' (trims trailing zeros but respects minimum)
```

### Examples by Number Type

```ts
// Large numbers: preserves all integer digits
bigDecimal("1234567.89").toDisplayString(10);
// '1234567.890'

// Small decimals: significant figures
bigDecimal("0.00001234").toDisplayString(3);
// '0.0000123'

// Zero handling
bigDecimal("0").toDisplayString(5);
// '0'

bigDecimal("0").toDisplayString(3, { minFractionDigits: 2 });
// '0.00'
```

## Conversion Methods

### To String

```ts
const a = bigDecimal("123.456");

a.toString(); // '123.456'
a.toJSON(); // '123.456' (used by JSON.stringify)

a.toFixed(); // '123.456' (fixed-point notation)
a.toFixed(2); // '123.46' (2 decimal places)
a.toFixed(2, RoundingMode.Down); // '123.45' (with rounding mode)

a.toExponential(); // '1.23456e+2'
a.toExponential(2); // '1.23e+2' (2 decimal places)

a.toPrecision(); // '123.456'
a.toPrecision(2); // '1.2e+2' (2 significant digits)
a.toPrecision(4, RoundingMode.Down); // '123.4' (4 sig digits)
```

### To Number (Approximate)

Convert to JavaScript `number` with safe clamping:

```ts
const safe = bigDecimal("123.456");
safe.toApproximateNumber(); // 123.456

// Handles extreme values
const huge = bigDecimal("1e500");
huge.toApproximateNumber(); // Number.MAX_VALUE (clamped)

const tiny = bigDecimal("1e-500");
tiny.toApproximateNumber(); // 0 (subnormal → zero)

const negHuge = bigDecimal("-1e500");
negHuge.toApproximateNumber(); // -Number.MAX_VALUE (clamped)
```

**Use Cases:**

- Displaying approximate values in UI
- Interfacing with APIs requiring `number` types
- When precision loss is acceptable

> [!WARNING]
> Only use when precision loss is acceptable. For precise calculations, always
> use `BigDecimal` operations.

## Static Utility Methods

### Type Guard

```ts
const value: unknown = bigDecimal("123");

if (BigDecimal.isBigDecimal(value)) {
  // value is BigDecimal
  value.plus("10");
}
```

### Min/Max

```ts
const a = bigDecimal("100");
const b = bigDecimal("50");
const c = bigDecimal("75");

BigDecimal.min(a, b, c); // BigDecimal('50')
BigDecimal.max(a, b, c); // BigDecimal('100')

// Minimum two arguments required
BigDecimal.min(a, b); // BigDecimal('50')
```

## Best Practices

1. **Use string literals for precision:**

   ```ts
   // Good
   const amount = bigDecimal("0.1");

   // Risky (0.1 already has floating-point error)
   const amount = bigDecimal(0.1);
   ```

2. **Chain operations for clarity:**

   ```ts
   const result = bigDecimal("100")
     .times("1.05") // Apply 5% increase
     .round(2, RoundingMode.HalfUp);
   ```

3. **Store monetary values as BigDecimal:**

   ```ts
   interface Transaction {
     amount: BigDecimal; // Not number!
     currency: string;
   }
   ```

4. **Use toDisplayString() for UI formatting:**
   ```ts
   // Adaptive precision for display
   const formatted = balance.toDisplayString(6);
   ```
