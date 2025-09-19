import {
  users,
  crops,
  predictions,
  recommendations,
  chats,
  weather,
  type User,
  type UpsertUser,
  type InsertCrop,
  type Crop,
  type InsertPrediction,
  type Prediction,
  type InsertRecommendation,
  type Recommendation,
  type InsertChat,
  type Chat,
  type Weather,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Crop operations
  createCrop(crop: InsertCrop): Promise<Crop>;
  getCropsByUserId(userId: string): Promise<Crop[]>;
  getCropById(id: string): Promise<Crop | undefined>;
  
  // Prediction operations
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  getPredictionsByUserId(userId: string): Promise<Prediction[]>;
  getPredictionsByCropId(cropId: string): Promise<Prediction[]>;
  
  // Recommendation operations
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  getRecommendationsByCropId(cropId: string): Promise<Recommendation[]>;
  
  // Chat operations
  createChat(chat: InsertChat): Promise<Chat>;
  getChatsByUserId(userId: string): Promise<Chat[]>;
  
  // Weather operations
  getWeatherByDistrict(district: string): Promise<Weather | undefined>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllPredictions(): Promise<Prediction[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Crop operations
  async createCrop(crop: InsertCrop): Promise<Crop> {
    const [newCrop] = await db.insert(crops).values(crop).returning();
    return newCrop;
  }

  async getCropsByUserId(userId: string): Promise<Crop[]> {
    return await db.select().from(crops).where(eq(crops.userId, userId)).orderBy(desc(crops.createdAt));
  }

  async getCropById(id: string): Promise<Crop | undefined> {
    const [crop] = await db.select().from(crops).where(eq(crops.id, id));
    return crop;
  }

  // Prediction operations
  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const [newPrediction] = await db.insert(predictions).values(prediction).returning();
    return newPrediction;
  }

  async getPredictionsByUserId(userId: string): Promise<Prediction[]> {
    return await db.select().from(predictions).where(eq(predictions.userId, userId)).orderBy(desc(predictions.createdAt));
  }

  async getPredictionsByCropId(cropId: string): Promise<Prediction[]> {
    return await db.select().from(predictions).where(eq(predictions.cropId, cropId)).orderBy(desc(predictions.createdAt));
  }

  // Recommendation operations
  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    const [newRecommendation] = await db.insert(recommendations).values(recommendation).returning();
    return newRecommendation;
  }

  async getRecommendationsByCropId(cropId: string): Promise<Recommendation[]> {
    return await db.select().from(recommendations).where(eq(recommendations.cropId, cropId)).orderBy(desc(recommendations.createdAt));
  }

  // Chat operations
  async createChat(chat: InsertChat): Promise<Chat> {
    const [newChat] = await db.insert(chats).values(chat).returning();
    return newChat;
  }

  async getChatsByUserId(userId: string): Promise<Chat[]> {
    return await db.select().from(chats).where(eq(chats.userId, userId)).orderBy(desc(chats.timestamp));
  }

  // Weather operations
  async getWeatherByDistrict(district: string): Promise<Weather | undefined> {
    const [weatherData] = await db.select().from(weather).where(eq(weather.district, district)).orderBy(desc(weather.date)).limit(1);
    return weatherData;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllPredictions(): Promise<Prediction[]> {
    return await db.select().from(predictions).orderBy(desc(predictions.createdAt));
  }
}

export const storage = new DatabaseStorage();
