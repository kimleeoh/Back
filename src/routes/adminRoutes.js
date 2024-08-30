import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Admin Home Page");
});

router.post("/login", (req, res) => {
  // 로그인 로직
  res.send("Admin Login");
});

export default router;
