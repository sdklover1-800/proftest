"""
This module contains the "Knowledge Base" for the rule-based recommendation engine.
It maps specific score patterns to advice text.

Week assignments:
- Week 1: Research & Exploration
- Week 2: Action & Practice
- Week 3: Social & Networking
- Week 4: Long-term Planning
"""

RECOMMENDATION_RULES = {
    # --- RIASEC Rules ---
    "RIASEC_R_HIGH": {
        "condition": lambda s: s.get("RIASEC", {}).get("Realistic", 0) >= 20,
        "text": "Your high Realistic score suggests you enjoy hands-on work. Consider exploring careers in Engineering, Robotics, or skilled trades.",
        "tags": ["Career", "Realistic"],
        "week": 1,  # Research phase
    },
    "RIASEC_I_HIGH": {
        "condition": lambda s: s.get("RIASEC", {}).get("Investigative", 0) >= 20,
        "text": "You have a strong curious mind. Science, Research, and Data Analysis might be fulfilling paths for you.",
        "tags": ["Career", "Investigative"],
        "week": 1,  # Research phase
    },
    "RIASEC_A_HIGH": {
        "condition": lambda s: s.get("RIASEC", {}).get("Artistic", 0) >= 20,
        "text": "Creativity is your strength. Look into Design, Writing, or Arts-related fields.",
        "tags": ["Career", "Artistic"],
        "week": 1,  # Research phase
    },
    # --- Action-oriented recommendations (Week 2) ---
    "RIASEC_R_ACTION": {
        "condition": lambda s: s.get("RIASEC", {}).get("Realistic", 0) >= 15,
        "text": "Sign up for a hands-on workshop or DIY project this week to develop your practical skills.",
        "tags": ["Action", "Realistic"],
        "week": 2,
    },
    "RIASEC_I_ACTION": {
        "condition": lambda s: s.get("RIASEC", {}).get("Investigative", 0) >= 15,
        "text": "Enroll in an online course or watch a webinar about a topic that fascinates you.",
        "tags": ["Action", "Investigative"],
        "week": 2,
    },
    # --- Big5 Rules ---
    "BIG5_O_HIGH": {
        "condition": lambda s: s.get("BIG5", {}).get("Openness", 0) >= 20,
        "text": "You are very open to new experiences. Travel, learning new languages, or creative projects will keep you engaged.",
        "tags": ["Development", "Openness"],
        "week": 2,  # Action phase
    },
    "BIG5_O_LOW": {
        "condition": lambda s: s.get("BIG5", {}).get("Openness", 0) <= 12,
        "text": "You prefer routine and familiarity. Try stepping out of your comfort zone once a week to boost adaptability.",
        "tags": ["Development", "Grow"],
        "week": 2,  # Action phase
    },
    # --- Social/Networking recommendations (Week 3) ---
    "BIG5_E_HIGH": {
        "condition": lambda s: s.get("BIG5", {}).get("Extraversion", 0) >= 18,
        "text": "Connect with a professional community or attend a networking event in your field of interest.",
        "tags": ["Social", "Networking"],
        "week": 3,
    },
    "BIG5_E_LOW": {
        "condition": lambda s: s.get("BIG5", {}).get("Extraversion", 0) <= 12,
        "text": "Find an online community or forum where you can discuss your interests at your own pace.",
        "tags": ["Social", "Networking"],
        "week": 3,
    },
    "BIG5_A_HIGH": {
        "condition": lambda s: s.get("BIG5", {}).get("Agreeableness", 0) >= 20,
        "text": "Your empathy is a strength. Consider mentoring or volunteering to help others while building connections.",
        "tags": ["Social", "Volunteering"],
        "week": 3,
    },
    # --- Long-term planning (Week 4) ---
    "BIG5_C_HIGH": {
        "condition": lambda s: s.get("BIG5", {}).get("Conscientiousness", 0) >= 20,
        "text": "Your discipline is a superpower. Create a 6-month career development plan with clear milestones.",
        "tags": ["Planning", "Conscientiousness"],
        "week": 4,
    },
    "BIG5_N_HIGH": {
        "condition": lambda s: s.get("BIG5", {}).get("Neuroticism", 0) >= 20,
        "text": "Build a long-term stress management routine. Include weekly mindfulness practices in your schedule.",
        "tags": ["Well-being", "Balance"],
        "week": 4,
    },
    "CAREER_PLAN": {
        "condition": lambda s: True,  # Always include for everyone
        "text": "Review your progress over the past 3 weeks and set 3 concrete career goals for the next quarter.",
        "tags": ["Planning", "Goals"],
        "week": 4,
    },
}
