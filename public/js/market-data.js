// Shared Market Data Constants
const STATES_DISTRICTS = {
  "Andhra Pradesh": ["Anantapur", "Chittoor", "Guntur", "Krishna", "Visakhapatnam"],
  "Telangana": ["Hyderabad", "Karimnagar", "Warangal", "Nizamabad"],
  "Karnataka": ["Bangalore Rural", "Belgaum", "Mysore", "Tumkur"],
  "Maharashtra": ["Nagpur", "Nashik", "Pune", "Mumbai"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Thanjavur"],
  "Punjab": ["Amritsar", "Ludhiana", "Patiala"],
  "Haryana": ["Ambala", "Hisar", "Karnal"],
  "Uttar Pradesh": ["Agra", "Lucknow", "Varanasi"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota"],
  "Gujarat": ["Ahmedabad", "Surat", "Rajkot"],
};

const STATE_OPTIONS = Object.keys(STATES_DISTRICTS).sort();
const CROP_OPTIONS = [
  "Paddy", "Rice", "Wheat", "Maize", "Cotton", "Soybean", 
  "Groundnut", "Turmeric", "Onion", "Tomato", "Potato", "Chilli"
];

const CROP_EMOJIS = {
  "Paddy": "🌾", "Rice": "🌾", "Wheat": "🌿", "Maize": "🌽",
  "Cotton": "🌸", "Soybean": "🫘", "Groundnut": "🥜", "Turmeric": "🟡",
  "Onion": "🧅", "Tomato": "🍅", "Potato": "🥔", "Chilli": "🌶️"
};

// Global language translations adapted for Vanilla JS usage
const t = {
    buySell: 'Buy & Sell',
    agriTools: 'Agri Tools',
    cattlePets: 'Cattle & Pets',
    cropRates: 'Crop Prices',
    ffSeeds: 'FF Seeds',
    call: 'Call',
    message: 'Message',
    buy: 'Buy',
    sell: 'Sell',
    rent: 'Rent',
    searchCrops: 'Search crops...',
    allCategories: 'All Categories',
    vegetables: 'Vegetables',
    fruits: 'Fruits',
    grains: 'Grains',
    spices: 'Spices',
};

// Make available globally
window.MarketData = { STATES_DISTRICTS, STATE_OPTIONS, CROP_OPTIONS, CROP_EMOJIS, t };
