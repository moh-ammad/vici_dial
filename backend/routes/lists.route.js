import express from "express";
import { getListInfo } from "../controllers/lists.controller.js";

const router = express.Router();
router.get("/", getListInfo);

export default router;