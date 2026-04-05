import { sql } from 'drizzle-orm';
import {
  mysqlTable,
  varchar,
  text,
  int,
  float,
  timestamp,
  json,
  boolean,
  mediumtext
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth (Adapted for MySQL)
export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

// User storage table 
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  firebaseUid: varchar("firebase_uid", { length: 128 }).unique(), // Added for Firebase Auth
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profileImageUrl: varchar("profile_image_url", { length: 1024 }),
  role: varchar("role", { length: 50 }).notNull().default("farmer"), // farmer, guider, admin
  language: varchar("language", { length: 10 }).notNull().default("en"),
  testPassed: boolean("test_passed").default(false), // [NEW] For Guider entrance test
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const crops = mysqlTable("crops", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  cropType: varchar("crop_type", { length: 100 }).notNull(),
  soilType: varchar("soil_type", { length: 100 }).notNull(),
  farmArea: float("farm_area").notNull(),
  sowingDate: timestamp("sowing_date").notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  fieldBoundaries: json("field_boundaries"),
  smsAlertsEnabled: boolean("sms_alerts_enabled").default(true),
  phoneNumber: varchar("phone_number", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const predictions = mysqlTable("predictions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  cropId: varchar("crop_id", { length: 36 }).references(() => crops.id), // Made optional for quick predictions
  cropType: varchar("crop_type", { length: 100 }), // Denormalized for quick ML predictions
  moisture: float("moisture"),
  temp: float("temp"),
  ph: float("ph"),
  npkStr: varchar("npk_str", { length: 50 }),
  predictedYield: float("predicted_yield").notNull(),
  confidence: float("confidence").notNull(),
  factors: json("factors"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recommendations = mysqlTable("recommendations", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  cropId: varchar("crop_id", { length: 36 }).notNull().references(() => crops.id),
  irrigationSchedule: text("irrigation_schedule"),
  fertilizerType: varchar("fertilizer_type", { length: 100 }),
  fertilizerAmount: varchar("fertilizer_amount", { length: 100 }),
  pestControl: text("pest_control"),
  confidence: float("confidence").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chats = mysqlTable("chats", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  language: varchar("language", { length: 10 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const weather = mysqlTable("weather", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  district: varchar("district", { length: 100 }).notNull(),
  temperature: float("temperature"),
  humidity: float("humidity"),
  rainfall: float("rainfall"),
  windSpeed: float("wind_speed"),
  weatherType: varchar("weather_type", { length: 50 }),
  date: timestamp("date").defaultNow(),
});

// [NEW] IoT Soil Tester Data Storage Schema
export const iotData = mysqlTable("iot_data", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  deviceId: varchar("device_id", { length: 100 }),
  moisture: float("moisture"),
  temperature: float("temperature"),
  ph: float("ph"),
  npkIndex: varchar("npk_index", { length: 50 }), // e.g. "Optimal", "Needs N"
  timestamp: timestamp("timestamp").defaultNow(),
});

// [NEW] Problems Table for Farmer issue feed
export const problems = mysqlTable("problems", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  audioUrl: mediumtext("audio_url"),
  imageUrl: mediumtext("image_url"),
  status: varchar("status", { length: 50 }).notNull().default("open"), // open, solved
  createdAt: timestamp("created_at").defaultNow(),
});

// [NEW] Solutions Table for Guiders answering Farmer problems
export const solutions = mysqlTable("solutions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  problemId: varchar("problem_id", { length: 36 }).notNull().references(() => problems.id),
  guiderId: varchar("guider_id", { length: 36 }).notNull().references(() => users.id),
  solutionText: text("solution_text").notNull(),
  audioUrl: mediumtext("audio_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// [NEW] Messages Table for Landing Page Contact Form
export const messages = mysqlTable("messages", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  farmSize: varchar("farm_size", { length: 100 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("unread"),
  createdAt: timestamp("created_at").defaultNow(),
});

// [NEW] Healthy Crop Reference Data (for ML Analytics)
export const healthyCropData = mysqlTable("healthy_crop_data", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  cropType: varchar("crop_type", { length: 100 }),
  soilType: varchar("soil_type", { length: 100 }),
  temperature: float("temperature"),
  humidity: float("humidity"),
  moisture: float("moisture"),
  nitrogen: float("nitrogen"),
  phosphorus: float("phosphorus"),
  potassium: float("potassium"),
  fertilizerUsed: varchar("fertilizer_used", { length: 100 }),
  yieldScore: float("yield_score"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCropSchema = createInsertSchema(crops).omit({
  id: true,
  createdAt: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({
  id: true,
  createdAt: true,
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({
  id: true,
  createdAt: true,
});

export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  timestamp: true,
});

export const insertProblemSchema = createInsertSchema(problems).omit({
  id: true,
  createdAt: true,
});

export const insertSolutionSchema = createInsertSchema(solutions).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertHealthyCropDataSchema = createInsertSchema(healthyCropData).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertCrop = z.infer<typeof insertCropSchema>;
export type Crop = typeof crops.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictions.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;
export type Weather = typeof weather.$inferSelect;
export type InsertProblem = z.infer<typeof insertProblemSchema>;
export type Problem = typeof problems.$inferSelect;
export type InsertSolution = z.infer<typeof insertSolutionSchema>;
export type Solution = typeof solutions.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertHealthyCropData = z.infer<typeof insertHealthyCropDataSchema>;
export type HealthyCropData = typeof healthyCropData.$inferSelect;
