"""
This module contains the "Knowledge Base" for the rule-based recommendation engine.
It maps specific score patterns to advice text.
"""

RECOMMENDATION_RULES = {
    # --- RIASEC Rules ---
    "RIASEC_R_HIGH": {
        "condition": lambda s: s.get("RIASEC", {}).get("Realistic", 0) >= 20,
        "text": "Your high Realistic score suggests you enjoy hands-on work. Consider exploring careers in Engineering, Robotics, or skilled trades.",
        "tags": ["Career", "Realistic"]
    },
    "RIASEC_I_HIGH": {
        "condition": lambda s: s.get("RIASEC", {}).get("Investigative", 0) >= 20,
        "text": "You have a strong curious mind. Science, Research, and Data Analysis might be fulfilling paths for you.",
        "tags": ["Career", "Investigative"]
    },
    "RIASEC_A_HIGH": {
        "condition": lambda s: s.get("RIASEC", {}).get("Artistic", 0) >= 20,
        "text": "Creativity is your strength. Look into Design, Writing, or Arts-related fields.",
        "tags": ["Career", "Artistic"]
    },
    
    # --- Big5 Rules ---
    "BIG5_O_HIGH": {
        "condition": lambda s: s.get("BIG5", {}).get("Openness", 0) >= 20,
        "text": "You are very open to new experiences. Travel, learning new languages, or creative projects will keep you engaged.",
        "tags": ["Development", "Openness"]
    },
    "BIG5_O_LOW": {
        "condition": lambda s: s.get("BIG5", {}).get("Openness", 0) <= 12,
        "text": "You prefer routine and familiarity. Try to step out of your comfort zone once a week to boost your adaptability.",
        "tags": ["Development", "Grow"]
    },
    "BIG5_C_HIGH": {
        "condition": lambda s: s.get("BIG5", {}).get("Conscientiousness", 0) >= 20,
        "text": "Your discipline is a superpower. You would excel in project management or anything requiring high organizational skills.",
        "tags": ["Strength", "Conscientiousness"]
    },
    "BIG5_N_HIGH": {
        "condition": lambda s: s.get("BIG5", {}).get("Neuroticism", 0) >= 20,
        "text": "You may be prone to stress. Mindfulness practices or structured planning can help you manage anxiety effectively.",
        "tags": ["Well-being", "Balance"]
    }
}
