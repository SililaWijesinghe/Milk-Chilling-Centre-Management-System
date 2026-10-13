from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.core.security import CurrentUser
from app.schemas.ai import ChatRequest, ChatResponse
from app.schemas.common import Envelope, ok
from app.services.llm import create_chat_completion, stream_chat_completion

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat", response_model=Envelope[ChatResponse])
def chat(
    request: ChatRequest,
    user: CurrentUser,
):
    """Generate non-streaming completion from Groq using openai/gpt-oss-120b."""
    messages = [msg.model_dump() for msg in request.messages]
    content = create_chat_completion(messages=messages, model=request.model)
    return ok(ChatResponse(content=content))


@router.post("/chat/stream")
def chat_stream(
    request: ChatRequest,
    user: CurrentUser,
):
    """Generate streaming completion from Groq using openai/gpt-oss-120b."""
    messages = [msg.model_dump() for msg in request.messages]

    def event_generator():
        for chunk in stream_chat_completion(messages=messages, model=request.model):
            yield chunk

    return StreamingResponse(event_generator(), media_type="text/plain")
