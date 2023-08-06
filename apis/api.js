const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise'); // mysql2 모듈을 promise 형태로 사용합니다.
const bcrypt = require('bcrypt');

// MySQL 데이터베이스 연결 설정
const pool = mysql.createPool({
  host: 'localhost',
  user: 'seokbangguri',
  password: '1234',
  database: 'ice',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 회원 가입 API
router.post('/signup', async (req, res) => {
  const { school, name, phone, password } = req.body;

// 필수 데이터가 누락되었는지 확인
  if (!school || !name || !phone || !password) {
    return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
  }

  try {
    // 사용자가 이미 존재하는지 확인
    const connection = await pool.getConnection();
    const [existingUser] = await connection.query('SELECT * FROM users WHERE school = ?', [school]);
    connection.release();

	  console.log(existingUser);

    if (existingUser.length > 0) {
            return res.redirect('/signup?message=이미 계정이 존재하는 학교입니다.');
    }

    // 비밀번호 암호화
	  const saltRounds = 10;

    // 새로운 사용자 생성
    const newUser = {
      school,
      name,
      phone: "032"+phone,
      password: await bcrypt.hash(password, saltRounds),
    };

    const insertQuery = 'INSERT INTO users SET ?';
    const insertValues = [newUser];

    const insertResult = await pool.query(insertQuery, insertValues);
	  console.log(insertValues);
	  console.log(insertResult[0].affectedRows);

    if (insertResult[0].affectedRows === 1) {
	    console.log('성공');
	    return res.redirect('/?message=회원가입이 성공적으로 완료되었습니다.');
      //return res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.' });
    } else {
	    console.log('실패');
            return res.redirect('/signup?message=회원가입이 실패했습니다..');
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 로그인 API
router.post('/login', async (req, res) => {
  const { school, password } = req.body;

  try {
    // 사용자가 존재하는지 확인
    const connection = await pool.getConnection();
    const [user] = await connection.query('SELECT * FROM users WHERE school = ?', [school]);
    connection.release();

    if (user.length === 0) {
            return res.redirect('/?message=해당학교에 계정이 없습니다. 회원가입 해주십시오.');
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user[0].password);
    if (!isPasswordValid) {
            return res.redirect('/?message=비밀번호가 맞지 않습니다..');
    }
// 로그인 성공 시 세션에 학교 정보 저장
    req.session.school = school;
    return res.redirect('/mypage');
  } catch (error) {
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// status 테이블 데이터 조회 API
router.get('/status', async (req, res) => {
  const school = req.query.school; // HTTP 헤더에서 school 정보를 가져옴

  try {
    const connection = await pool.getConnection();
    let query = 'SELECT * FROM status';

    if (school) {
      // school 정보가 있을 경우 조회 조건에 추가
      query += ' WHERE school = ?';
    }

    const [statusData] = await connection.query(query, [school]);
    connection.release();

    return res.status(200).json(statusData);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// status 테이블 데이터 삭제 API
router.delete('/cancel/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id);

  try {
    const connection = await pool.getConnection();
    const deleteQuery = 'DELETE FROM status WHERE id = ?';
    const [deleteResult] = await connection.query(deleteQuery, [id]);
    connection.release();

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ message: '해당 신청번호를 찾을 수 없습니다.' });
    }
    if (deleteResult.affectedRows === 1) {
      return res.status(201).json({ message: '취소 완료!' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 모든 강사 신청 조회 API (예시: 임시적으로 applicants 배열 사용)
let applicants = [];
router.post('/apply', (req, res) => {
  const { name, email, phone, expertise } = req.body;

  if (!name || !email || !phone || !expertise) {
    return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
  }

  const newApplicant = { name, email, phone, expertise };
  applicants.push(newApplicant);

  return res.status(201).json({ message: '강사 신청이 성공적으로 접수되었습니다.' });
});

router.get('/applicants', (req, res) => {
  return res.status(200).json(applicants);
});

module.exports = router;

