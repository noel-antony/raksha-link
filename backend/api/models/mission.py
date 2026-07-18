from enum import Enum

class MissionStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class AssignmentStatus(str, Enum):
    ASSIGNED = "Assigned"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"
    COMPLETED = "Completed"
