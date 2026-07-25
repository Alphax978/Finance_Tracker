export const CATEGORY_COLORS: Record<string, string> = {
    Food: '#f59e0b',
    Rent: '#ef4444',
    Utilities: '#0891b2',
    Entertainment: '#8b5cf6',
    Other: '#64748b',
}

export const categoryColor = (category: string) => CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other
