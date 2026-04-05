import { Request, Response, NextFunction } from "express";

export function setupAuth(app: any) {
  app.use((req: Request & { isAuthenticated?: () => boolean, user?: any }, res: Response, next: NextFunction) => {
    // If running outside Replit or without proper auth headers, mock auth for development
    if (process.env.NODE_ENV !== "production" && !req.headers["x-replit-user-id"]) {
      req.isAuthenticated = () => true;
      req.user = { claims: { sub: "local-user-id" }, expires_at: Date.now() + 86400000 };
    }
    next();
  });
}

// Simple middleware to check if user is authenticated via Replit Identity
export function isAuthenticated(req: Request & { isAuthenticated?: () => boolean }, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // For local development
  if (process.env.NODE_ENV !== "production" || req.headers['x-local-dev-user']) {
      return next();
  }

  res.status(401).send("Not authenticated");
}
