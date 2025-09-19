import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCropSchema, insertPredictionSchema, insertRecommendationSchema, insertChatSchema } from "@shared/schema";
import { ZodError } from "zod";
import fs from "fs/promises";
import path from "path";

// Load chatbot Q&A data
let chatbotData: any = {};
async function loadChatbotData() {
  try {
    const dataPath = path.join(import.meta.dirname, "data", "chatbot-qa.json");
    const data = await fs.readFile(dataPath, "utf-8");
    chatbotData = JSON.parse(data);
  } catch (error) {
    console.error("Failed to load chatbot data:", error);
    chatbotData = { en: [], hi: [], od: [] };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Load chatbot data on startup
  await loadChatbotData();
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Crop routes
  app.post("/api/crops", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cropData = insertCropSchema.parse({ ...req.body, userId });
      const crop = await storage.createCrop(cropData);
      res.json(crop);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid crop data", errors: error.errors });
      }
      console.error("Error creating crop:", error);
      res.status(500).json({ message: "Failed to create crop" });
    }
  });

  app.get("/api/crops", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const crops = await storage.getCropsByUserId(userId);
      res.json(crops);
    } catch (error) {
      console.error("Error fetching crops:", error);
      res.status(500).json({ message: "Failed to fetch crops" });
    }
  });

  // Prediction routes
  app.post("/api/predict", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { cropId, factors } = req.body;

      // AI prediction logic (simplified for demo)
      const baseYield = Math.random() * 3 + 2; // 2-5 tons/ha
      const confidence = Math.random() * 20 + 80; // 80-100%
      
      const predictionData = insertPredictionSchema.parse({
        userId,
        cropId,
        predictedYield: baseYield.toFixed(2),
        confidence: confidence.toFixed(2),
        factors,
      });

      const prediction = await storage.createPrediction(predictionData);
      
      // Generate recommendations
      const recommendationData = insertRecommendationSchema.parse({
        cropId,
        irrigationSchedule: "Water twice weekly, 2-3 inches each time",
        fertilizerType: "NPK 10:26:26",
        fertilizerAmount: "50kg per acre",
        pestControl: "Monitor for aphids and stem borers",
        confidence: (confidence * 0.9).toFixed(2),
      });
      
      await storage.createRecommendation(recommendationData);
      
      res.json(prediction);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid prediction data", errors: error.errors });
      }
      console.error("Error creating prediction:", error);
      res.status(500).json({ message: "Failed to create prediction" });
    }
  });

  app.get("/api/predictions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const predictions = await storage.getPredictionsByUserId(userId);
      res.json(predictions);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      res.status(500).json({ message: "Failed to fetch predictions" });
    }
  });

  // Recommendation routes
  app.get("/api/recommendations/:cropId", isAuthenticated, async (req: any, res) => {
    try {
      const { cropId } = req.params;
      const recommendations = await storage.getRecommendationsByCropId(cropId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // Weather routes
  app.get("/api/weather/:district", async (req, res) => {
    try {
      const { district } = req.params;
      
      // Mock weather data for demo
      const weatherData = {
        id: "weather-1",
        district,
        temperature: "32",
        humidity: "68",
        rainfall: "12",
        windSpeed: "15",
        weatherType: "sunny",
        date: new Date(),
      };
      
      res.json(weatherData);
    } catch (error) {
      console.error("Error fetching weather:", error);
      res.status(500).json({ message: "Failed to fetch weather data" });
    }
  });

  // Chat routes
  app.post("/api/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { question, language = "en" } = req.body;

      // Find answer in chatbot data
      const qaData = chatbotData[language] || chatbotData["en"] || [];
      const matchedQA = qaData.find((qa: any) => 
        qa.keywords.some((keyword: string) => 
          question.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      const answer = matchedQA ? matchedQA.answer : "I'm sorry, I don't have information about that. Please contact our agricultural experts for more help.";

      const chatData = insertChatSchema.parse({
        userId,
        question,
        answer,
        language,
      });

      const chat = await storage.createChat(chatData);
      res.json(chat);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid chat data", errors: error.errors });
      }
      console.error("Error processing chat:", error);
      res.status(500).json({ message: "Failed to process chat" });
    }
  });

  app.get("/api/chats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chats = await storage.getChatsByUserId(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin" && user?.role !== "officer") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/predictions", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin" && user?.role !== "officer") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const predictions = await storage.getAllPredictions();
      res.json(predictions);
    } catch (error) {
      console.error("Error fetching all predictions:", error);
      res.status(500).json({ message: "Failed to fetch predictions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
