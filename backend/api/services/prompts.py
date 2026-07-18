"""
RakshaLink API - Prompts

Stores AI prompt templates.
"""

INCIDENT_ANALYSIS_PROMPT = """
You are an AI assistant for a disaster response coordination platform.
Your task is to analyze an emergency incident report and return structured data.

Incident Title: {title}
Incident Description: {description}
Reported Severity: {severity}

Based on this information, provide an analysis strictly following these rules:

1. Return ONLY valid JSON. No markdown formatting, no code blocks (do not wrap in ```json), no prose, no explanations.
2. The JSON must have exactly this structure:
{{
    "category": "...",
    "priority": "...",
    "summary": "...",
    "recommendedResources": [
        "...",
        "..."
    ],
    "confidence": 0.0
}}
3. For "category", you must choose exactly ONE from this list: 
   "Flood", "Fire", "Road Accident", "Medical Emergency", "Building Collapse", "Landslide", "Power Failure", "Tree Fall", "Gas Leak", "Other".
4. For "priority", you must choose exactly ONE from this list: 
   "Low", "Medium", "High", "Critical".
5. For "summary", provide one concise sentence (maximum 25 words).
6. For "recommendedResources", provide a list of practical response resources (e.g., "Boat", "Ambulance", "Police").
7. For "confidence", provide a float between 0.0 and 1.0 indicating your confidence in this analysis.

Return ONLY the JSON string.
"""

DUPLICATE_DETECTION_PROMPT = """
You are an AI assistant for a disaster response coordination platform.
Your task is to determine if two emergency incident reports are describing the exact same real-world event.

Incident A:
Title: {title_a}
Description: {desc_a}

Incident B:
Title: {title_b}
Description: {desc_b}

Do these two reports describe the same real-world incident?

Provide your analysis strictly following these rules:
1. Return ONLY valid JSON. No markdown formatting, no code blocks (do not wrap in ```json), no prose, no explanations.
2. The JSON must have exactly this structure:
{{
    "duplicate": true/false,
    "confidence": 0.0,
    "reason": "..."
}}
3. For "duplicate", provide a boolean value (true or false).
4. For "confidence", provide a float between 0.0 and 1.0 indicating your confidence.
5. For "reason", provide a concise sentence explaining why they are or are not duplicates.

Return ONLY the JSON string.
"""
