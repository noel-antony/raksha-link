from typing import Any, Callable, Dict, List, Type
from backend.events.bus import event_bus
from backend.events.domain import DomainEvent

class BaseAgent:
    """
    Base class for all managed agents in SentinelOS.
    Agents subscribe to domain events, reason over them, and publish new events.
    """
    def __init__(self, name: str):
        self.name = name
        self.subscriptions: List[Type[DomainEvent]] = []
        self._setup_subscriptions()

    def _setup_subscriptions(self):
        """Override this method to define event subscriptions."""
        pass

    def subscribe(self, event_type: Type[DomainEvent], handler: Callable[[DomainEvent], None]):
        """Subscribe to an event type on the global event bus."""
        self.subscriptions.append(event_type)
        event_bus.subscribe(event_type, handler)

    async def publish(self, event: DomainEvent):
        """Publish an event to the global event bus."""
        await event_bus.publish(event)
        
    async def reason(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Core reasoning loop. Override to implement LLM/Gemini integration.
        Returns a dictionary containing confidence, reasoning, and proposed actions.
        """
        raise NotImplementedError("Agents must implement their own reasoning logic.")
