import os

GROQ_KEY = os.getenv("GROQ_API_KEY", "")


def chat(messages: list, model: str = "llama-3.3-70b-versatile", max_tokens: int = 400, temperature: float = 0.3) -> str:
    if not GROQ_KEY:
        return "GROQ_API_KEY not configured."
    try:
        from groq import Groq
        client = Groq(api_key=GROQ_KEY)
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"LLM error: {str(e)}"
