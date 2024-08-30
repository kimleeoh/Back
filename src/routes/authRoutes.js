import express from "express";
const router = express.Router();

router.post("/login", (req, res) => {
  // 사용자 로그인 로직
  res.send("User Login");
});

router.post("/register", (req, res) => {
  // 사용자 등록 로직
  res.send("User Register");
});

export default router;
