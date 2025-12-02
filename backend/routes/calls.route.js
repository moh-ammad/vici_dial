import express from "express";
import { getCallReports, getLinks } from "../controllers/calls.controller.js";

const router = express.Router();

router.get("/reports", getCallReports);   // /api/calls/reports?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&type=inbound
router.get("/links", getLinks);           // /api/calls/links

export default router;
