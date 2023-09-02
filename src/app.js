import express from 'express';
import dotEnv from 'dotenv';
import PostsRouter from './routes/posts.router.js';
import CommentsRouter from './routes/comments.route.js';

dotEnv.config();

const app = express();
const PORT = process.env.DATABASE_PORT;

app.use(express.json());
app.use('/api', [PostsRouter,CommentsRouter]);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});