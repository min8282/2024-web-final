const express = require('express');
const morgan = require('morgan');
const nunjucks = require('nunjucks');
const cookieParser = require('cookie-parser');
const path = require('path');
const session = require('express-session');
const dotenv = require('dotenv');
const passport = require('passport');

dotenv.config();

// import routers
const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post'); // postRouter 추가
const userRouter = require('./routes/user'); // userRouter 추가
const { sequelize } = require('./models');
const passportConfig = require('./passport'); // passport 설정

const app = express();
passportConfig(); // passport 설정 초기화

app.set('port', process.env.PORT || 3000);
app.set('view engine', 'html');
nunjucks.configure('views', {
  express: app,
  autoescape: true,
});

sequelize
  .sync({ force: false })
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public'))); // 정적 파일 제공 설정
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // uploads 폴더 정적 파일로 제공

//
app.use('/js', express.static(path.join(__dirname, 'public/js'))); // script.js를 포함한 폴더 경로 설정


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
      httpOnly: true,
      secure: false,
    },
  })
);

// passport 초기화 & 세션 미들웨어 실행
app.use(passport.initialize());
app.use(passport.session());

// 요청 경로에 따라 router 실행
app.use('/', pageRouter);
app.use('/auth', authRouter);
app.use('/post', postRouter); // postRouter 추가
app.use('/user', userRouter); // userRouter 추가

// 오류 처리: 요청 경로가 없을 경우
app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

// 서버 오류 처리
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error', { message: err.message, error: err });
});

app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기중');
});
