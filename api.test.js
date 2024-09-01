const request = require("supertest");
import clientApp from "./src/index.js";
import { createClient } from "redis";

const redisClient = createClient({ url: process.env.REDIS_URL });

beforeAll(async () => {
  await redisClient.connect();
});

afterAll(async () => {
  await redisClient.disconnect();
});

// QnA 데이터 가져오기 테스트
describe("GET /api/dummy/testqna", () => {
  it("should return QnA data", async () => {
    const response = await request(app).get("/api/dummy/testqna");
    expect(response.statusCode).toBe(200); // 상태 코드가 200인지 확인
    expect(response.body).toHaveProperty("answer_list"); // 응답 본문에 'answer_list' 속성이 있는지 확인
  });
});

// Tip 데이터 가져오기 테스트
describe("GET /api/dummy/testtip", () => {
  it("should return tip data", async () => {
    const response = await request(app).get("/api/dummy/testtip");
    expect(response.statusCode).toBe(200); // 상태 코드가 200인지 확인
    expect(response.body).toHaveProperty("title"); // 응답 본문에 'title' 속성이 있는지 확인
  });
});
