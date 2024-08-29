import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "QnA API",
      version: "1.0.0",
      description: "QnA 게시판 API 문서",
    },
    servers: [
      {
        url: "http://13.125.218.184:4501",
      },
    ],
  },
  apis: ["./src/api/qna.js"], // API 라우트 파일들의 경로
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;
