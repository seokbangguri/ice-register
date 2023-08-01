require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const apiRouter = require('./apis/api');
const schoolList = require('./src/schoolList');

const app = express();
const port = 3000;
const testKey = process.env.TEST;

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/memberShip', {
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
app.use(session({
	secret: 'seokbangguri',
	resave: false,
	saveUninitialized: false,
}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use('/styles', express.static(__dirname + '/styles'));

// 라우터 설정
app.use('/api', apiRouter); // /api 경로로 들어오는 요청은 apiRouter로 전달

app.get('/', (req,res) => {
	const user = req.session.user;
	res.render('index', {user});
});

app.get('/login', (req,res) => {
	res.render('login');
});

app.get('/signup', (req,res) => {
        res.render('signup', {schools: schoolList});
});

// 서버 실행
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

