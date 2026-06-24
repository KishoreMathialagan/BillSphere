export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type TaxMode = 'INCLUSIVE' | 'EXCLUSIVE';

export interface TaxEngineLineItemInput {
  quantity: number;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
  gstRate: number;
  isInclusive: boolean;
  sellerState: string;
  buyerState: string;
}

export interface TaxEngineLineItemResult {
  taxableAmount: number;
  discountAmount: number;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  gstAmount: number;
  subtotal: number;
}

export interface TaxEngineInvoiceResult {
  totalAmount: number;
  totalTax: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalDiscount: number;
  roundOff: number;
}

function quantize(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function calculateLineItem(input: TaxEngineLineItemInput): TaxEngineLineItemResult {
  const { quantity, unitPrice, discountType, discountValue, gstRate, isInclusive, sellerState, buyerState } = input;

  const baseValue = quantity * unitPrice;

  let discountAmount = 0;
  if (discountType === 'PERCENTAGE') {
    discountAmount = (baseValue * discountValue) / 100;
  } else {
    discountAmount = discountValue;
  }

  const netTaxableBase = baseValue - discountAmount;

  let taxableAmount = 0;
  let gstAmount = 0;

  if (isInclusive) {
    taxableAmount = (netTaxableBase * 100) / (100 + gstRate);
    gstAmount = netTaxableBase - taxableAmount;
  } else {
    taxableAmount = netTaxableBase;
    gstAmount = (taxableAmount * gstRate) / 100;
  }

  taxableAmount = quantize(taxableAmount, 2);
  gstAmount = quantize(gstAmount, 2);

  const isIntrastate = sellerState.trim().toLowerCase() === buyerState.trim().toLowerCase();

  let cgstRate = 0, sgstRate = 0, igstRate = 0;
  let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;

  if (isIntrastate) {
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;

    cgstAmount = quantize((taxableAmount * cgstRate) / 100, 2);
    sgstAmount = quantize((taxableAmount * sgstRate) / 100, 2);

    const diff = quantize(gstAmount - (cgstAmount + sgstAmount), 2);
    if (diff !== 0) {
      cgstAmount = quantize(cgstAmount + diff, 2);
    }
  } else {
    igstRate = gstRate;
    igstAmount = gstAmount;
  }

  const lineTotal = quantize(taxableAmount + gstAmount, 2);

  return {
    taxableAmount,
    discountAmount: quantize(discountAmount, 2),
    gstRate,
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    gstAmount,
    subtotal: lineTotal,
  };
}

export function calculateInvoiceTotals(lineItems: TaxEngineLineItemResult[]): TaxEngineInvoiceResult {
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalGst = 0;
  let totalDiscount = 0;

  for (const item of lineItems) {
    subtotal += item.taxableAmount;
    totalCgst += item.cgstAmount;
    totalSgst += item.sgstAmount;
    totalIgst += item.igstAmount;
    totalGst += item.gstAmount;
    totalDiscount += item.discountAmount;
  }

  const actualGrandTotal = subtotal + totalGst;
  const roundedGrandTotal = Math.round(actualGrandTotal);
  const roundOff = quantize(roundedGrandTotal - actualGrandTotal, 2);

  return {
    totalAmount: roundedGrandTotal,
    totalTax: quantize(totalGst, 2),
    totalCgst: quantize(totalCgst, 2),
    totalSgst: quantize(totalSgst, 2),
    totalIgst: quantize(totalIgst, 2),
    totalDiscount: quantize(totalDiscount, 2),
    roundOff,
  };
}
