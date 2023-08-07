require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const apiRouter = require('./apis/api');
const schoolList = require('./src/schoolList');

const app = express();
const port = 3000;
const testKey = process.env.TEST;

//mysql 접속
const connection = mysql.createConnection({
	host: 'localhost',
	user: process.env.SQL_ID,
	password: process.env.SQL_PW,
	database: process.env.SQL_DB
});

connection.connect((err) => {
	if(err) {
		console.error('MySQL 연결 오류:', err);
	} else {
		console.log('MySQL에 정상 접속.');
	}
});

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
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
	res.render('index', {schools: schoolList, user});
});

app.get('/login', (req,res) => {
	res.render('login');
});

app.get('/signup', (req,res) => {
	console.log(req.body);
        const user = req.session.user;
        res.render('signup', {schools: schoolList, user: req.session.user});
});

app.get('/mypage', (req,res) => {
	const school = req.session.school;
	res.render('mypage', {school});
});

app.get('/apply', (req,res) => {
	const school = req.session.school;
	res.render('apply', {school});
});

app.get('/student', (req,res) => {
        const school = req.session.school;
        res.render('student', {school});
});

app.get('/tandp', (req,res) => {
        const school = req.session.school;
        res.render('tandp', {school});
});

// 서버 실행
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

