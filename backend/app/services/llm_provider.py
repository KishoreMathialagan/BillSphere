import os
import requests
import json
from abc import ABC, abstractmethod

class LLMProvider(ABC):
    @abstractmethod
    def generate_response(self, prompt: str, system_prompt: str, model: str) -> str:
        pass

class OpenRouterProvider(LLMProvider):
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions")
        
        # Primary fallback model from ADR
        self.fallback_model = "deepseek/deepseek-chat"
        self.default_model = os.getenv("DEFAULT_MODEL", "qwen/qwen-2.5-7b-instruct")

    def generate_response(self, prompt: str, system_prompt: str, model: str) -> str:
        if not self.api_key:
            return "Error: OPENROUTER_API_KEY environment variable is not set. Please configure it to use the AI Assistant."

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "http://localhost:3000", # Required by OpenRouter
            "X-Title": "Vendor Mind",
            "Content-Type": "application/json"
        }

        def make_request(target_model):
            payload = {
                "model": target_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7
            }
            try:
                response = requests.post(self.base_url, headers=headers, json=payload, timeout=30)
                if response.status_code == 200:
                    data = response.json()
                    return data['choices'][0]['message']['content']
                else:
                    return None
            except Exception as e:
                print(f"OpenRouter Error with model {target_model}: {str(e)}")
                return None

        # Try primary configured model
        result = make_request(model or self.default_model)
        if result:
            return result

        # Fallback Strategy: Qwen3 -> DeepSeek Chat
        print(f"Fallback triggered. Attempting {self.fallback_model}")
        result = make_request(self.fallback_model)
        if result:
            return result
            
        return "Sorry, I am currently unable to reach the AI models. Please try again later."

# Factory pattern to allow easy swapping in the future
def get_llm_provider() -> LLMProvider:
    return OpenRouterProvider()
