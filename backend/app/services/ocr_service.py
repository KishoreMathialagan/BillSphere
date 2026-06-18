import pytesseract
from PIL import Image
import io
import json
import os

from app.services.llm_provider import get_llm_provider

# Ensure tesseract path is set for Windows if installed via winget
# Default winget install path is usually C:\Program Files\Tesseract-OCR\tesseract.exe
tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
if os.path.exists(tesseract_path):
    pytesseract.pytesseract.tesseract_cmd = tesseract_path

def extract_invoice_data(image_bytes: bytes, ai_model: str) -> dict:
    """
    1. Runs Tesseract OCR on the image bytes.
    2. Sends the raw text to OpenRouter to structure as JSON.
    """
    try:
        # 1. OCR Extraction
        image = Image.open(io.BytesIO(image_bytes))
        raw_text = pytesseract.image_to_string(image)
        
        if not raw_text.strip():
            return {"error": "No text found in image", "confidence": 0}
            
        # 2. AI Structuring
        provider = get_llm_provider()
        
        system_prompt = """
You are a highly accurate Invoice Data Extraction Assistant.
You will be provided with raw text extracted via Tesseract OCR from a supplier invoice.
Your job is to parse this messy text and output a CLEAN, VALID JSON object matching this schema EXACTLY:

{
  "vendor_name": "string",
  "invoice_number": "string",
  "invoice_date": "YYYY-MM-DD",
  "items": [
    {
      "name": "string",
      "quantity": number,
      "unit_price": number,
      "discount": number (0 if none),
      "cgst": number (0 if none),
      "sgst": number (0 if none),
      "igst": number (0 if none),
      "tax_percentage": number
    }
  ],
  "total_amount": number,
  "confidence": number (your estimated confidence score between 0 and 100 based on text quality)
}

RULES:
- Return ONLY the JSON object. Do not wrap it in markdown code blocks like ```json ... ```. 
- Output plain raw JSON string.
- If a field cannot be found, leave it as null or 0.
- Ensure all numbers are floats/integers, not strings.
"""
        
        json_str = provider.generate_response(prompt=raw_text, system_prompt=system_prompt, model=ai_model)
        
        # Clean up potential markdown formatting if the LLM disobeys the prompt
        if json_str.startswith("```json"):
            json_str = json_str.replace("```json", "", 1)
            if json_str.endswith("```"):
                json_str = json_str[:-3]
        elif json_str.startswith("```"):
            json_str = json_str.replace("```", "", 1)
            if json_str.endswith("```"):
                json_str = json_str[:-3]
                
        json_str = json_str.strip()
        
        # Parse JSON
        structured_data = json.loads(json_str)
        return structured_data
        
    except Exception as e:
        print(f"OCR Pipeline Error: {str(e)}")
        raise e
