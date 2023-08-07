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
  const { school, schoolType, name, phone, password } = req.body;

// 필수 데이터가 누락되었는지 확인
  if (!school || !schoolType || !name || !phone || !password) {
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
      schoolType,
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

//교원/학부모 신청 API
router.post('/tandpApp', async (req, res) => {
  const { school, role, subject, date, ST, ET, total } = req.body;

  if (!school || !role || !subject || !date || !ST || !ET || !total) {
    return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
  }

  try {
    const connection = await pool.getConnection();

    const insertQuery = `
      INSERT INTO studentApp (school, role, subject, date, ST, ET, total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const insertValues = [school, role, subject, date, ST, ET, total];

    const insertResult = await connection.query(insertQuery, insertValues);
    connection.release();

    if (insertResult.affectedRows === 1) {
      console.log('성공');
      return res.redirect('/apply?message=신청이 성공적으로 완료되었습니다.');
    } else {
      console.log('실패');
      return res.redirect('/apply?message=신청에 실패하였습니다.');
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

//학생 신청 API
router.post('/studentApp', async (req, res) => {
  const { grade, classes, classTime, date, ST, ET, totalStu, maleStu, femaleStu} = req.body;
	const school = req.session.school;

  if (!school || !grade || !classes || !classTime || !date || !ST || !ET || !totalStu ) {
    return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
  }

  try {
    const connection = await pool.getConnection();
    
    const insertQuery = `
      INSERT INTO studentApp (school, grade, classes, classTime, date, ST, ET, totalStu, maleStu, femaleStu)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertValues = [school, grade, classes, classTime, date, ST, ET, totalStu, maleStu, femaleStu];

    const insertResult = await connection.query(insertQuery, insertValues);
    connection.release();
	  console.log(insertResult);
	  console.log(insertResult[0]);
	  console.log(insertResult[0].affectedRows);

    if (insertResult[0].affectedRows === 1) {
      console.log('성공');
      return res.redirect('/apply?message=신청이 성공적으로 완료되었습니다.');
    } else {
      console.log('실패');
      return res.redirect('/apply?message=신청에 실패하였습니다.');
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// Express 애플리케이션에서 /total-classes 경로에 대한 GET 핸들러 추가
router.get('/total-classes', async (req, res) => {
  const { date } = req.query;

  try {
    const connection = await pool.getConnection();
    const query = 'SELECT SUM(CAST(classes AS UNSIGNED)) AS totalClasses FROM studentApp WHERE date = ?';

    const [result] = await connection.query(query, [date]);
    connection.release();

    if (result.length > 0) {
      const totalClasses = result[0].totalClasses || 0;
      return res.status(200).json({ totalClasses });
    } else {
      return res.status(404).json({ message: '해당 날짜의 데이터가 없습니다.' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;

