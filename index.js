require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const apiRouter = require('./apis/api'); // apis 폴더에 있는 api.js 파일을 불러옴

const app = express();
const port = 3000;
const testKey = process.env.TEST;

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB에 연결되었습니다.');
	  console.log(testKey);
  })
  .catch((err) => {
    console.error('MongoDB 연결 오류:', err);
  });

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// 라우터 설정
app.use('/api', apiRouter); // /api 경로로 들어오는 요청은 apiRouter로 전달

// 서버 실행
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

