import { db } from "./server/db";
import { agriTools, animalListings, ffSeeds, cropListings } from "./shared/schema";
import crypto from "crypto";

async function seedMarketplace() {
    console.log("Seeding Database...");
    
    // Tools
    await db.insert(agriTools).values([
        { id: crypto.randomUUID(), toolName: "Mahindra 575 DI Tractor", category: "Tractors", rentPricePerDay: 1500, salePrice: 0, state: "Punjab", district: "Ludhiana", ownerName: "Rakesh Singh", phone: "9876543210", availability: "Available" },
        { id: crypto.randomUUID(), toolName: "Heavy Duty Harvester", category: "Harvesting", rentPricePerDay: 5000, salePrice: 0, state: "Haryana", district: "Karnal", ownerName: "Amritpal", phone: "9988776655", availability: "Available" },
        { id: crypto.randomUUID(), toolName: "Drip Irrigation Setup 1 Acre", category: "Irrigation", rentPricePerDay: 0, salePrice: 25000, state: "Maharashtra", district: "Pune", ownerName: "AgriTech Supplies", phone: "9898989898", availability: "Available" },
    ]);

    // Animals
    await db.insert(animalListings).values([
        { id: crypto.randomUUID(), animalType: "Cow", breed: "Gir", age: "4 Years", price: 65000, healthStatus: "Healthy", vaccinated: true, state: "Gujarat", district: "Rajkot", sellerName: "Sanjay Patel", phone: "9876123450" },
        { id: crypto.randomUUID(), animalType: "Buffalo", breed: "Murrah", age: "3 Years", price: 85000, healthStatus: "Healthy, 15L Milk/day", vaccinated: true, state: "Haryana", district: "Hisar", sellerName: "Vikas Yadav", phone: "9988112233" },
        { id: crypto.randomUUID(), animalType: "Goat", breed: "Jamnapari", age: "1.5 Years", price: 12000, healthStatus: "Healthy", vaccinated: true, state: "Uttar Pradesh", district: "Agra", sellerName: "Mohd Ali", phone: "7008009000" },
    ]);

    // Seeds
    await db.insert(ffSeeds).values([
        { id: crypto.randomUUID(), seedName: "Kisan Premium Wheat Seeds", cropType: "Wheat", pricePerKg: 120, growthDays: 130, refundPolicy: "7 Days Replacement", availableStates: "All India" },
        { id: crypto.randomUUID(), seedName: "Hybrid Tomato F1", cropType: "Tomato", pricePerKg: 4500, growthDays: 90, refundPolicy: "No return on opened packets", availableStates: "South & West India" },
        { id: crypto.randomUUID(), seedName: "Golden Paddy Rice Seeds", cropType: "Paddy", pricePerKg: 85, growthDays: 150, refundPolicy: "7 Days Replacement", availableStates: "AP, Telangana, TN" },
    ]);
    
    // Crops
    await db.insert(cropListings).values([
        { id: crypto.randomUUID(), cropName: "Wheat", category: "grains", quantity: 50, unit: "quintal", pricePerUnit: 2450, state: "Punjab", district: "Ludhiana", location: "Ludhiana, India", sellerName: "Balwinder Singh", phone: "9876543210", notes: "A-grade export quality" },
        { id: crypto.randomUUID(), cropName: "Tomato", category: "vegetables", quantity: 500, unit: "kg", pricePerUnit: 25, state: "Maharashtra", district: "Nashik", location: "Nashik, India", sellerName: "Pravin Patil", phone: "9988776655", notes: "Fresh farm picked" },
    ]);

    console.log("Seeding Complete!");
    process.exit(0);
}

seedMarketplace().catch(e => {
    console.error(e);
    process.exit(1);
});
