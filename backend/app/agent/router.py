from langchain_groq import ChatGroq
from app.config import get_settings

class ModelRouter:
    def __init__(self):
        settings = get_settings()
        self.groq_api_key = settings.GROQ_API_KEY
        self.temperature = settings.TEMPERATURE
        
        # Fetch configured models from settings or defaults
        self.extraction_model_name = getattr(settings, "EXTRACTION_MODEL_NAME", "llama-3.3-70b-versatile")
        self.conversational_model_name = getattr(settings, "CONVERSATIONAL_MODEL_NAME", "llama-3.1-8b-instant")
        
    def get_extraction_model(self, temperature: float = None):
        t = temperature if temperature is not None else self.temperature
        return ChatGroq(
            model=self.extraction_model_name,
            api_key=self.groq_api_key,
            temperature=t
        )
        
    def get_conversational_model(self, temperature: float = None):
        t = temperature if temperature is not None else self.temperature
        return ChatGroq(
            model=self.conversational_model_name,
            api_key=self.groq_api_key,
            temperature=t
        )
