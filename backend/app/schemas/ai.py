from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the author (e.g. system, user, assistant)")
    content: str = Field(..., description="Content of the message")


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    stream: bool = False
    model: str | None = None


class ChatResponse(BaseModel):
    content: str
