import { Request, Response } from "express";
import { blog } from "../util/Logger";

export async function indexEndpoint(req: Request, res: Response) {
  blog("Index Endpoint Hit", "info");
  try {
    res.redirect("https://github.com/jaspermayone/slacky");
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}
