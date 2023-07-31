const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// 스키마와 모델 정의 (예시)
const Schema = mongoose.Schema;
const userSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  expertise: String,
  password: String // 추가: 비밀번호를 저장할 필드
});
const User = mongoose.model('User', userSchema);

// 회원 가입 API
router.post('/signup', async (req, res) => {
  const { name, email, phone, expertise, password } = req.body;

  try {
    // 사용자가 이미 존재하는지 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: '이미 존재하는 사용자입니다.' });
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 새로운 사용자 생성
    const newUser = new User({ name, email, phone, expertise, password: hashedPassword });
    await newUser.save();

    return res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.' });
  } catch (error) {
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 로그인 API
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 사용자가 존재하는지 확인
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: '유효하지 않은 이메일 또는 비밀번호입니다.' });
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '유효하지 않은 이메일 또는 비밀번호입니다.' });
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

