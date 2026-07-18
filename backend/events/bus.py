import asyncio
from typing import Callable, Dict, List, Type
from .domain import DomainEvent

class EventBus:
    """
    In-memory pub/sub Event Bus for SentinelOS.
    All agent communication occurs through this bus using immutable domain events.
    """
    def __init__(self):
        # Maps event type (class) to a list of async subscriber callbacks
        self._subscribers: Dict[Type[DomainEvent], List[Callable[[DomainEvent], None]]] = {}
        # Stores a history of all events for audit and replay mode
        self._event_history: List[DomainEvent] = []

    def subscribe(self, event_type: Type[DomainEvent], callback: Callable[[DomainEvent], None]):
        """Subscribe an agent callback to a specific domain event type."""
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)
        print(f"[EventBus] Subscribed {callback.__name__} to {event_type.__name__}")

    async def publish(self, event: DomainEvent):
        """Publish a domain event to all registered subscribers."""
        self._event_history.append(event)
        event_type = type(event)
        print(f"[EventBus] Emitted {event_type.__name__}: {event.event_id} from {event.source}")
        
        if event_type in self._subscribers:
            # Create a task for each subscriber to handle the event asynchronously
            tasks = []
            for callback in self._subscribers[event_type]:
                # Assuming callbacks are async
                tasks.append(asyncio.create_task(callback(event)))
            
            if tasks:
                await asyncio.gather(*tasks)

    def get_history(self) -> List[DomainEvent]:
        """Returns the immutable audit log of all events."""
        return list(self._event_history)

# Global singleton event bus
event_bus = EventBus()
