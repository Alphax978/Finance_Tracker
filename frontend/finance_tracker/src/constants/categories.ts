export const CATEGORY_COLORS: Record<string, string> = {
    Food: '#f59e0b',
    Rent: '#ef4444',
    Utilities: '#0891b2',
    Entertainment: '#8b5cf6',
    Other: '#64748b',
}

export const categoryColor = (category: string) => CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other

// The category names on their own, read from CATEGORY_COLORS above so there is
// only one list of categories to keep updated.
// Used by the category filter dropdown in Financial-Record-List.tsx.
export const CATEGORIES = Object.keys(CATEGORY_COLORS)
