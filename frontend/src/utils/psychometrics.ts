export interface Archetype {
    title: string;
    emoji: string;
    description: string;
}



export const RIASEC_ARCHETYPES: Record<string, Archetype> = {
    'Realistic': {
        title: "archetypes.riasec.realistic.title",
        emoji: "🛠️",
        description: "archetypes.riasec.realistic.description"
    },
    'Investigative': {
        title: "archetypes.riasec.investigative.title",
        emoji: "🔍",
        description: "archetypes.riasec.investigative.description"
    },
    'Artistic': {
        title: "archetypes.riasec.artistic.title",
        emoji: "🎨",
        description: "archetypes.riasec.artistic.description"
    },
    'Social': {
        title: "archetypes.riasec.social.title",
        emoji: "🤝",
        description: "archetypes.riasec.social.description"
    },
    'Enterprising': {
        title: "archetypes.riasec.enterprising.title",
        emoji: "🚀",
        description: "archetypes.riasec.enterprising.description"
    },
    'Conventional': {
        title: "archetypes.riasec.conventional.title",
        emoji: "📋",
        description: "archetypes.riasec.conventional.description"
    }
};

export const BIG5_ARCHETYPES: Record<string, Archetype> = {
    'Openness': {
        title: "archetypes.big5.openness.title",
        emoji: "💡",
        description: "archetypes.big5.openness.description"
    },
    'Conscientiousness': {
        title: "archetypes.big5.conscientiousness.title",
        emoji: "📅",
        description: "archetypes.big5.conscientiousness.description"
    },
    'Extraversion': {
        title: "archetypes.big5.extraversion.title",
        emoji: "🗣️",
        description: "archetypes.big5.extraversion.description"
    },
    'Agreeableness': {
        title: "archetypes.big5.agreeableness.title",
        emoji: "🕊️",
        description: "archetypes.big5.agreeableness.description"
    },
    'Neuroticism': {
        title: "archetypes.big5.neuroticism.title",
        emoji: "⚡",
        description: "archetypes.big5.neuroticism.description"
    }
};

export const getArchetype = (type: 'RIASEC' | 'BIG5', key: string): Archetype => {
    const map = type === 'RIASEC' ? RIASEC_ARCHETYPES : BIG5_ARCHETYPES;
    // Handle approximate matches or localization/case issues if needed
    // For now, simple lookup
    return map[key] || { title: "archetypes.default.title", emoji: "✨", description: "archetypes.default.description" };
};
