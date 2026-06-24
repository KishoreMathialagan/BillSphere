from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, List

def quantize_currency(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def quantize_total(value: Decimal) -> Decimal:
    return value.quantize(Decimal("1"), rounding=ROUND_HALF_UP)

import re

def validate_gstin(gstin: str) -> bool:
    if not gstin or len(gstin) != 15:
        return False
    # Format: 2 digits (State), 10 char (PAN), 1 char (Entity), 1 char (Z), 1 char (Checksum)
    pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    if not re.match(pattern, gstin):
        return False
    return True

def calculate_line_item(
    quantity: Decimal,
    unit_price: Decimal,
    discount_type: str,
    discount_value: Decimal,
    gst_rate: Decimal,
    is_inclusive: bool,
    seller_state: str,
    buyer_state: str
) -> Dict[str, Decimal]:
    
    # 1. Base Taxable Value
    base_value = quantity * unit_price
    
    # 2. Discount
    if discount_type == "PERCENTAGE":
        discount_amount = (base_value * discount_value / Decimal("100"))
    else: # FIXED
        discount_amount = discount_value

    net_taxable_base = base_value - discount_amount

    # 3. Handle Inclusive / Exclusive
    if is_inclusive:
        # If inclusive, the net_taxable_base is actually the total including GST
        # Taxable Amount = Inclusive Price * 100 / (100 + GST Rate)
        taxable_amount = net_taxable_base * Decimal("100") / (Decimal("100") + gst_rate)
        gst_amount = net_taxable_base - taxable_amount
    else:
        # If exclusive, calculate GST on top
        taxable_amount = net_taxable_base
        gst_amount = taxable_amount * gst_rate / Decimal("100")
        
    taxable_amount = quantize_currency(taxable_amount)
    gst_amount = quantize_currency(gst_amount)
    
    # 4. Intra/Interstate Routing
    is_intrastate = (seller_state.strip().lower() == buyer_state.strip().lower())
    
    if is_intrastate:
        cgst_rate = gst_rate / Decimal("2")
        sgst_rate = gst_rate / Decimal("2")
        igst_rate = Decimal("0.00")
        
        cgst_amount = quantize_currency(taxable_amount * cgst_rate / Decimal("100"))
        sgst_amount = quantize_currency(taxable_amount * sgst_rate / Decimal("100"))
        igst_amount = Decimal("0.00")
        
        # Ensure CGST + SGST perfectly equals the intended GST amount
        # Sometimes there's a penny difference due to 50/50 rounding
        diff = gst_amount - (cgst_amount + sgst_amount)
        if diff != Decimal("0"):
            cgst_amount += diff # Arbitrarily adjust CGST to make sums match perfectly
    else:
        cgst_rate = Decimal("0.00")
        sgst_rate = Decimal("0.00")
        igst_rate = gst_rate
        
        cgst_amount = Decimal("0.00")
        sgst_amount = Decimal("0.00")
        igst_amount = gst_amount

    line_total = taxable_amount + gst_amount
    
    return {
        "taxable_amount": taxable_amount,
        "discount_amount": quantize_currency(discount_amount),
        "gst_rate": gst_rate,
        "cgst_rate": cgst_rate,
        "sgst_rate": sgst_rate,
        "igst_rate": igst_rate,
        "cgst_amount": cgst_amount,
        "sgst_amount": sgst_amount,
        "igst_amount": igst_amount,
        "gst_amount": gst_amount,
        "subtotal": line_total
    }

def calculate_invoice_totals(line_items: List[Dict[str, Decimal]]) -> Dict[str, Decimal]:
    subtotal = Decimal("0.00")
    total_cgst = Decimal("0.00")
    total_sgst = Decimal("0.00")
    total_igst = Decimal("0.00")
    total_gst = Decimal("0.00")
    total_discount = Decimal("0.00")
    
    for item in line_items:
        subtotal += item["taxable_amount"]
        total_cgst += item["cgst_amount"]
        total_sgst += item["sgst_amount"]
        total_igst += item["igst_amount"]
        total_gst += item["gst_amount"]
        total_discount += item.get("discount_amount", Decimal("0.00"))

    actual_grand_total = subtotal + total_gst
    rounded_grand_total = quantize_total(actual_grand_total)
    round_off = rounded_grand_total - actual_grand_total
    
    return {
        "total_amount": rounded_grand_total,
        "total_tax": total_gst,
        "total_cgst": total_cgst,
        "total_sgst": total_sgst,
        "total_igst": total_igst,
        "total_discount": total_discount,
        "round_off": quantize_currency(round_off)
    }
