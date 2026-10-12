import express from "express";
import app from "./app.js";

const vercelApp = express();
vercelApp.use(app);

export default vercelApp;
