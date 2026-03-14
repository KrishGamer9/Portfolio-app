import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  message: z.string().min(1, "Message is required").max(2000),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/contact", async (req, res) => {
    const result = contactSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten() });
    }
    const msg = await storage.saveContactMessage(result.data);
    console.log(`[contact] New message from ${msg.name} <${msg.email}>`);
    return res.status(201).json({ success: true, id: msg.id });
  });

  return httpServer;
}
