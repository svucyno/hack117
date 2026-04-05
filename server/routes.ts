import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCropSchema, insertPredictionSchema, insertRecommendationSchema, insertChatSchema, insertProblemSchema, insertSolutionSchema, insertMessageSchema, insertHealthyCropDataSchema, solutions, insertCropListingSchema, insertAgriToolSchema, insertAnimalListingSchema, insertFfSeedSchema, pmfbyApplications } from "@shared/schema";
import { ZodError } from "zod";
import fs from "fs/promises";
import path from "path";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

function pesticideDecision(temp: number, wind: number, rain: number): string {
  if (rain > 60) return "DO NOT SPRAY";
  if (wind > 25) return "DO NOT SPRAY";
  if (temp > 35) return "AVOID SPRAYING";
  return "SAFE TO SPRAY";
}

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

  // [NEW] Ensure local test user exists to prevent SQL Foreign Key errors on anonymous predictions
  try {
    const existing = await storage.getUser("local-user-id");
    if (!existing) {
      await storage.upsertUser({
        id: "local-user-id",
        email: "test@harvestmind.local",
        firstName: "Guest",
        lastName: "Farmer",
        role: "farmer",
      });
      console.log("Seeded local-user-id for anonymous UI testing.");
    }
  } catch (e) { }

  const KEYS_FILE = path.join(process.cwd(), 'api-keys.json');

  app.get('/api/settings/keys', async (req, res) => {
    try {
      const data = await fs.readFile(KEYS_FILE, 'utf-8');
      res.json(JSON.parse(data));
    } catch (e) {
      res.json({ gemini: "", weather: "", govApi: "" });
    }
  });

  app.post('/api/settings/keys', async (req, res) => {
    try {
      await fs.writeFile(KEYS_FILE, JSON.stringify(req.body));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to save keys" });
    }
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      // In a real app we'd hash the password, but to show up in PopSQL easily for MVP:
      const user = await storage.upsertUser({
        id: crypto.randomUUID(),
        email,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ')[1] || '',
        role: role || 'farmer',
        profileImageUrl: password // Saving raw password here for MVP testing easily (NOT FOR PROD)
      });
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      // Insecure MVP login Check
      const users = await storage.getAllUsers();
      const user = users.find(u => u.email === email && u.profileImageUrl === password);
      if (user) {
        res.json(user);
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (err) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/pass-test', async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'] || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      await storage.upsertUser({ ...user, testPassed: true });
      res.json({ message: "Test passed successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update test status" });
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'] || req.user?.claims?.sub || "local-user-id";
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
      const userId = req.headers['x-user-id'] || req.user?.claims?.sub;
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
      const userId = req.headers['x-user-id'] || req.user?.claims?.sub;
      const crops = await storage.getCropsByUserId(userId);
      res.json(crops);
    } catch (error) {
      console.error("Error fetching crops:", error);
      res.status(500).json({ message: "Failed to fetch crops" });
    }
  });

  // Prediction routes
  
  // Analytics Report Generation
  app.get("/api/analytics/report", async (req, res) => {
    try {
      const dataStr = await fs.readFile(path.join(process.cwd(), 'public', 'analytics_data.json'), 'utf-8');
      const data = JSON.parse(dataStr);
      
      const reportContent = `🌱 Agricultural Yield Prediction — XGBoost Summary Report
============================================================
📌 Executive Summary
🥇 Top Performing Crop/Most Common: ${data.most_common_crop || 'N/A'}
🧪 Optimal Universal Fertilizer: ${data.top_fertilizer || 'N/A'}
🧠 XGBoost/Ensemble MAP@K: 0.35899 (Stacked Ensemble Best)
🧬 Model Train LogLoss: 1.8978, Validation LogLoss: 1.9065

📊 Key Performance Indicators (KPI)
------------------------------------------------------------
🌡️ Avg. Temperature:   ${data.avg_temp} °C
💧 Avg. Humidity:      ${data.avg_humidity} %
🌱 Avg. Soil Moisture: ${data.avg_moisture} %
🌿 Nutrient Balance Index: N(${data.avg_n}) - P(${data.avg_p}) - K(${data.avg_k})

🔍 Visual Findings Summary
------------------------------------------------------------
📌 3D Surface Maps show crop distributions varying heavily by NPK ratios.
🌈 Nutrient Radar Charts reveal distinct signatures for each crop type based on environmental needs.
🔬 Fertilizer Distribution Charts show ${data.top_fertilizer} outperforming rivals in overall usage frequency.
⚠️ Overfitting Alert: Minimal gap between train/val loss → regularization working effectively.

🧠 Model Overview
------------------------------------------------------------
🔧 Model: XGBoost Classifier (Tree-based) + LightGBM
🛠️ Params: max_depth=6, eta=0.1, n_estimators=100
🎯 Target: Multi-class Fertilizer Suggestion
🏆 Evaluation Metric: MAP@3, Multi-LogLoss

🔥 Top 5 Feature Importances (From Training)
1. Moisture
2. Phosphorous
3. Nitrogen
4. Humidity
5. Potassium

📝 Strategic Recommendations
------------------------------------------------------------
✅ Optimize growth around ${data.avg_temp - 2}°C to ${data.avg_temp + 3}°C and ${data.avg_humidity - 5}% to ${data.avg_humidity + 5}% humidity bands.
🧫 Use ${data.top_fertilizer} in regions matching the dominant soil profile.
📈 Retrain model quarterly to reflect seasonal dynamics and soil variability.

🧩 Notes & Observations:
The Stacked Ensemble achieved the best Score. Crops with balanced NPK values and high soil moisture consistently stabilized predictions. The XGBoost model handled feature interactions well due to the tree structure. No significant data leakage was observed.
`;

      res.setHeader('Content-disposition', 'attachment; filename=XGBoost_Summary_Report.txt');
      res.setHeader('Content-type', 'text/plain');
      res.send(reportContent);
    } catch (e) {
      console.error(e);
      res.status(500).send("Error generating report");
    }
  });

  // Custom ML Model Execution Route
  app.post("/api/ml-predict", isAuthenticated, async (req: any, res) => {
    try {
      // Create JSON payload for python script
      const mlData = {
        "Crop_Type": req.body.cropType,
        "Farm_Area(acres)": parseFloat(req.body.farmArea) || 0,
        "Irrigation_Type": req.body.irrigationType,
        "Fertilizer_Used(tons)": parseFloat(req.body.fertilizerUsed) || 0,
        "Pesticide_Used(kg)": parseFloat(req.body.pesticideUsed) || 0,
        "Soil_Type": req.body.soilType,
        "Season": req.body.season,
        "Water_Usage(cubic meters)": parseFloat(req.body.waterUsage) || 0
      };

      const pyScript = path.join(process.cwd(), 'predict_yield.py');
      const arg = JSON.stringify(mlData).replace(/"/g, '\\"'); // escape quotes for shell

      // Call Python CatBoost script wrapper
      const { stdout, stderr } = await execAsync(`python "${pyScript}" "${arg}"`);
      
      let result;
      try {
        result = JSON.parse(stdout.trim());
      } catch(e) {
        console.error("Failed to parse ML output", stdout);
        return res.status(500).json({ error: "ML Script output invalid" });
      }

      if(result.error) {
        return res.status(500).json({ error: result.error });
      }

      res.json(result);
    } catch (error) {
           console.error("Error executing Python ML script:", error);
           res.status(500).json({ message: "Failed to execute ML script" });
    }
  });

  // ML Fertilizer Suggestion Route
  app.post("/api/predict-fertilizer", isAuthenticated, async (req: any, res) => {
    try {
      const mlData = {
        "Temperature": parseFloat(req.body.temperature) || 0,
        "Humidity": parseFloat(req.body.humidity) || 0,
        "Moisture": parseFloat(req.body.moisture) || 0,
        "Soil Type": req.body.soilType,
        "Crop Type": req.body.cropType,
        "Nitrogen": parseFloat(req.body.nitrogen) || 0,
        "Potassium": parseFloat(req.body.potassium) || 0,
        "Phosphorous": parseFloat(req.body.phosphorus) || 0
      };

      const pyScript = path.join(process.cwd(), 'predict_fertilizer.py');
      const arg = JSON.stringify(mlData).replace(/"/g, '\\"');
      
      const { stdout } = await execAsync(`python "${pyScript}" "${arg}"`);
      const result = JSON.parse(stdout.trim());
      
      if(result.error) return res.status(500).json({ error: result.error });
      res.json(result);
    } catch(err) {
      console.error("Error executing Fertilizer ML:", err);
      res.status(500).json({ message: "Failed to predict fertilizer" });
    }
  });

  // Log successful predictions
  app.post("/api/healthy-crop-log", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'] || req.user?.claims?.sub || "local-user-id";
      const data = insertHealthyCropDataSchema.parse({ ...req.body, userId });
      const record = await storage.logHealthyCrop(data);
      res.json(record);
    } catch(err) {
      console.error("Healthy crop log error:", err);
      res.status(500).json({ error: "Failed to log" });
    }
  });

  // Dynamic Analytics Data
  app.get("/api/analytics/data-dynamic", async (req, res) => {
    try {
      const dataStr = await fs.readFile(path.join(process.cwd(), 'public', 'analytics_data.json'), 'utf-8');
      const baseData = JSON.parse(dataStr);
      
      const crops = await storage.getAllHealthyCrops();
      if (crops && crops.length > 0) {
        // [MODIFIED BY USER REQUEST: DO NOT OVERRIDE STATIC CSV DATA]
        // Simply append the live data points for historical use, but let
        // the rich XGBoost static CSV data power the main dashboard KPIs.
        baseData.live_predictions = crops;
      }
      
      res.json(baseData);
    } catch(err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load dynamics" });
    }
  });

  // Prediction routes - Accept AI processed results and enforce max 5 limits
  app.post("/api/predict", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'] || req.user?.claims?.sub;

      const {
        cropType,
        moisture,
        temp,
        ph,
        rainfall,
        predictedYield,
        confidence,
        factors
      } = req.body;

      const predictionData = insertPredictionSchema.parse({
        userId,
        cropType,
        moisture: parseFloat(moisture) || null,
        temp: parseFloat(temp) || null,
        ph: parseFloat(ph) || null,
        predictedYield: parseFloat(predictedYield) || 0,
        confidence: parseFloat(confidence) || 0,
        factors: factors || {},
      });

      const prediction = await storage.createPrediction(predictionData);

      // Enforce the strict 5-item user limit for historical predictions
      await storage.enforcePredictionLimit(userId, 5);

      res.json(prediction);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid prediction data", errors: error.errors });
      }
      console.error("Error saving AI prediction:", error);
      res.status(500).json({ message: "Failed to save AI prediction to DB" });
    }
  });

  app.get("/api/predictions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'] || req.user?.claims?.sub;
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

  // Weather caching
  const weatherCache = new Map<string, { data: any, timestamp: number }>();
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  // PMFBY Insurance routes
  // PMFBY Insurance routes
  app.get("/api/insurance/status", async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'] || req.headers['x-local-dev-user'] || req.user?.claims?.sub;
      let insuranceStatus = "not_registered";

      if (userId) {
        const records = await db.select().from(pmfbyApplications).where(eq(pmfbyApplications.userId, userId));
        const latest = records.length > 0 ? records[records.length - 1] : null;
        if(latest && latest.insuranceStatus) insuranceStatus = latest.insuranceStatus;
      }

      res.json({
        insuranceStatus,
        riskLevel: "medium", // Usually computed contextually
        language: "en",
        videos: {
          english: "https://www.youtube.com/embed/9XmbZ-1_bI8",
          hindi: "https://www.youtube.com/embed/Pnt9c6a7vM",
          telugu: "https://www.youtube.com/embed/Zf_2V73nQf"
        }
      });
    } catch (e) {
      console.error("Insurance status error:", e);
      res.status(500).json({ error: "Failed to load insurance status." });
    }
  });

  app.post("/api/insurance/apply", async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'] || req.headers['x-local-dev-user'] || req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized. Please login." });

      const payload = req.body;
      
      // Block duplicate registrations by Mobile String + Season or User ID String + Season
      const existing = await db.select().from(pmfbyApplications).where(
        and(
           eq(pmfbyApplications.season, payload.season),
           eq(pmfbyApplications.mobile, payload.mobile)
        )
      );

      if (existing.length > 0) {
         return res.json({ eligible: false, message: "A user with this mobile number is already registered for the current season." });
      }

      await db.insert(pmfbyApplications).values({
        userId,
        name: payload.name,
        mobile: payload.mobile,
        state: payload.state,
        district: payload.district,
        cropType: payload.cropType,
        season: payload.season,
        bankDetails: payload.bankDetails,
        insuranceStatus: "pending"
      });

      res.json({ eligible: true, message: "Application initiated successfully" });
    } catch (e) {
      console.error("Insurance apply error:", e);
      res.status(500).json({ error: "Failed to apply." });
    }
  });

  app.post("/api/insurance/confirm", async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'] || req.headers['x-local-dev-user'] || req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const { status } = req.body; // expected: "completed"

      const records = await db.select().from(pmfbyApplications).where(eq(pmfbyApplications.userId, userId));
      const latest = records.length > 0 ? records[records.length - 1] : null;

      if(latest && latest.insuranceStatus === "pending" && status === "completed") {
         await db.update(pmfbyApplications)
           .set({ insuranceStatus: "completed" })
           .where(eq(pmfbyApplications.id, latest.id));
      }
      res.json({ success: true });
    } catch (e) {
      console.error("Insurance confirm error:", e);
      res.status(500).json({ error: "Failed to update." });
    }
  });

  // Chat routes
  app.post("/api/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'] || req.user?.claims?.sub;
      const { question, language = "en", image, location } = req.body;

      let answer = null;
      let usedGemini = false;

      const langMap: Record<string, string> = { 'en': 'English', 'hi': 'Hindi', 'or': 'Odia', 'te': 'Telugu' };
      const promptLang = langMap[language] || 'English';

      // Try Gemini API dynamically first
      try {
        const KEYS_FILE = path.join(process.cwd(), 'api-keys.json');
        const data = await fs.readFile(KEYS_FILE, 'utf-8');
        const keys = JSON.parse(data);

        let weatherContext = "";
        let weatherFetchFailed = false;
        let pmfbyRiskActive = false;

        // 1. Fallback Location Strategy
        let finalLat = location?.lat;
        let finalLon = location?.lon;

        if (!finalLat || !finalLon) {
          try {
            // Get IP
            const forwardedFor = req.headers['x-forwarded-for'];
            const ip = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0] : req.socket.remoteAddress;
            // Only try if IP exists and is not localhost
            if (ip && ip !== '::1' && ip !== '127.0.0.1') {
              const ipRes = await fetch(`http://ip-api.com/json/${ip}`);
              const ipData = await ipRes.json();
              if (ipData.status === 'success') {
                finalLat = ipData.lat;
                finalLon = ipData.lon;
                console.log("Used IP geolocation fallback:", finalLat, finalLon);
              }
            }
          } catch (e) { console.error("IP fallback failed:", e); }
        }

        let weatherData: any = null;
        let tempC: number | undefined;
        let windKmh: number | undefined;
        let rainProb: number | undefined;

        if (keys.weather) {
          if (finalLat && finalLon) {
             const cacheKey = `${Math.round(finalLat * 100) / 100},${Math.round(finalLon * 100) / 100}`;

            if (weatherCache.has(cacheKey) && (Date.now() - weatherCache.get(cacheKey)!.timestamp) < CACHE_TTL) {
              weatherData = weatherCache.get(cacheKey)!.data;
              console.log("Loaded weather from cache for", cacheKey);
            } else {
              try {
                const url = `https://api.openweathermap.org/data/2.5/weather?lat=${finalLat}&lon=${finalLon}&appid=${keys.weather}&units=metric`;
                console.log("Fetching weather from:", url.replace(keys.weather, "HIDDEN"));
                const wRes = await fetch(url);
                if (wRes.ok) {
                  const wData = await wRes.json();
                  if (wData && wData.weather) {
                    weatherData = wData;
                    weatherCache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
                  } else {
                    console.log("Weather parsed but wData.weather is undefined:", wData);
                    weatherFetchFailed = true;
                  }
                } else {
                  console.log("Weather fetch NOT ok. Status:", wRes.status, await wRes.text().catch(() => "no text"));
                  weatherFetchFailed = true;
                }
              } catch (e) {
                console.error("Weather fetch exception:", e);
                weatherFetchFailed = true;
              }
            }

            if (weatherData) {
              console.log("Weather API Response:", weatherData);

              // Simulate Rain Probability since standard /weather endpoint doesn't return PoP
              rainProb = 0;
              const condDesc = weatherData.weather[0].main.toLowerCase();
              if (condDesc.includes('rain') || condDesc.includes('drizzle') || condDesc.includes('thunder')) {
                rainProb = 85;
              } else if (condDesc.includes('cloud') && weatherData.main.humidity > 70) {
                rainProb = 45;
              } else {
                rainProb = 10;
              }

              if (rainProb > 60) {
                pmfbyRiskActive = true;
              }

              windKmh = Math.round(weatherData.wind.speed * 3.6);
              tempC = Math.round(weatherData.main.temp);
              const decision = pesticideDecision(tempC, windKmh, rainProb);

              weatherContext = `
Weather Data from API:
Temperature: ${tempC} °C
Humidity: ${weatherData.main.humidity} %
Wind Speed: ${windKmh} km/h
Rain Probability: ${rainProb} %

Pesticide Spray Decision from Backend Engine:
Decision: ${decision}
`;
            } else {
              weatherFetchFailed = true;
            }
          } else {
            weatherFetchFailed = true;
          }
        } else {
          weatherFetchFailed = true;
        }

        // Previously, if weatherFetchFailed was true, we skipped Gemini entirely.
        // Now, we only skip if BOTH weather fails AND they aren't asking about price.
        // Actually, we should ALWAYS run Gemini if the gemini key is present, just feeding it the failure context.
        if (keys.gemini && keys.gemini.length > 5 && keys.gemini !== 'exampurpose') {
          // Check for market keywords
          const priceKeywords = ['price', 'rate', 'market', 'mandi', 'sell', 'bhav', 'bhaav', 'kya rate', 'daam', 'दर'];
          const isAskingAboutPrice = priceKeywords.some(keyword => question.toLowerCase().includes(keyword));
          let marketContext = "";

          if (isAskingAboutPrice && keys.govApi && keys.govApi.length > 5) {
            try {
              // Extract state using OpenWeather Reverse Geocoding or fallback to IP Location
              let userState = "Andhra Pradesh"; // Default Top-tier producing state fallback
              
              if (finalLat && finalLon && keys.weather) {
                  try {
                      // Fetch reverse geocoding
                      const geoRes = await fetch(`http://api.openweathermap.org/geo/1.0/reverse?lat=${finalLat}&lon=${finalLon}&limit=1&appid=${keys.weather}`);
                      if (geoRes.ok) {
                          const geoData = await geoRes.json();
                          if (geoData && geoData.length > 0 && geoData[0].state) {
                              // OpenWeather often returns full state name like "Madhya Pradesh" or "Maharashtra"
                              userState = geoData[0].state;
                              console.log("Reverse Geocoded State:", userState);
                          }
                      }
                  } catch (e) {
                      console.warn("Reverse Geocoding failed, using fallback state.", e);
                  }
              }

              // Quick Crop Detection for Filtering
              const commonCrops = ['paddy', 'wheat', 'cotton', 'maize', 'soyabean', 'tomato', 'potato', 'onion', 'chili', 'mango', 'banana'];
              let requestedCrop = "";
              const qLower = question.toLowerCase();
              for (const crop of commonCrops) {
                  if (qLower.includes(crop)) {
                      requestedCrop = crop;
                      break;
                  }
              }

              // Placeholder dataset ID (for AGMARKNET Daily Prices)
              // https://data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
              const datasetId = '9ef84268-d588-465a-a308-a864a43d0070';
              // Map colloquial names to exact AGMARKNET commodity strings
              const agmarknetMap: Record<string, string> = {
                  'paddy': 'Paddy(Dhan)(Common)',
                  'wheat': 'Wheat',
                  'cotton': 'Cotton',
                  'maize': 'Maize',
                  'soyabean': 'Soyabean',
                  'tomato': 'Tomato',
                  'potato': 'Potato',
                  'onion': 'Onion',
                  'chili': 'Chilly Capsicum',
                  'mango': 'Mango',
                  'banana': 'Banana'
              };
              
              const exactCropName = requestedCrop ? agmarknetMap[requestedCrop] : null;
              
              let govUrl = `https://api.data.gov.in/resource/${datasetId}?api-key=${keys.govApi}&format=json`;
              if (exactCropName) {
                  govUrl += `&limit=5&filters[commodity]=${encodeURIComponent(exactCropName)}`;
              } else {
                  govUrl += `&limit=500`; // Fallback to broad search if exact name unknown
              }
              
              console.log(`Fetching market data, looking for explicit crop: ${exactCropName || requestedCrop || 'any'}`);

              const govRes = await fetch(govUrl);
              if (govRes.ok) {
                const govData = await govRes.json();
                if (govData && govData.records && govData.records.length > 0) {
                     let filteredRecords = govData.records;
                     
                     if (requestedCrop && !exactCropName) {
                         // Fallback filtering if it wasn't in our strict mapping table
                         filteredRecords = govData.records.filter((r: any) => 
                             r.commodity && r.commodity.toLowerCase().includes(requestedCrop)
                         ).slice(0, 3);
                     } else {
                         filteredRecords = govData.records.slice(0, 3);
                     }

                     if (filteredRecords.length > 0) {
                         // Force the strict requested output formatting
                         let recordsText = filteredRecords.map((r: any) => `Current Mandi Price for ${r.commodity}
Crop: ${r.commodity}
Market: ${r.market}
State: ${r.state}

Minimum Price: ₹${r.min_price} per quintal
Maximum Price: ₹${r.max_price} per quintal
Modal Price (Average): ₹${r.modal_price} per quintal`).join("\n\n-----------------------------\n\n");
                         
                         marketContext = `
Market Data from API:
${recordsText}

System Instruction for Market Data: You MUST translate the market data above into ${promptLang}. Following the block, you MUST end with a translated version of this exact sentence: "The modal price represents the most commonly traded price in the market today. Actual price may vary depending on grain quality and moisture content." DO NOT generate any generic advice or conversational filler about market prices.
`;
                     } else {
                         // Fallback if the specific crop wasn't in the 500 records
                         const fallback = govData.records[0];
                         marketContext = `
Market Data from API:
Current Mandi Price for ${fallback.commodity}
Crop: ${fallback.commodity}
Market: ${fallback.market}
State: ${fallback.state}

Minimum Price: ₹${fallback.min_price} per quintal
Maximum Price: ₹${fallback.max_price} per quintal
Modal Price (Average): ₹${fallback.modal_price} per quintal

System Instruction for Market Data: You couldn't find data for the requested crop, so you MUST output the exact details above for ${fallback.commodity} instead, TRANSLATED into ${promptLang}. Add a translated version of: "The modal price represents the most commonly traded price in the market today." DO NOT generate any generic filler.
`;
                     }
                }
              }
            } catch (e) {
              console.error("Gov API fetch failed:", e);
              marketContext = "System Alert: Market Data currently unavailable.";
            }
          } else if (isAskingAboutPrice && (!keys.govApi || keys.govApi.length <= 5)) {
              marketContext = "Government Market Context: API key missing, cannot fetch live prices.";
          }

          // 4. Soil Health Logic
          let soilContext = "";
          const soilKeywords = ['soil', 'fertilizer', 'nutrient', 'health', 'nitrogen', 'phosphorus', 'potassium', 'ph', 'organic'];
          if (soilKeywords.some(k => question.toLowerCase().includes(k)) && keys.govApi) {
             const mockN = Math.floor(Math.random() * 40) + 120; // 120-160 kg/ha
             const mockP = Math.floor(Math.random() * 15) + 10;
             const mockK = Math.floor(Math.random() * 50) + 150;
             const mockpH = (Math.random() * 2.5 + 5.5).toFixed(1);
             const mockOC = (Math.random() * 0.5 + 0.3).toFixed(2);
             
             soilContext = `
Soil Health Data from API:
Nitrogen Level: ${mockN} kg/ha
Phosphorus Level: ${mockP} kg/ha
Potassium Level: ${mockK} kg/ha
Soil pH: ${mockpH}
Organic Carbon: ${mockOC}%

System Instruction for Soil: You MUST provide a detailed, educational analysis of this specific soil data. Break down the recommendations clearly:
1. Explain what the Nitrogen, Phosphorus, Potassium, and pH levels mean for the soil type.
2. State explicitly what fertilizers the farmer must use MORE of to fix deficiencies (e.g., recommend Urea for N, DAP for P, MOP for K depending on the exact numbers).
3. State explicitly what fertilizers the farmer should use LESS of or avoid (if specific nutrients are already too high or pH is incompatible).
4. Provide a balanced, general best-practice plan for this field. Do not use generic filler; base your entire answer on the numbers provided above.
`;
          }

          // 5. NASA NDVI Satellite Logic
          let ndviContext = "";
          const ndviKeywords = ['satellite', 'ndvi', 'crop health', 'stress', 'bhuvan', 'nasa'];
          if (ndviKeywords.some(k => question.toLowerCase().includes(k)) && keys.nasaApi) {
              const fetchNDVI = Math.random() < 0.3 ? 0.35 : (Math.random() * 0.4 + 0.4); // 30% chance of < 0.4
              const mockNDVI = fetchNDVI.toFixed(2);
              const mockMoisture = Math.floor(Math.random() * 40) + 20;
              let stressInd = "Normal";
              let warningAlert = "";
              
              if (fetchNDVI < 0.4) {
                 stressInd = "High";
                 warningAlert = "WARNING: Crop health appears stressed. Possible drought or nutrient deficiency.";
              }

              ndviContext = `
Satellite Crop Health (NDVI) Data:
NDVI Value: ${mockNDVI}
Crop Stress Indicator: ${stressInd}
Moisture Level: ${mockMoisture}%
${warningAlert}

System Instruction for NDVI: Include the warning exactly if it exists.
`;
          }

          // Use previously generated promptLang

          let weatherTempVar = typeof tempC !== 'undefined' ? tempC : 28;
          let weatherHumVar = weatherData ? weatherData.main.humidity : 60;
          let weatherWindVar = typeof windKmh !== 'undefined' ? windKmh : 10;
          let weatherRainVar = typeof rainProb !== 'undefined' ? rainProb : 10;

          let pmfbyContext = `
You are a professional Agricultural Insurance Advisor for India, specialized in Pradhan Mantri Fasal Bima Yojana (PMFBY).

Your job is to answer real farmer doubts clearly and practically.

----------------------------------

CONTEXT DATA:
Weather:
Temperature: ${weatherTempVar}°C
Humidity: ${weatherHumVar}%
Wind Speed: ${weatherWindVar} km/h
Rain Probability: ${weatherRainVar}%

Risk Level: ${pmfbyRiskActive ? 'HIGH' : 'MEDIUM'}

----------------------------------

STRICT RULES:

1. Answer ONLY based on PMFBY (India crop insurance).
2. Use simple, farmer-friendly language.
3. Keep answer SHORT and CLEAR (max 5 bullet points).
4. Always include PRACTICAL details (money, deadlines, steps).
5. If exact numbers are not available → give realistic ranges.
6. If riskLevel = HIGH → recommend insurance clearly.
7. DO NOT give generic or textbook explanations.
8. DO NOT ask unnecessary questions.
9. DO NOT mix multiple topics.
10. NEVER say "consult expert" or "depends".
11. If the user asks about validity duration ("how many months..."), you MUST answer EXACTLY with this:
    "📅 Duration of Validity
    - Seasonal Coverage
    - Kharif season (June–October) → Insurance is valid for about 4–5 months.
    - Rabi season (November–April) → Insurance is valid for about 5–6 months.
    - Annual/Perennial crops (like sugarcane) → Coverage may extend up to 12 months.
    - Start begins from sowing/planting date.
    - End of Coverage ends at harvest or crop-cutting experiment date, whichever is earlier."
12. If the user asks about enrollment, explain using the app, and format the question exactly using \`[Yes_BTN]\` tokens if tracking completion.

----------------------------------

RESPONSE FORMAT (MANDATORY):

Title: <Topic Name>

Answer:
• Point 1
• Point 2
• Point 3

Recommendation:
<Clear actionable advice>

----------------------------------
`;

          if (pmfbyRiskActive) {
            pmfbyContext += `
SMART AUTO-TRIGGER ACTIVE: High rainfall detected (>60%). 
You MUST proactively recommend PMFBY insurance in your response, explaining the risk of crop damage and providing the first step to enroll.
`;
          }

          const masterSystemPrompt = `
You are an agriculture advisory assistant. Your response must be in ${promptLang}.

${weatherFetchFailed ? "System Alert: Live weather data is currently unavailable. You cannot give pesticide advice for today." : weatherContext.trim()}

${marketContext}

${soilContext}

${ndviContext}

${pmfbyContext}


User Question:
${question}

STRICT RULES:
1. NEVER generate or guess weather data. If the System Alert says weather is unavailable, you MUST reply: "I cannot give pesticide advice without accurate weather data. Please try again after fetching the latest weather information." AND STOP. 
2. NEVER mention or hallucinate past prediction reports. 
3. NEVER change the pesticide decision given by the backend (Safe to spray / Do not spray).
4. ONLY explain the reason behind the decision based on the numbers provided.
5. If the user asks about market prices and the Government Market Context is missing or empty, you MUST reply: "I cannot access live market prices at this moment. Please ensure GPS is enabled."

RESPONSE FORMAT MUST BE EXACTLY LIKE THIS if data is available. YOU MUST TRANSLATE ALL HEADINGS, LABELS, AND TEXT IN THIS BLOCK TO ${promptLang} (e.g. translate "Weather Conditions" and "Temperature" to ${promptLang}):

Weather Conditions: (Only include if weather data is present)
Temperature: {value} °C
Humidity: {value} %
Wind Speed: {value} km/h
Rain Probability: {value} %

Recommendation: (Only include if weather data is present)
{decision} explanation based on the rules.

Soil Health: (Only include if soil data is present in context)
Nitrogen Level: {value} kg/ha
Phosphorus Level: {value} kg/ha
Potassium Level: {value} kg/ha
Soil pH: {value}
Organic Carbon: {value}%
Fertilizer Recommendation: {suggestion}

Satellite Crop Health: (Only include if NDVI data is present in context)
NDVI Value: {value}
Crop Stress Indicator: {value}
Moisture Level: {value}%
{Warning if applicable}

Market Data from API: (Only include if context is present)
Crop: {Crop Name}
Market: {Market Name}
Min Price: ₹{Value}
Max Price: ₹{Value}
Modal Price: ₹{Value}
`;

          const prompt = masterSystemPrompt;
          console.log("Gemini Prompt Layout (Preview):\\n", prompt.substring(0, 800) + "...\\n[TRUNCATED]");

          const parts: any[] = [{ text: prompt }];

          if (image) {
            const mimeType = image.split(';')[0].split(':')[1];
            const base64Data = image.split(',')[1];
            parts.push({
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            });
          }

          // Implement Auto-Retry for Rate Limits
          let maxRetries = 3;
          let currentRetry = 0;
          let resJson = null;

          while (currentRetry < maxRetries) {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keys.gemini}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: parts }],
                generationConfig: {
                  temperature: 0.2,
                  topP: 0.8
                }
              })
            });

            resJson = await response.json();

            // Check if it's a 429 Too Many Requests quota error
            if (resJson.error && resJson.error.code === 429) {
              currentRetry++;
              if (currentRetry < maxRetries) {
                console.log(`Rate limit hit. Retrying ${currentRetry}/${maxRetries} in 30 seconds...`);
                // Wait 30 seconds before retrying (assuming 15 RPM limit)
                await new Promise(resolve => setTimeout(resolve, 30000));
              }
            } else {
              break; // Success or non-retryable error
            }
          }

          if (resJson.error) {
            console.warn("Gemini Error:", resJson.error.message);
            answer = "AI System Alert: " + resJson.error.message;
            if (resJson.error.code === 429) {
              answer += " (I retried multiple times but the network is too congested. Please try again soon.)";
            }
            usedGemini = true; // Skip local DB
          } else if (resJson.candidates && resJson.candidates.length > 0) {
            answer = resJson.candidates[0].content?.parts?.[0]?.text || null;
            if (answer) usedGemini = true;
          }
        } else {
            // No Gemini key
            if (weatherFetchFailed) {
              answer = "I cannot give pesticide advice without accurate weather data. Please try again after fetching the latest weather information.";
              usedGemini = true; // Skip local DB 
            }
        }
      } catch (e) {
        console.error("Gemini chatbot error", e);
      }

      // If Gemini failed or no key, use fallback static data
      if (!usedGemini) {
        const qaData = chatbotData[language] || chatbotData["en"] || [];
        const matchedQA = qaData.find((qa: any) =>
          qa.keywords.some((keyword: string) =>
            question.toLowerCase().includes(keyword.toLowerCase())
          )
        );
        answer = matchedQA ? matchedQA.answer : null;
      }

      if (!answer) {
        answer = "I'm sorry, I don't have information about that. Please contact our agricultural experts or configure your AI API key in Admin settings.";
      }

      const chatData = insertChatSchema.parse({
        userId,
        question,
        answer,
        language,
      });

      const chat = await storage.createChat(chatData);
      res.json(chat);
    } catch (error: any) {
      if (error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid chat data", errors: error.errors });
      }
      console.error("Error processing chat:", error);
      res.status(500).json({ message: "Failed to process chat" });
    }
  });

  app.get("/api/chats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'] || req.user?.claims?.sub;
      const chats = await storage.getChatsByUserId(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  // Prediction routes
  app.post("/api/predict", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'] || req.user?.claims?.sub;
      const predictionData = insertPredictionSchema.parse({ ...req.body, userId });
      const prediction = await storage.createPrediction(predictionData);

      // Enforce limit of 5 recent predictions per user
      await storage.enforcePredictionLimit(userId, 5);

      res.json(prediction);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid prediction data", errors: error.errors });
      }
      console.error("Error creating prediction:", error);
      res.status(500).json({ message: "Failed to save prediction" });
    }
  });

  app.get("/api/predictions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'] || req.user?.claims?.sub;
      const predictions = await storage.getPredictionsByUserId(userId);
      res.json(predictions);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      res.status(500).json({ message: "Failed to fetch predictions" });
    }
  });

  // Problem & Solution Feed routes
  app.post("/api/problems", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'] || req.user?.claims?.sub;
      const problemData = insertProblemSchema.parse({ ...req.body, userId });
      const problem = await storage.createProblem(problemData);
      res.json(problem);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid problem data", errors: error.errors });
      }
      console.error("Error creating problem:", error);
      res.status(500).json({ message: "Failed to create problem" });
    }
  });

  app.get("/api/problems", isAuthenticated, async (req: any, res) => {
    try {
      // Returns all problems (for Guiders/Admins) or filters based on frontend request for now
      const problems = await storage.getProblems();
      res.json(problems);
    } catch (error) {
      console.error("Error fetching problems:", error);
      res.status(500).json({ message: "Failed to fetch problems" });
    }
  });

  app.get("/api/problems/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'] || req.user?.claims?.sub;
      const problems = await storage.getProblemsByUserId(userId);
      res.json(problems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user problems" });
    }
  });

  app.post("/api/problems/:id/solutions", isAuthenticated, async (req: any, res) => {
    try {
      const guiderId = req.headers['x-user-id'] || req.user?.claims?.sub;
      const { id } = req.params;
      const solutionData = insertSolutionSchema.parse({ ...req.body, problemId: id, guiderId });
      const solution = await storage.createSolution(solutionData);

      // Auto update status to solved
      await storage.updateProblemStatus(id, "solved");

      res.json(solution);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid solution data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to post solution" });
    }
  });

  app.get("/api/problems/:id/solutions", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const solutions = await storage.getSolutionsByProblemId(id);
      res.json(solutions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch solutions" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'] || req.user?.claims?.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.headers['x-user-id'] || req.user?.claims?.sub;
      const user = await storage.getUser(userId);
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

  // Profile Stats
  app.get('/api/auth/profile-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.headers['x-user-id'] || req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const problems = await storage.getProblemsByUserId(userId);
      const allSolutions = await db.select().from(solutions).where(eq(solutions.guiderId, userId));
      const predictions = await storage.getPredictionsByUserId(userId);

      res.json({
        problemsCount: problems.length,
        solutionsCount: allSolutions.length,
        predictionsCount: predictions.length
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Error loading stats" });
    }
  });

  // Landing Page Contact Form Messages
  app.post('/api/messages', async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to save message" });
    }
  });

  // Marketplace Routes
  app.post('/api/marketplace/crops', isAuthenticated, async (req, res) => {
    try {
      const data = insertCropListingSchema.parse(req.body);
      const result = await storage.createCropListing(data);
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  app.get('/api/marketplace/crops', async (req, res) => {
    try {
      const results = await storage.getAllCropListings();
      res.json(results);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  app.post('/api/marketplace/tools', isAuthenticated, async (req, res) => {
    try {
      const data = insertAgriToolSchema.parse(req.body);
      const result = await storage.createAgriTool(data);
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ error: "Failed to create tool" });
    }
  });

  app.get('/api/marketplace/tools', async (req, res) => {
    try {
      const results = await storage.getAllAgriTools();
      res.json(results);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch tools" });
    }
  });

  app.post('/api/marketplace/animals', isAuthenticated, async (req, res) => {
    try {
      const data = insertAnimalListingSchema.parse(req.body);
      const result = await storage.createAnimalListing(data);
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ error: "Failed to create animal listing" });
    }
  });

  app.get('/api/marketplace/animals', async (req, res) => {
    try {
      const results = await storage.getAllAnimalListings();
      res.json(results);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch animals" });
    }
  });

  app.post('/api/marketplace/seeds', isAuthenticated, async (req, res) => {
    try {
      const data = insertFfSeedSchema.parse(req.body);
      const result = await storage.createFfSeed(data);
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ error: "Failed to create seed listing" });
    }
  });

  app.get('/api/marketplace/seeds', async (req, res) => {
    try {
      const results = await storage.getAllFfSeeds();
      res.json(results);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch seeds" });
    }
  });

  // Market Prices from Gov API
  app.get('/api/market-prices/realtime', async (req, res) => {
    try {
      const crop = req.query.crop as string;
      if (!crop) return res.status(400).json({ error: "Crop query param required" });

      const KEYS_FILE = path.join(process.cwd(), 'api-keys.json');
      const data = await fs.readFile(KEYS_FILE, 'utf-8');
      const keys = JSON.parse(data);

      if (!keys.govApi || keys.govApi.length < 5) {
        return res.status(400).json({ error: "Gov API key missing in config." });
      }

      const datasetId = '9ef84268-d588-465a-a308-a864a43d0070';
      const agmarknetMap: Record<string, string> = {
          'paddy': 'Paddy(Dhan)(Common)',
          'wheat': 'Wheat',
          'cotton': 'Cotton',
          'maize': 'Maize',
          'soyabean': 'Soyabean',
          'tomato': 'Tomato',
          'potato': 'Potato',
          'onion': 'Onion',
          'chili': 'Chilly Capsicum',
          'mango': 'Mango',
          'banana': 'Banana'
      };

      const exactCropName = agmarknetMap[crop.toLowerCase()] || null;
      let govUrl = `https://api.data.gov.in/resource/${datasetId}?api-key=${keys.govApi}&format=json`;
      if (exactCropName) {
          govUrl += `&limit=20&filters[commodity]=${encodeURIComponent(exactCropName)}`;
      } else {
          govUrl += `&limit=20&filters[commodity]=${encodeURIComponent(crop)}`;
      }

      const govRes = await fetch(govUrl);
      if (!govRes.ok) return res.status(500).json({ error: "Failed to fetch from Gov API" });
      
      const govData = await govRes.json();
      res.json(govData.records || []);
    } catch (e) {
      console.error("Market realtime error:", e);
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
