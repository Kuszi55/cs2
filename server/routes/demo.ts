import { RequestHandler } from "express";

export const handleDemo: RequestHandler = (req, res) => {
  res.status(200).json({ message: "Hello from Express server" });
};
