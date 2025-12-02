import express from "express";
import { getDashboardData } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/", getDashboardData); // /api/dashboard

export default router;
