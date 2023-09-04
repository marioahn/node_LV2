import express from 'express';
import dotEnv from 'dotenv';
import IndexRouter from './routes/index.js';

dotEnv.config();

const app = express();
const PORT = process.env.DATABASE_PORT;

app.use(express.json());
app.use('/api', IndexRouter);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});