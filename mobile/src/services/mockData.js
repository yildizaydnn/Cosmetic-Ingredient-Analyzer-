// İçerik veritabanı - backend hazır olana kadar mock data
export const ingredientDatabase = {
  water: {
    name: 'Water',
    category: 'Solvent',
    riskLevel: 'safe',
    description: 'Base ingredient, completely safe for all skin types.',
    whyRisk: null,
    skinSuitability: {
      normal: true,
      dry: true,
      oily: true,
      combination: true,
      sensitive: true,
    },
    recommendation: null,
  },
  niacinamide: {
    name: 'Niacinamide',
    category: 'Brightening',
    riskLevel: 'safe',
    description:
      'Vitamin B3, reduces hyperpigmentation and improves skin texture. Helps strengthen the skin barrier.',
    whyRisk: null,
    skinSuitability: {
      normal: true,
      dry: true,
      oily: true,
      combination: true,
      sensitive: true,
    },
    recommendation: null,
  },
  glycerin: {
    name: 'Glycerin',
    category: 'Moisturizing',
    riskLevel: 'safe',
    description:
      'Humectant that attracts moisture to the skin. One of the most effective moisturizing ingredients.',
    whyRisk: null,
    skinSuitability: {
      normal: true,
      dry: true,
      oily: true,
      combination: true,
      sensitive: true,
    },
    recommendation: null,
  },
  'hyaluronic acid': {
    name: 'Hyaluronic Acid',
    category: 'Hydrating',
    riskLevel: 'safe',
    description:
      'Deeply hydrates and plumps the skin. Can hold up to 1000x its weight in water.',
    whyRisk: null,
    skinSuitability: {
      normal: true,
      dry: true,
      oily: true,
      combination: true,
      sensitive: true,
    },
    recommendation: null,
  },
  'vitamin e': {
    name: 'Vitamin E',
    category: 'Antioxidant',
    riskLevel: 'safe',
    description:
      'Protects skin from free radical damage. A powerful antioxidant that supports skin healing.',
    whyRisk: null,
    skinSuitability: {
      normal: true,
      dry: true,
      oily: true,
      combination: true,
      sensitive: true,
    },
    recommendation: null,
  },
  fragrance: {
    name: 'Fragrance',
    category: 'Scent',
    riskLevel: 'medium',
    description:
      'Fragrance is a blend of synthetic or natural aromatic compounds used to give products a pleasant scent. It\'s one of the most common ingredients in cosmetic products.',
    whyRisk:
      'While fragrance is generally considered safe for most people, it can cause issues for some users:',
    whyRiskDetails: [
      'May cause skin irritation or allergic reactions in sensitive individuals',
      'Can trigger headaches or respiratory issues in some people',
      'Ingredients are often not fully disclosed (trade secret)',
    ],
    skinSuitability: {
      normal: true,
      dry: true,
      oily: true,
      combination: true,
      sensitive: false,
    },
    recommendation:
      'If you have sensitive skin or are prone to allergies, consider choosing fragrance-free alternatives.',
  },
  methylparaben: {
    name: 'Methylparaben',
    category: 'Preservative',
    riskLevel: 'medium',
    description:
      'A preservative used to prevent bacterial growth in cosmetic products.',
    whyRisk:
      'Parabens have been a topic of debate in the cosmetic industry:',
    whyRiskDetails: [
      'Some concerns about hormonal effects (endocrine disruption)',
      'Found in very low concentrations in most products',
      'Banned in some countries at high concentrations',
    ],
    skinSuitability: {
      normal: true,
      dry: true,
      oily: true,
      combination: true,
      sensitive: false,
    },
    recommendation:
      'If you prefer to avoid parabens, look for products labeled "paraben-free".',
  },
  'sodium lauryl sulfate': {
    name: 'Sodium Lauryl Sulfate',
    category: 'Surfactant',
    riskLevel: 'unsafe',
    description:
      'A strong cleansing agent and foaming agent commonly found in cleansers and shampoos.',
    whyRisk:
      'SLS is known to be harsh on the skin:',
    whyRiskDetails: [
      'Can strip natural oils from the skin causing dryness',
      'Known to cause skin irritation, especially with prolonged contact',
      'May disrupt the skin barrier function',
    ],
    skinSuitability: {
      normal: true,
      dry: false,
      oily: true,
      combination: false,
      sensitive: false,
    },
    recommendation:
      'Consider using products with gentler surfactants like Sodium Laureth Sulfate (SLES) or Cocamidopropyl Betaine.',
  },
  'salicylic acid': {
    name: 'Salicylic Acid',
    category: 'Exfoliant (BHA)',
    riskLevel: 'safe',
    description:
      'A beta hydroxy acid that penetrates pores to remove excess oil and dead skin cells.',
    whyRisk: null,
    skinSuitability: {
      normal: true,
      dry: false,
      oily: true,
      combination: true,
      sensitive: false,
    },
    recommendation:
      'Best for oily and acne-prone skin. If you have dry or sensitive skin, use with caution and start with low concentrations.',
  },
  retinol: {
    name: 'Retinol',
    category: 'Anti-aging',
    riskLevel: 'medium',
    description:
      'A form of Vitamin A that promotes cell turnover and collagen production.',
    whyRisk:
      'Retinol is effective but requires careful use:',
    whyRiskDetails: [
      'Can cause dryness, peeling, and irritation when first introduced',
      'Increases sun sensitivity significantly',
      'Not recommended during pregnancy',
    ],
    skinSuitability: {
      normal: true,
      dry: false,
      oily: true,
      combination: true,
      sensitive: false,
    },
    recommendation:
      'Start with a low concentration (0.25%) and gradually increase. Always use sunscreen during the day.',
  },
  'cetyl alcohol': {
    name: 'Cetyl Alcohol',
    category: 'Emollient',
    riskLevel: 'safe',
    description:
      'A fatty alcohol used as an emollient and thickening agent. Not the same as drying alcohols.',
    whyRisk: null,
    skinSuitability: {
      normal: true,
      dry: true,
      oily: true,
      combination: true,
      sensitive: true,
    },
    recommendation: null,
  },
  'tocopheryl acetate': {
    name: 'Tocopheryl Acetate',
    category: 'Antioxidant',
    riskLevel: 'safe',
    description:
      'A stable form of Vitamin E that provides antioxidant protection and moisturization.',
    whyRisk: null,
    skinSuitability: {
      normal: true,
      dry: true,
      oily: true,
      combination: true,
      sensitive: true,
    },
    recommendation: null,
  },
};

// Mock analiz geçmişi
export const mockHistory = [
  {
    id: '1',
    productName: 'The Ordinary Niacinamide',
    date: 'Today',
    safeCount: 5,
    mediumCount: 1,
    unsafeCount: 0,
    ingredients: ['Water', 'Niacinamide', 'Glycerin', 'Hyaluronic Acid', 'Vitamin E', 'Fragrance'],
  },
  {
    id: '2',
    productName: 'CeraVe Moisturizing Cream',
    date: 'Yesterday',
    safeCount: 4,
    mediumCount: 2,
    unsafeCount: 0,
    ingredients: ['Water', 'Glycerin', 'Cetyl Alcohol', 'Methylparaben', 'Fragrance', 'Tocopheryl Acetate'],
  },
  {
    id: '3',
    productName: 'La Roche-Posay Sunscreen',
    date: '2 days ago',
    safeCount: 5,
    mediumCount: 1,
    unsafeCount: 1,
    ingredients: ['Water', 'Glycerin', 'Niacinamide', 'Hyaluronic Acid', 'Vitamin E', 'Retinol', 'Sodium Lauryl Sulfate'],
  },
];

// İçerik metnini parse et
export const parseIngredients = (text) => {
  return text
    .split(/[,\n]+/)
    .map((i) => i.trim())
    .filter((i) => i.length > 0);
};

// İçerik bilgilerini getir
export const getIngredientInfo = (ingredientName) => {
  const key = ingredientName.toLowerCase().trim();
  return (
    ingredientDatabase[key] || {
      name: ingredientName.trim(),
      category: 'Unknown',
      riskLevel: 'medium',
      description: 'This ingredient is not yet in our database. Please consult a dermatologist for more information.',
      whyRisk: 'Limited data available for this ingredient.',
      whyRiskDetails: ['Not enough research data available', 'Consult a dermatologist for personalized advice'],
      skinSuitability: {
        normal: true,
        dry: true,
        oily: true,
        combination: true,
        sensitive: false,
      },
      recommendation: 'If unsure about this ingredient, perform a patch test before full application.',
    }
  );
};

// İçerik listesini analiz et
export const analyzeIngredients = (ingredientNames) => {
  return ingredientNames.map((name) => getIngredientInfo(name));
};
