const express = require("express");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const errorHandler = require("./middlewares/errorHandler");
const truckRoutes = require("./routes/truck.routes");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/trucks", truckRoutes);
const trailerRoutes = require("./routes/trailer.routes");
app.use("/api/trailers", trailerRoutes);
const tireRoutes = require("./routes/tire.routes");
app.use("/api/tires", tireRoutes);

app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});



app.use(errorHandler);

module.exports = app;