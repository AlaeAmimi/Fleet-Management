const express = require("express");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const truckRoutes = require("./routes/truck.routes");
const trailerRoutes = require("./routes/trailer.routes");
const tireRoutes = require("./routes/tire.routes");
const tripRoutes = require("./routes/trip.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(express.json());

// governance headers required by the brief, sent on every response
app.use((req, res, next) => {
  res.setHeader("X-API-Version", "2.0.0");
  res.setHeader("X-API-Deprecated", "false");
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// v1: all the historical routes
const v1 = express.Router();
v1.use("/auth", authRoutes);
v1.use("/users", userRoutes);
v1.use("/trucks", truckRoutes);
v1.use("/trailers", trailerRoutes);
v1.use("/tires", tireRoutes);
v1.use("/trips", tripRoutes);

// v2: new routes only
const v2 = express.Router();
v2.use("/analytics", analyticsRoutes);

app.use("/api/v1", v1);
app.use("/api/v2", v2);

app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
