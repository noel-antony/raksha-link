from typing import Any, Dict, List, Optional
import uuid
from backend.events.bus import event_bus
from backend.events.domain import WorldModelUpdated

class GraphNode:
    def __init__(self, node_id: str, label: str, properties: Dict[str, Any]):
        self.node_id = node_id
        self.label = label  # e.g., 'Responder', 'Incident', 'Hospital', 'Hazard'
        self.properties = properties

class GraphEdge:
    def __init__(self, edge_id: str, source_id: str, target_id: str, relation: str, properties: Dict[str, Any]):
        self.edge_id = edge_id
        self.source_id = source_id
        self.target_id = target_id
        self.relation = relation  # e.g., 'ASSIGNED_TO', 'LOCATED_NEAR', 'AFFECTS'
        self.properties = properties

class WorldModelGraph:
    """
    Continuous Graph-Based State for SentinelOS.
    Shared by all agents to maintain a consistent view of reality.
    """
    def __init__(self):
        self._nodes: Dict[str, GraphNode] = {}
        self._edges: Dict[str, GraphEdge] = {}

    async def add_node(self, label: str, properties: Dict[str, Any], node_id: Optional[str] = None) -> str:
        """Adds a node to the world model and emits an event."""
        if not node_id:
            node_id = str(uuid.uuid4())
            
        node = GraphNode(node_id, label, properties)
        self._nodes[node_id] = node
        
        # Emitting update event
        await event_bus.publish(WorldModelUpdated(
            event_id=str(uuid.uuid4()),
            source="WorldModel",
            entity_id=node_id,
            entity_type="Node",
            updates={"action": "add", "label": label, "properties": properties}
        ))
        return node_id

    async def update_node(self, node_id: str, properties: Dict[str, Any]):
        """Updates a node's properties and emits an event."""
        if node_id in self._nodes:
            self._nodes[node_id].properties.update(properties)
            
            await event_bus.publish(WorldModelUpdated(
                event_id=str(uuid.uuid4()),
                source="WorldModel",
                entity_id=node_id,
                entity_type="Node",
                updates={"action": "update", "properties": properties}
            ))

    async def add_edge(self, source_id: str, target_id: str, relation: str, properties: Optional[Dict[str, Any]] = None) -> str:
        """Adds an edge (relationship) between two nodes."""
        edge_id = str(uuid.uuid4())
        props = properties or {}
        edge = GraphEdge(edge_id, source_id, target_id, relation, props)
        self._edges[edge_id] = edge
        
        await event_bus.publish(WorldModelUpdated(
            event_id=str(uuid.uuid4()),
            source="WorldModel",
            entity_id=edge_id,
            entity_type="Edge",
            updates={"action": "add", "source": source_id, "target": target_id, "relation": relation, "properties": props}
        ))
        return edge_id

    def get_node(self, node_id: str) -> Optional[GraphNode]:
        return self._nodes.get(node_id)
        
    def get_nodes_by_label(self, label: str) -> List[GraphNode]:
        return [n for n in self._nodes.values() if n.label == label]

    def get_adjacent_nodes(self, node_id: str, relation: Optional[str] = None) -> List[GraphNode]:
        """Gets connected nodes, optionally filtering by relationship type."""
        adjacent = []
        for edge in self._edges.values():
            if relation and edge.relation != relation:
                continue
            if edge.source_id == node_id:
                if target := self._nodes.get(edge.target_id):
                    adjacent.append(target)
            elif edge.target_id == node_id:
                if source := self._nodes.get(edge.source_id):
                    adjacent.append(source)
        return adjacent

# Global singleton representing the live world state
world_model = WorldModelGraph()
