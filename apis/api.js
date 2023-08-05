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
        console.log(req.body);
  const { school, name, phone, password } = req.body;

// 필수 데이터가 누락되었는지 확인
  if (!school || !name || !phone || !password) {
    return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
  }

  try {
    // 사용자가 이미 존재하는지 확인
    const connection = await pool.getConnection();
    const [existingUser] = await connection.query('SELECT * FROM users WHERE name = ?', [school]);
    connection.release();

    if (existingUser.length > 0) {
      return res.status(400).json({ message: '이미 계정이 존재하는 학교입니다.' });
    }

    // 비밀번호 암호화
    //const hashedPassword = await bcrypt.hash(password, 10);

    // 새로운 사용자 생성
    const newUser = {
      school,
      name,
      phone,
      password,
    };

    const insertQuery = 'INSERT INTO users SET ?';
    const insertValues = [newUser];

    const insertResult = await pool.query(insertQuery, insertValues);

    if (insertResult.affectedRows === 1) {
      return res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.' });
    } else {
      return res.status(500).json({ message: '회원가입에 실패하였습니다.' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 로그인 API
router.post('/login', async (req, res) => {
  const { name, password } = req.body;

  try {
    // 사용자가 존재하는지 확인
    const connection = await pool.getConnection();
    const [user] = await connection.query('SELECT * FROM users WHERE name = ?', [name]);
    connection.release();

    if (user.length === 0) {
      return res.status(401).json({ message: '해당 아이디가 없습니다. 회원가입 해주시기 바랍니다.' });
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '유효하지 않은 비밀번호입니다.' });
    }

    return res.status(200).json({ message: '로그인이 성공적으로 완료되었습니다.' });
  } catch (error) {
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

