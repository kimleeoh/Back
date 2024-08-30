import adminRoutes from "./adminRoutes.js";
import authRoutes from "./authRoutes.js";
import dummyRoute from "./dummyRoute.js"; // dummyRoute 추가

const setupRoutes = (app) => {
  app.use("/admin", adminRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/dummy", dummyRoute);
};

export default setupRoutes;
