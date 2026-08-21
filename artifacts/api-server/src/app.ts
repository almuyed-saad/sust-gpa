import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { existsSync } from "fs";
import { authMiddleware } from "./middlewares/authMiddleware";
import router from "./routes";

const app: Express = express();

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

const staticDirCandidates = [
  path.resolve(process.cwd(), "artifacts/gpa-calculator/dist/public"),
  path.resolve(process.cwd(), "../../artifacts/gpa-calculator/dist/public"),
];
const staticDir = staticDirCandidates.find((candidate) => existsSync(candidate));
const shouldServeFrontend =
  process.env.SERVE_FRONTEND === "true" || process.env.NODE_ENV === "production" || Boolean(staticDir);

if (shouldServeFrontend && staticDir) {
  app.use(express.static(staticDir));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
