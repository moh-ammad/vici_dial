import express from "express";
import { getHopperLeads } from "../controllers/hopper.controller.js";

const router = express.Router();

router.get("/", getHopperLeads); // /api/hopper?campaign_id=TEST

export default router;
