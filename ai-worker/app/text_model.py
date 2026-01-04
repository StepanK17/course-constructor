from typing import Optional

import logging
import requests

from app.config import settings
from app.prompts import COURSE_PROMPT

logger = logging.getLogger("ai-worker")


class TextGenerator:
    def generate(self, topic: str, goal: str, context: str) -> str:
        if not settings.openrouter_api_key:
            raise RuntimeError("OPENROUTER_API_KEY is required for text generation")

        prompt = COURSE_PROMPT.format(topic=topic, goal=goal, context=context)
        content, reasoning, data = self._request(
            prompt, reasoning_max_tokens=settings.openrouter_reasoning_max_tokens
        )
        if content.strip():
            return content

        if reasoning and settings.openrouter_reasoning_fallback:
            logger.warning("openrouter_reasoning_fallback_used")
            rewrite_prompt = (
                "Перепиши текст ниже в итоговый учебный материал без рассуждений. "
                "Соблюдай структуру с заголовками #, ##, ### и разделами "
                "\"Практика\", \"Квиз\", \"Источники\".\n\n"
                f"Текст:\n{reasoning}"
            )
            content, _, _ = self._request(rewrite_prompt, reasoning_max_tokens=None)
            if content.strip():
                return content

        logger.error("openrouter_empty_content response=%s", data)
        raise RuntimeError("OpenRouter returned empty content")

    def _request(self, prompt: str, reasoning_max_tokens: int | None = None) -> tuple[str, str, dict]:
        payload = {
            "model": settings.openrouter_model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": settings.max_new_tokens,
            "temperature": settings.temperature,
            "top_p": settings.top_p,
            "stream": False,
        }
        if reasoning_max_tokens is not None and reasoning_max_tokens > 0:
            payload["reasoning"] = {"max_tokens": reasoning_max_tokens}
        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": settings.openrouter_referer,
            "X-Title": settings.openrouter_app_name,
        }

        response = requests.post(
            f"{settings.openrouter_base_url}/chat/completions",
            json=payload,
            headers=headers,
            timeout=120,
        )
        response.raise_for_status()
        data = response.json()
        if "error" in data:
            raise RuntimeError(f"OpenRouter error: {data['error']}")
        choices = data.get("choices", [])
        if not choices:
            logger.error("openrouter_empty_choices response=%s", data)
            raise RuntimeError("OpenRouter returned empty choices")
        message = choices[0].get("message", {})
        content = message.get("content", "") or ""
        reasoning = message.get("reasoning", "") or ""
        return content, reasoning, data


_generator: Optional[TextGenerator] = None


def get_generator() -> TextGenerator:
    global _generator
    if _generator is None:
        _generator = TextGenerator()
    return _generator
