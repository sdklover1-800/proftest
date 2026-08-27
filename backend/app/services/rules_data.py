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
        "module": "RIASEC",
        "scale": "Realistic",
        "band": "high",
        "text": "Your high Realistic score suggests you enjoy hands-on work. Consider exploring careers in Engineering, Robotics, or skilled trades.",
        "tags": ["Career", "Realistic"],
        "week": 1,  # Research phase
    },
    "RIASEC_I_HIGH": {
        "module": "RIASEC",
        "scale": "Investigative",
        "band": "high",
        "text": "You have a strong curious mind. Science, Research, and Data Analysis might be fulfilling paths for you.",
        "tags": ["Career", "Investigative"],
        "week": 1,  # Research phase
    },
    "RIASEC_A_HIGH": {
        "module": "RIASEC",
        "scale": "Artistic",
        "band": "high",
        "text": "Creativity is your strength. Look into Design, Writing, or Arts-related fields.",
        "tags": ["Career", "Artistic"],
        "week": 1,  # Research phase
    },
    # --- Action-oriented recommendations (Week 2) ---
    "RIASEC_S_HIGH": {
        "module": "RIASEC",
        "scale": "Social",
        "band": "high",
        "text": "Работа с людьми — ваша сильная сторона. Присмотритесь к преподаванию, психологии, медицине и социальным проектам.",
        "tags": ["Career", "Social"],
        "week": 1,
    },
    "RIASEC_E_HIGH": {
        "module": "RIASEC",
        "scale": "Enterprising",
        "band": "high",
        "text": "Вам близко влиять на результат и вести за собой. Продажи, управление проектами и предпринимательство стоят внимания.",
        "tags": ["Career", "Enterprising"],
        "week": 1,
    },
    "RIASEC_C_HIGH": {
        "module": "RIASEC",
        "scale": "Conventional",
        "band": "high",
        "text": "Вы уверенно работаете со структурой и порядком. Финансы, аналитика данных и администрирование подойдут вам.",
        "tags": ["Career", "Conventional"],
        "week": 1,
    },
    "RIASEC_R_ACTION": {
        "module": "RIASEC",
        "scale": "Realistic",
        "band": "high",
        "text": "Sign up for a hands-on workshop or DIY project this week to develop your practical skills.",
        "tags": ["Action", "Realistic"],
        "week": 2,
    },
    "RIASEC_I_ACTION": {
        "module": "RIASEC",
        "scale": "Investigative",
        "band": "high",
        "text": "Enroll in an online course or watch a webinar about a topic that fascinates you.",
        "tags": ["Action", "Investigative"],
        "week": 2,
    },
    # --- Big5 Rules ---
    "BIG5_O_HIGH": {
        "module": "BIG5",
        "scale": "Openness",
        "band": "high",
        "text": "You are very open to new experiences. Travel, learning new languages, or creative projects will keep you engaged.",
        "tags": ["Development", "Openness"],
        "week": 2,  # Action phase
    },
    "BIG5_O_LOW": {
        "module": "BIG5",
        "scale": "Openness",
        "band": "low",
        "text": "You prefer routine and familiarity. Try stepping out of your comfort zone once a week to boost adaptability.",
        "tags": ["Development", "Grow"],
        "week": 2,  # Action phase
    },
    # --- Social/Networking recommendations (Week 3) ---
    "BIG5_E_HIGH": {
        "module": "BIG5",
        "scale": "Extraversion",
        "band": "high",
        "text": "Connect with a professional community or attend a networking event in your field of interest.",
        "tags": ["Social", "Networking"],
        "week": 3,
    },
    "BIG5_E_LOW": {
        "module": "BIG5",
        "scale": "Extraversion",
        "band": "low",
        "text": "Find an online community or forum where you can discuss your interests at your own pace.",
        "tags": ["Social", "Networking"],
        "week": 3,
    },
    "BIG5_A_HIGH": {
        "module": "BIG5",
        "scale": "Agreeableness",
        "band": "high",
        "text": "Your empathy is a strength. Consider mentoring or volunteering to help others while building connections.",
        "tags": ["Social", "Volunteering"],
        "week": 3,
    },
    # --- Long-term planning (Week 4) ---
    "BIG5_C_HIGH": {
        "module": "BIG5",
        "scale": "Conscientiousness",
        "band": "high",
        "text": "Your discipline is a superpower. Create a 6-month career development plan with clear milestones.",
        "tags": ["Planning", "Conscientiousness"],
        "week": 4,
    },
    "BIG5_N_HIGH": {
        "module": "BIG5",
        "scale": "Neuroticism",
        "band": "high",
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
        "module": "SJT",
        "scale": "teamwork",
        "band": "low",
        "text": "Strengthen collaboration: schedule a weekly team check-in and practice active listening techniques.",
        "tags": ["SoftSkills", "Teamwork"],
        "week": 3,
    },
    "SJT_STRESS_LOW": {
        "module": "SJT",
        "scale": "stress",
        "band": "low",
        "text": "Stress management: use short breathing routines before deadlines and plan buffer time in your tasks.",
        "tags": ["SoftSkills", "Stress"],
        "week": 4,
    },
    "SJT_INITIATIVE_LOW": {
        "module": "SJT",
        "scale": "initiative",
        "band": "low",
        "text": "Build initiative: choose one small improvement to propose each week in your projects.",
        "tags": ["SoftSkills", "Initiative"],
        "week": 2,
    },
    "SJT_SELF_ORG_LOW": {
        "module": "SJT",
        "scale": "self_organization",
        "band": "low",
        "text": "Improve self-organization: break tasks into 3 daily priorities and review them each morning.",
        "tags": ["SoftSkills", "Self-Organization"],
        "week": 2,
    },
    # --- COGNITIVE Rules ---
    "COG_SPEED_LOW": {
        "module": "COGNITIVE",
        "scale": "processing_speed",
        "band": "low",
        "text": "Boost processing speed: practice timed pattern tasks for 10 minutes daily.",
        "tags": ["Cognitive", "Speed"],
        "week": 1,
    },
    "COG_MEMORY_LOW": {
        "module": "COGNITIVE",
        "scale": "working_memory",
        "band": "low",
        "text": "Strengthen memory: use short recall exercises (lists, sequences) for 5 minutes daily.",
        "tags": ["Cognitive", "Memory"],
        "week": 1,
    },
    "COG_ATTENTION_LOW": {
        "module": "COGNITIVE",
        "scale": "attention",
        "band": "low",
        "text": "Improve attention: reduce distractions and use 15-minute focus blocks with short breaks.",
        "tags": ["Cognitive", "Attention"],
        "week": 2,
    },
    "COG_LOGIC_LOW": {
        "module": "COGNITIVE",
        "scale": "logic",
        "band": "low",
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
