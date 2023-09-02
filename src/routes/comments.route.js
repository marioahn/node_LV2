import express from 'express';
import { prisma } from '../utils/prisma/index.js'

const router = express.Router();

/** 1. 댓글 생성 API **/
router.post('/posts/:postId/comments', async(req,res) => {
  try {
    const { postId }  = req.params;
    const { user, password, content } = req.body;

    // body데이터 검증 과정에서, content만 살짝 특별취급해서 에러메세지 다르게 출력
    if (!content) {
      return res.status(400).json({ errorMessage: '댓글 내용을 입력해주세요' });
    } else if (!user || !password) {
      return res.status(400).json({ errorMessage: 'body데이터 형식이 올바르지 않습니다' })
    };

    const post = await prisma.posts.findFirst({ where: { postId: +postId } });

    if (!post) {
      return res.status(404).json({ errorMessage: '게시글이 존재하지 않습니다' })
    };

    // 댓글 생성
      // 과제2 api명세서에서는 외래키 설정X -> but 난 해서, 아래 PostId: +postId 필수로 붙여야 api돌아감
      // Comments모델 보면, PostId가 'Int'로 되어있음 -> 필수 컬럼
    await prisma.comments.create({ 
      data: { PostId: +postId, user,password,content }
    });

    return res.status(200).json({ message: '댓글을 생성하였습니다' }); // 201
  } catch (err) {
    return res.status(500).json({ errorMessage: '서버오류가 발생하였습니다' });
  }
});


/** 2. '해당 게시글의' 댓글 (전체)조회 **/
  // 모든 게시글의 모든 댓글을 보여주는 것이 아니라, 해당 게시글의 모든 댓글 get
router.get('/posts/:postId/comments', async(req,res) => {
  try {
    const { postId } = req.params;
    
    const post = await prisma.posts.findUnique({ where: { postId: +postId } });

    const comments = await prisma.comments.findMany({
      where: { PostId: +postId }, // postId: +postId 가 아님 -> 여긴 comments잖아. PostId로 컬럼 넣어놨었음
      select: {
        commentId: true,
        user: true,
        content: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 1)게시글 자체가 존재안하면?
    if (post === null) { // console.log(post)로 check
      return res.status(400).json({ errorMessage: '해당 게시글이 존재하지 않습니다' })
    };
    // 2)게시글은 존재하는데, 댓글작성한게 없으면?
      // console.log(comments) -> [], 배열끼리의 비교는 주소값 -> 'comments === []'는 x
    if (comments.length === 0) { 
      return res.status(400).json({ errorMessage: '아직 작성한 댓글이 없습니다' })
    };

    return res.status(200).json({ data: comments });
  } catch (err) {
    return res.status(500).json({ errorMessage: '서버오류가 발생하였습니다' });
  }
});


/** 3. 댓글 수정 **/
router.put('/posts/:postId/comments/:commentId', async(req,res) => {
  try {
    const { postId, commentId } = req.params;
    const { password, content } = req.body;

    // body데이터의 400에러
    if (!content) {
      return res.status(400).json({ errorMessage: '댓글 내용을 입력해주세요' });
    } else if (!password) {
      return res.status(400).json({ errorMessage: 'body데이터 형식이 올바르지 않습니다' })
    };

    // params데이터 입력 제대로 못한 경우의 400에러 -> post찾아보고, null이면 에러
    const post = await prisma.posts.findUnique({ where: { postId: +postId } });
    if (post === null) {
      return res.status(400).json({ errorMessage: '게시글이 존재하지 않습니다'})
    };

    // 수정할 comment 찾기
    const comment = await prisma.comments.findUnique({ where: { commentId: +commentId } });

    // commentId에 해당하는 댓글이 존재하지 않는 경우
    if (comment === null) { // console.log(comment)
      return res.status(404).json({ errorMessage: '댓글 조회에 실패하였습니다' })
    };

    await prisma.comments.update({
      data: { content },
      where: {
        PostId: +postId,
        commentId: +commentId,
        password
      }
    });

    return res.status(200).json({ message: '댓글을 수정하였습니다' });
  } catch (err) {
    return res.status(500).json({ errorMessage: '서버오류가 발생하였습니다' });
  }
});


/** 4. 댓글 삭제 **/
router.delete('/posts/:postId/comments/:commentId', async(req,res) => {
  try {
    const { postId, commentId } = req.params;
    const { password } = req.body;

    // body데이터 400에러
    if (!password) {
      return res.status(400).json({ errorMessage: '비밀번호를 입력해주세요' });
    };

    // 존재하지 않는 postId 입력했을 때 에러
    const post = await prisma.posts.findUnique({ where: { postId: +postId } });
    if (post === null) {
      return res.status(400).json({ errorMessage: '게시글이 존재하지 않습니다'})
    };

    // 존재하지 않는 commentId 입력했을 때 에러
    const comment = await prisma.comments.findUnique({ where: { commentId: +commentId } });
    if (comment === null) { 
      return res.status(404).json({ errorMessage: '댓글 조회에 실패하였습니다' })
    };

    await prisma.comments.delete({
      where: { PostId: +postId, commentId: +commentId, password }
    })

    return res.status(200).json({ message: '댓글을 삭제하였습니다' });
  } catch (err) {
    return res.status(500).json({ errorMessage: '서버오류가 발생하였습니다' });
  }
});


export default router;