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
  problems,
  solutions,
  type InsertProblem,
  type Problem,
  type InsertSolution,
  type Solution,
  messages,
  type InsertMessage,
  type Message,
  healthyCropData,
  type InsertHealthyCropData,
  type HealthyCropData,
  cropListings,
  type InsertCropListing,
  type CropListing,
  agriTools,
  type InsertAgriTool,
  type AgriTool,
  animalListings,
  type InsertAnimalListing,
  type AnimalListing,
  ffSeeds,
  type InsertFfSeed,
  type FfSeed,
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

  // Problem operations
  createProblem(problem: InsertProblem): Promise<Problem>;
  getProblems(): Promise<Problem[]>;
  getProblemsByUserId(userId: string): Promise<Problem[]>;
  getProblemById(id: string): Promise<Problem | undefined>;
  updateProblemStatus(id: string, status: string): Promise<Problem | undefined>;

  // Solution operations
  createSolution(solution: InsertSolution): Promise<Solution>;
  getSolutionsByProblemId(problemId: string): Promise<Solution[]>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(): Promise<Message[]>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllPredictions(): Promise<Prediction[]>;

  // Healthy Crop Data operations
  logHealthyCrop(data: InsertHealthyCropData): Promise<HealthyCropData>;
  getAllHealthyCrops(): Promise<HealthyCropData[]>;

  // Marketplace operations
  createCropListing(listing: InsertCropListing): Promise<CropListing>;
  getAllCropListings(): Promise<CropListing[]>;

  createAgriTool(tool: InsertAgriTool): Promise<AgriTool>;
  getAllAgriTools(): Promise<AgriTool[]>;

  createAnimalListing(animal: InsertAnimalListing): Promise<AnimalListing>;
  getAllAnimalListings(): Promise<AnimalListing[]>;

  createFfSeed(seed: InsertFfSeed): Promise<FfSeed>;
  getAllFfSeeds(): Promise<FfSeed[]>;

  // Custom limit operation
  enforcePredictionLimit(userId: string, limit: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = userData.id || crypto.randomUUID();
    await db
      .insert(users)
      .values({ ...userData, id })
      .onDuplicateKeyUpdate({
        set: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          role: userData.role,
          language: userData.language,
          testPassed: userData.testPassed,
          updatedAt: new Date(),
        },
      });
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // Crop operations
  async createCrop(crop: InsertCrop): Promise<Crop> {
    const id = crypto.randomUUID();
    await db.insert(crops).values({ ...crop, id });
    const [newCrop] = await db.select().from(crops).where(eq(crops.id, id));
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
    const id = crypto.randomUUID();
    await db.insert(predictions).values({ ...prediction, id });
    const [newPrediction] = await db.select().from(predictions).where(eq(predictions.id, id));
    return newPrediction;
  }

  async getPredictionsByUserId(userId: string): Promise<Prediction[]> {
    return await db.select().from(predictions).where(eq(predictions.userId, userId)).orderBy(desc(predictions.createdAt));
  }

  async getPredictionsByCropId(cropId: string): Promise<Prediction[]> {
    return await db.select().from(predictions).where(eq(predictions.cropId, cropId)).orderBy(desc(predictions.createdAt));
  }

  async enforcePredictionLimit(userId: string, limit: number): Promise<void> {
    const userPredictions = await this.getPredictionsByUserId(userId);
    if (userPredictions.length > limit) {
      // Keep only the newest 'limit' items. The array is already ordered by descending createdAt
      const excessPredictions = userPredictions.slice(limit);
      for (const p of excessPredictions) {
        await db.delete(predictions).where(eq(predictions.id, p.id));
      }
    }
  }

  // Recommendation operations
  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    const id = crypto.randomUUID();
    await db.insert(recommendations).values({ ...recommendation, id });
    const [newRecommendation] = await db.select().from(recommendations).where(eq(recommendations.id, id));
    return newRecommendation;
  }

  async getRecommendationsByCropId(cropId: string): Promise<Recommendation[]> {
    return await db.select().from(recommendations).where(eq(recommendations.cropId, cropId)).orderBy(desc(recommendations.createdAt));
  }

  // Chat operations
  async createChat(chat: InsertChat): Promise<Chat> {
    const id = crypto.randomUUID();
    await db.insert(chats).values({ ...chat, id });
    const [newChat] = await db.select().from(chats).where(eq(chats.id, id));
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

  // Problem operations
  async createProblem(problem: InsertProblem): Promise<Problem> {
    const id = crypto.randomUUID();
    await db.insert(problems).values({ ...problem, id });
    const [newProblem] = await db.select().from(problems).where(eq(problems.id, id));
    return newProblem;
  }

  async getProblems(): Promise<Problem[]> {
    return await db.select().from(problems).orderBy(desc(problems.createdAt));
  }

  async getProblemsByUserId(userId: string): Promise<Problem[]> {
    return await db.select().from(problems).where(eq(problems.userId, userId)).orderBy(desc(problems.createdAt));
  }

  async getProblemById(id: string): Promise<Problem | undefined> {
    const [problem] = await db.select().from(problems).where(eq(problems.id, id));
    return problem;
  }

  async updateProblemStatus(id: string, status: string): Promise<Problem | undefined> {
    await db.update(problems).set({ status }).where(eq(problems.id, id));
    return this.getProblemById(id);
  }

  // Solution operations
  async createSolution(solution: InsertSolution): Promise<Solution> {
    const id = crypto.randomUUID();
    await db.insert(solutions).values({ ...solution, id });
    const [newSolution] = await db.select().from(solutions).where(eq(solutions.id, id));
    return newSolution;
  }

  async getSolutionsByProblemId(problemId: string): Promise<Solution[]> {
    return await db.select().from(solutions).where(eq(solutions.problemId, problemId)).orderBy(desc(solutions.createdAt));
  }

  // Message operations
  async createMessage(msg: InsertMessage): Promise<Message> {
    const id = crypto.randomUUID();
    await db.insert(messages).values({ ...msg, id });
    const [newMessage] = await db.select().from(messages).where(eq(messages.id, id));
    return newMessage;
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllPredictions(): Promise<Prediction[]> {
    return await db.select().from(predictions).orderBy(desc(predictions.createdAt));
  }

  // Healthy Crop Data operations
  async logHealthyCrop(data: InsertHealthyCropData): Promise<HealthyCropData> {
    const id = crypto.randomUUID();
    await db.insert(healthyCropData).values({ ...data, id });
    const [newCrop] = await db.select().from(healthyCropData).where(eq(healthyCropData.id, id));
    return newCrop;
  }

  async getAllHealthyCrops(): Promise<HealthyCropData[]> {
    return await db.select().from(healthyCropData).orderBy(desc(healthyCropData.createdAt));
  }

  // Marketplace operations
  async createCropListing(listing: InsertCropListing): Promise<CropListing> {
    const id = crypto.randomUUID();
    await db.insert(cropListings).values({ ...listing, id });
    const [newListing] = await db.select().from(cropListings).where(eq(cropListings.id, id));
    return newListing;
  }

  async getAllCropListings(): Promise<CropListing[]> {
    return await db.select().from(cropListings).orderBy(desc(cropListings.createdAt));
  }

  async createAgriTool(tool: InsertAgriTool): Promise<AgriTool> {
    const id = crypto.randomUUID();
    await db.insert(agriTools).values({ ...tool, id });
    const [newTool] = await db.select().from(agriTools).where(eq(agriTools.id, id));
    return newTool;
  }

  async getAllAgriTools(): Promise<AgriTool[]> {
    return await db.select().from(agriTools).orderBy(desc(agriTools.createdAt));
  }

  async createAnimalListing(animal: InsertAnimalListing): Promise<AnimalListing> {
    const id = crypto.randomUUID();
    await db.insert(animalListings).values({ ...animal, id });
    const [newAnimal] = await db.select().from(animalListings).where(eq(animalListings.id, id));
    return newAnimal;
  }

  async getAllAnimalListings(): Promise<AnimalListing[]> {
    return await db.select().from(animalListings).orderBy(desc(animalListings.createdAt));
  }

  async createFfSeed(seed: InsertFfSeed): Promise<FfSeed> {
    const id = crypto.randomUUID();
    await db.insert(ffSeeds).values({ ...seed, id });
    const [newSeed] = await db.select().from(ffSeeds).where(eq(ffSeeds.id, id));
    return newSeed;
  }

  async getAllFfSeeds(): Promise<FfSeed[]> {
    return await db.select().from(ffSeeds).orderBy(desc(ffSeeds.createdAt));
  }
}

export const storage = new DatabaseStorage();
