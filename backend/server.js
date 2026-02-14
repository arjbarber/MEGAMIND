import express from "express";
import cors from "cors";
import Redis from "ioredis";

const app = express();
const redis = new Redis(); // connects to localhost:6379

app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Backend is running 🚀" });
});

// Test route
app.get("/test", async (req, res) => {
  await redis.set("hello", "world");
  const value = await redis.get("hello");
  res.json({ redisValue: value });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
