import { calculateQuote, PRICING_CONFIG_V1 } from "@/domain/quote";
import type {
  PricingConfigV1,
  QuoteInputV1,
  QuoteResultV1,
} from "@/domain/quote";

export function calculateResult(
  input: QuoteInputV1,
  config: PricingConfigV1 = PRICING_CONFIG_V1,
): QuoteResultV1 {
  const outcome = calculateQuote(input, config);
  if (!outcome.ok) {
    throw new Error(JSON.stringify(outcome.issues));
  }
  return outcome.result;
}
