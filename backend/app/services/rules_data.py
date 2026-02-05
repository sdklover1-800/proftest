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
    # --- SJT (Soft Skills) Rules ---
    "SJT_TEAMWORK_LOW": {
        "condition": lambda s: s.get("SJT", {}).get("teamwork", 100) <= 45,
        "text": "Strengthen collaboration: schedule a weekly team check-in and practice active listening techniques.",
        "tags": ["SoftSkills", "Teamwork"],
        "week": 3,
    },
    "SJT_STRESS_LOW": {
        "condition": lambda s: s.get("SJT", {}).get("stress", 100) <= 45,
        "text": "Stress management: use short breathing routines before deadlines and plan buffer time in your tasks.",
        "tags": ["SoftSkills", "Stress"],
        "week": 4,
    },
    "SJT_INITIATIVE_LOW": {
        "condition": lambda s: s.get("SJT", {}).get("initiative", 100) <= 45,
        "text": "Build initiative: choose one small improvement to propose each week in your projects.",
        "tags": ["SoftSkills", "Initiative"],
        "week": 2,
    },
    "SJT_SELF_ORG_LOW": {
        "condition": lambda s: s.get("SJT", {}).get("self_organization", 100) <= 45,
        "text": "Improve self-organization: break tasks into 3 daily priorities and review them each morning.",
        "tags": ["SoftSkills", "Self-Organization"],
        "week": 2,
    },
    # --- COGNITIVE Rules ---
    "COG_SPEED_LOW": {
        "condition": lambda s: s.get("COGNITIVE", {}).get("details", {}).get("processing_speed", 100) <= 45,
        "text": "Boost processing speed: practice timed pattern tasks for 10 minutes daily.",
        "tags": ["Cognitive", "Speed"],
        "week": 1,
    },
    "COG_MEMORY_LOW": {
        "condition": lambda s: s.get("COGNITIVE", {}).get("details", {}).get("working_memory", 100) <= 45,
        "text": "Strengthen memory: use short recall exercises (lists, sequences) for 5 minutes daily.",
        "tags": ["Cognitive", "Memory"],
        "week": 1,
    },
    "COG_ATTENTION_LOW": {
        "condition": lambda s: s.get("COGNITIVE", {}).get("details", {}).get("attention", 100) <= 45,
        "text": "Improve attention: reduce distractions and use 15-minute focus blocks with short breaks.",
        "tags": ["Cognitive", "Attention"],
        "week": 2,
    },
    "COG_LOGIC_LOW": {
        "condition": lambda s: s.get("COGNITIVE", {}).get("details", {}).get("logic", 100) <= 45,
        "text": "Enhance logic: solve short reasoning puzzles 2-3 times per week.",
        "tags": ["Cognitive", "Logic"],
        "week": 2,
    },
    # --- Combined career recommendations (all blocks) ---
    "CAREER_TECH_ANALYST": {
        "condition": lambda s: (
            s.get("RIASEC", {}).get("Investigative", 0) >= 60
            and s.get("BIG5", {}).get("Conscientiousness", 0) >= 55
            and s.get("SJT", {}).get("self_organization", 0) >= 50
            and s.get("COGNITIVE", {}).get("details", {}).get("logic", 0) >= 55
        ),
        "text": "You show a strong analytical profile. Consider careers like Data Analyst, QA Analyst, or Business Intelligence Specialist.",
        "tags": ["Career", "Analytical"],
        "week": 1,
    },
    "CAREER_ENGINEERING": {
        "condition": lambda s: (
            s.get("RIASEC", {}).get("Realistic", 0) >= 60
            and s.get("BIG5", {}).get("Conscientiousness", 0) >= 55
            and s.get("SJT", {}).get("initiative", 0) >= 50
            and s.get("COGNITIVE", {}).get("details", {}).get("processing_speed", 0) >= 55
        ),
        "text": "Your profile aligns with applied technical roles. Explore Engineering, Automation, or Technical Operations.",
        "tags": ["Career", "Technical"],
        "week": 1,
    },
    "CAREER_CREATIVE": {
        "condition": lambda s: (
            s.get("RIASEC", {}).get("Artistic", 0) >= 60
            and s.get("BIG5", {}).get("Openness", 0) >= 60
            and s.get("SJT", {}).get("teamwork", 0) >= 45
            and s.get("COGNITIVE", {}).get("details", {}).get("working_memory", 0) >= 45
        ),
        "text": "You lean toward creative and flexible work. Consider UX/UI, Content Design, or Creative Strategy roles.",
        "tags": ["Career", "Creative"],
        "week": 1,
    },
}
