import express from 'express';
import { prisma } from '../utils/prisma/index.js'

const router = express.Router();

/** 1. 게시글 생성API **/
router.post('/', async(req,res) => {
  const { user, title, content, password } = req.body;

  if (!user || !title || !content || !password) {
    return res.status(400).json({ errorMessage: '데이터 형식이 올바르지 않습니다'});
  }

  const post = await prisma.posts.create({
    data: { user, title, content, password }
  });

  /* 중간에 삭제하면 postId가 2씩 증가하는게 맘에 안들었음(1,2,3 -> 3삭제 -> 새로생성된 postId: 4../not3)
  -primary key는 변경..이 불가능 한듯..? */
  // const posts = await prisma.posts.findMany({
  //   select: { postId: true, createdAt: true },
  //   orderBy: { createdAt: 'desc' }
  // });
  // if (!(post.postId - posts[1].postId)) { // 가장 최근 게시글의 id차이가 1이 아니라면
  //   post.postId = posts[1].postId + 1
  // }

  return res.status(200).json({ message: '게시글을 생성하였습니다' });
});


/** 2. 게시글 전체 조회API **/
router.get('/', async(req,res) => {
  const posts = await prisma.posts.findMany({
    select: {
      postId: true,
      user: true,
      title: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return res.status(200).json({ data: posts })
});


/** 3. 게시글 상세 조회API **/
router.get('/:postId', async(req,res) => {
  try {
    const { postId } = req.params;

    const post = await prisma.posts.findFirst({
      where: { postId: +postId },
      select: {
        postId:true,
        user:true,
        title:true,
        content:true,
        createdAt:true,
      }
    });

    // params를 제대로 입력받지 못함 -> '데이터 형식이 올바르지 않습니다'
    if (post === null) { 
      return res.status(400).json({ errorMessage: '존재하지 않는 postId입니다' })
    }

    return res.status(200).json({ data: post });
  } catch (err) {
      return res.status(500).json({ errorMessage: err.message ?? '비정상적인 요청입니다' });
    }
})


/** 4. 게시글 수정 API **/
router.put('/:postId', async(req,res) => {
  try {
    const { postId } = req.params;
    const { password, title, content } = req.body;
    
    if (!password || !title || !content) {
      return res.status(400).json({ errorMessage: 'body데이터 형식이 올바르지 않습니다' });
    }

    const post = await prisma.posts.findUnique({ where: { postId: +postId } });

    if (!post) {
      return res.status(404).json({ errorMessage: '게시글 조회에 실패하였습니다' });
    } 

    // 모든 조건을 통과했다면 수정작업 수행
    if (post.password === password) { 
      await prisma.posts.update({ 
        data: { title, content }, 
        where: { postId: +postId, password } // 한 번 더 검증
        });
    } else {
      return res.status(401).json({ errorMessage: '비밀번호가 일치하지 않습니다' });
    }

    return res.status(200).json({ message: '게시글을 수정하였습니다' })
  } catch (err) {
    return res.status(500).json({ errorMessage: '서버오류가 발생하였습니다' });
  }
});


/** 5. 게시글 삭제 API **/
router.delete('/:postId', async(req,res) => {
  try {
    const { postId } = req.params;
    const { password } = req.body;

    const post = await prisma.posts.findUnique({ where: { postId: +postId } });

    if (!post) {
      return res.status(404).json({ errorMessage: '게시글 조회에 실패하였습니다' });
    };

    // 모든 조건을 통과했다면 삭제작업 수행
    if (post.password === password) { 
      await prisma.posts.update({ 
        data: { title, content }, 
        where: { postId: +postId, password } // 한 번 더 검증
        });
    } else {
      return res.status(401).json({ errorMessage: '비밀번호가 일치하지 않습니다' });
    }

    return res.status(200).json({ message: '게시글을 삭제하였습니다' });
  } catch (err) {
    // 예로 들어서, 위의 delete코드에서 prisma.delete로 잘못 쓸 경우 -> 여기로 넘어오긴 함..
    return res.status(500).json({ errorMessage: '서버오류가 발생하였습니다' });
  }
});


export default router;