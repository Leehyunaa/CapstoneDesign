var express = require('express');
var router = express();
var mysql = require('mysql');
var async = require('async');
var session = require('express-session');// 세션 사용을 위한 모듈
var MySQLStore = require('express-mysql-session')(session);
var bodyParser = require('body-parser');// POST 방식 전송을 위한 모듈
var bkfd2Password = require("pbkdf2-password");
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var hasher = bkfd2Password();

/**
 *  데이터베이스 연결
 */

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '111111',
    database: 'o3'
});
connection.connect(function (err) {
    if (!err) {
        console.log("Database is connected ... \n\n");
    } else {
        console.log("Error connecting database ... \n\n");
    }
});

/**
 * 템플릿 연결
 */

router.set('view engine', 'ejs');
router.use(express.static('./views'));
router.use(bodyParser.urlencoded({
    extended: false
}));

/**
 * 세션 등록
 */

router.use(session({
    secret: '1234DSFs@adf1234!@#$asd',
    resave: false,
    saveUninitialized: true,
    store: new MySQLStore({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '111111',
        database: 'o3'
    })
}));
router.use(passport.initialize());
router.use(passport.session());
router.get('/count', function (req, res) {
    if (req.session.count) {//세션 값이 있을때
        req.session.count++;
    } else {//처음 접속했을 때 즉 세션 값이 없을 때
        req.session.count = 1; //세션을 만듬
    }
    res.send('count : ' + req.session.count);
});


//URLs
const loginUrl = `/owner/login`;
const logoutUrl = `/owner/logout`;
const registerUrl = `/owner/register`;
const storeMainUrl = `/owner/storeMain`;
const storeMainContentContainerUrl = `/owner/storeMain/container`; //게시물 리스트
const storeMainContentDetailUrl = `/owner/storeMain/container/detail`; // 게시물 글작성
const storeMainContentUploadUrl = `/owner/storeMain/upload/content`;//게시물 사진
const storeProfileUrl = `/owner/profile`; //가게 프로필
const storeProfileImageUrl = `/owner/profile/image`; //가게 프로필 사진
const storeMainFollowerUrl = `/owner/storeMain/follower`; // 팔로워
const storeMainSaleUrl = `/owner/storeMain/sale`; //판매품목
const reviewListUrl = `/owner/storeMain/review/list`; //리뷰 버튼
const reviewListContainerUrl = `/owner/storeMain/review/list/container`; // 리뷰 리스트
const reviewDetailUrl = `/owner/storeMain/review/detail`; //리뷰 글
const writeContentUrl = `/owner/storeMain/write`; //누르면 글
const writeContentImageUrl = `/owner/storeMain/write/image`; // 누르면 사진
const uploadUrl = `/owner/storeMain/upload`;

const productUrl = `/owner/main/store/product`; // 판매 품목 리스트
const productDetailUrl = `/owner/main/store/product/detail`;  // 누르면 글
const writeProductUrl = `/owner/main/store/product/write`; // 판매 품목 글 작성
const writeProductImageUrl = `/owner/main/store/product/write/image`; // 판매 품목 사진
const writeBargain = `/owner/main/store/product/write/bargain`; // 할인정보 등록
const deleteBargain = `/owner/main/store/product/delete/bargain`; // 할인 정보 삭제
const commentUrl = `/owner/content/comment`;
const successUrl = `/success`;
const deleteContentUrl = `/owner/delete/content`;

//Views
const loginView = `user_login`;
const registerView = `storeRegister`;
const logoutView = ``;
const storeMainView = `user_storeMain`;
const storeMainContentContainerView = `user_storeMainContentContainer`;
const storeMainContentDetailView = `user_contentDetail`;
const storeMainContentUploadView = `contentUpload`;
const storeProfileView = `storeProfile`;
const storeMainFollowerView = `follow`;
const storeMainSaleView = `sale`;
const reviewListView = `review_reviewList`;
const reviewListContainerView = `review_reviewListContainer`;
const reviewDetailView = `review_reviewDetail`;
const productView = `product`;
const productDetailView = `productDetail`;
const writeProductView = `writeProduct`;
const writeProductImageView = `writeProductImage`;
const writeContentView = `writeContent`;
const writeContentImageView = `writeContentImage`;
const commentView = `comment`;
const successView = `success`;

//etc
const defaultOwnerImage = `/iconmonstr-shop-13-120.png`;
const isOwner = 1;

/**
 *  로그인 화면
 */

router.get('/', function (req, res) {
    res.redirect(loginUrl);
});

/**
 * 로그아웃 화면
 */

router.get(logoutUrl, function (req, res) {
    console.log('logout', req.session.passport.user);
    req.session.destroy(function () {
        req.session;
    });
    console.log('logout success');
    res.redirect('/');
});

/**
 * 로그인 인증
 */

passport.serializeUser(function (user, done) {
    console.log('serializeUser', user);
    done(null, user.owner_auth);
}); //owner_auth값을 넘겨주어 유저를 찾는데 사용, 이 데이터는 세션에 저장됨
    //serializeUser실행 후 deserializeUser메소드 실행
    //즉 id는 user.owner_auth
passport.deserializeUser(function (id, done) {
    //console.log('deserializeUser', id);
    var sql = 'SELECT * FROM owner WHERE owner_auth=';
    connection.query(sql + mysql.escape(id), function (err, results) {
        console.log(sql, err, results);
        if (err) {
            console.log(err);
            done('There is no user.');
        } else {
            done(null, results[0]);
        }
    });
});

//미들웨어
passport.use(new LocalStrategy({
        usernameField: 'owner_id',
        passwordField: 'owner_password'
    },
    function (owner_id, owner_password, done) {
        console.log('start login function');
        var uname = owner_id;
        var pwd = owner_password;
        var sql = 'SELECT * FROM owner WHERE owner_auth=';
        connection.query(sql + mysql.escape('local:' + uname), function (err, results) {
            console.log(results);
            if (err) {
                return done('There is no user.');
            }
            var user = results[0];
            return hasher({ //비밀번호 암호화
                password: pwd,
                salt: user.salt
            }, function (err, pass, salt, hash) {
                if (hash === user.owner_password) {//저장된 해쉬값과 만든 해쉬값이 같으면 인증 성공
                    console.log('LocalStrategy', user);
                    console.log('login success');
                    done(null, user);//로그인 성공을 의미
                } else {
                    console.log('incorrect password');
                    console.log(hash);
                    console.log(user.owner_password);
                    done(null, false);//로그인 실패를 의미
                }
            });
        });
    }
));


router.get(loginUrl, function (req, res) {
    if (req.session.passport) {
        if (req.session.passport.user) {
            res.redirect(storeMainUrl);
        }
    } else {
        res.render(loginView, {
            idBoxName: 'owner_id',
            passwordBoxName: 'owner_password',
            loginPostUrl: loginUrl,
            registerUrl: registerUrl
        });
    }
});
router.post(loginUrl, passport.authenticate('local', {
    failureRedirect: loginUrl
}), function (req, res) {
    console.log(req.session.passport.user);
    res.redirect(storeMainUrl);
});

/**
 * 회원가입
 */

router.get(registerUrl, function (req, res) {
    console.log('1, ' + registerUrl + 'get callback start');
    res.render(registerView, {
        storeRegisterPostUrl: registerUrl
    });
});
router.post(registerUrl, function (req, res) {
    console.log('1, ' + registerUrl + 'post callback start');
    hasher({
        password: req.body.owner_pw
    }, function (err, pass, salt, hash) {
        var owner = { //POST방식으로 보낸 값
            owner_auth: 'local:' + req.body.owner_id,
            owner_id: req.body.owner_id,
            owner_password: hash,
            salt: salt,
            store: req.body.store,
            address1: req.body.address1,
            address2: req.body.address2,
            address3: req.body.address3,
            address4: req.body.address4,
            tel: req.body.tel,
            time: req.body.time,
            image_url: defaultOwnerImage
        };
        console.log('1.1, ' + registerUrl + owner);
        var sql = 'INSERT INTO owner SET ?';
        connection.query(sql, owner, function (err, results) {
            if (err) {
                console.log(err);
                res.status(500);
            } else {
                req.login(owner, function (err) {
                    req.session.save(function () {
                        res.redirect(loginUrl);
                    });
                });
            }
        });
    });
});

/**
 * 메인 화면
 */

router.get(storeMainUrl, function (req, res) {
    console.log('1, storeMain');
    const ownerAuth = req.session.passport.user;
    console.log('1.1, ' + ownerAuth);
    var sql1 = `SELECT number FROM content_list WHERE owner_auth=` + mysql.escape(ownerAuth);
    connection.query(sql1, function (err, results1) {
        var sql2 = `SELECT user_auth FROM follow WHERE owner_auth=` + mysql.escape(ownerAuth);
        connection.query(sql2, function (err, results2) {
            var sql = 'SELECT * FROM owner WHERE owner_auth=' + mysql.escape(ownerAuth);
            connection.query(sql, function (err, results) {
                //console.log(results);
                console.log('2, storeMain');
                // console.log(results1.length);
                // console.log(results2.length);
                if (err) return done(err);
                const info = results[0];
                console.log('3, before render');
                res.render(storeMainView, {
                    storeMainUrl: storeMainUrl,
                    storeProfileUrl: storeProfileUrl,
                    storeProfileImageUrl: storeProfileImageUrl,
                    writeContentUrl: writeContentUrl,
                    logoutUrl: logoutUrl,
                    isOwner: 1,
                    productUrl: productUrl,
                    //followBtnUrl: followBtnUrl + '/' + ownerAuth,
                    contentCount: results1.length,
                    followerCount: results2.length,
                    contents: results[0],
                    saleUrl: storeMainSaleUrl + '/' + ownerAuth,
                    followUrl: storeMainFollowerUrl + '/' + ownerAuth,
                    reviewUrl: reviewListUrl,
                    contentUploadUrl: storeMainContentUploadUrl + '/' + ownerAuth,
                    storeMainContentContainerUrl: storeMainContentContainerUrl
                });
                console.log('4, after render');
            });
        });
    });
    console.log('5, after query');
});

/**
 * 프로필 화면
 */

router.get(storeProfileUrl, function (req, res) {
    const ownerAuth = req.session.passport.user;
    var sql = ` SELECT *
              FROM owner
              WHERE owner_auth=` + mysql.escape(ownerAuth);
    connection.query(sql, function (err, results) {
        res.render(storeProfileView, {
            storeMainUrl: storeMainUrl,
            storeProfileUrl: storeProfileUrl,
            contents: results,
            logoutUrl: logoutUrl,
            isOwner: 1
        });
    });
});
router.post(storeProfileUrl, function (req, res) {
    const ownerAuth = req.session.passport.user;
    var owner = {
        store: req.body.store,
        address1: req.body.address1,
        address2: req.body.address2,
        address3: req.body.address3,
        address4: req.body.address4,
        tel: req.body.tel,
        time: req.body.time
    };
    var sql = ` UPDATE owner
              SET ?
              WHERE owner_auth=` + mysql.escape(ownerAuth);
    connection.query(sql, owner, function (err, results) {
        res.redirect(storeMainUrl);
    });
});

/**
 * 게시글 작성
 */

router.get(writeContentUrl, function (req, res) {
    const ownerAuth = req.session.passport.user;
    var sql = ` SELECT store
              FROM owner
              WHERE owner_auth=` + mysql.escape(ownerAuth);
    connection.query(sql, function (err, results) {
        res.render(writeContentView, {
            storeMainUrl: storeMainUrl,
            writeContentUrl: writeContentUrl,
            contents: results,
            logoutUrl: logoutUrl,
            isOwner: 1
        });
    });
});

router.post(writeContentUrl, function (req, res) {
    const ownerAuth = req.session.passport.user;
    console.log('1, ', writeContentUrl, ' post callback');
    var sql2 = `SELECT MAX(number) AS maxNum
              FROM content_list
              WHERE owner_auth=` + mysql.escape(ownerAuth);
    //console.log(sql2);
    connection.query(sql2, function (err, results2) {
        //console.log(results2);
        if (results2[0].maxNum == null) {
            var number = 0;
        } else {
            var number = results2[0].maxNum;
        }
        console.log(number);
        var sql = `INSERT INTO content_list SET ?`;
        number = number + 1;
        var time = new Date();
        var date = '';
        if (time.getMonth() < 9) {
            var month = '0' + (time.getMonth() + 1);
        } else {
            var month = time.getMonth() + 1;
        }
        if (time.getDate() < 10) {
            var day = '0' + time.getDate();
        } else {
            var day = time.getDate();
        }
        if (time.getHours() < 10) {
            var hour = '0' + time.getHours();
        } else {
            var hour = time.getHours();
        }
        if (time.getMinutes() < 10) {
            var min = '0' + time.getMinutes();
        } else {
            var min = time.getMinutes();
        }
        if (time.getSeconds() < 10) {
            var sec = '0' + time.getSeconds();
        } else {
            var sec = time.getSeconds();
        }
        var date = time.getFullYear() + month + day + hour + min + sec;
        console.log(date);
        var content = {
            owner_auth: ownerAuth,
            number: number,
            content: req.body.content,
            date: date
        };
        // console.log(number);
        // console.log(sql);
        connection.query(sql, content, function (err, results) {
            //console.log(results);
            res.render(writeContentImageView, {
                storeMainUrl: storeMainUrl,
                logoutUrl: logoutUrl,
                isOwner: 1,
                writeContentImageUrl: writeContentImageUrl + '/' + number,
                storeMainUrl: storeMainUrl
            });
        });
    });
});

/**
 * 메뉴 목록
 */

router.get(productUrl, function (req, res) {
    const ownerAuth = req.session.passport.user;
    var sql = ` SELECT *
              FROM product_info
              WHERE owner_auth=` + mysql.escape(ownerAuth);
    connection.query(sql, function (err, results) {
        console.log(results);
        // console.log(sql);
        var sql1 = `SELECT store
                FROM owner
                WHERE owner_auth=` + mysql.escape(ownerAuth);
        connection.query(sql1, function (err, results1) {
            res.render(productView, {
                storeMainUrl: storeMainUrl,
                store: results1[0].store,
                logoutUrl: logoutUrl,
                isOwner: 1,
                productDetailUrl: productDetailUrl,
                contents: results,
                writeProductUrl: writeProductUrl
            });
        });
    });
});

/**
 * 메뉴 등록
 */

router.get(writeProductUrl, function (req, res) {
    const ownerAuth = req.session.passport.user;
    var sql = ` SELECT store
              FROM owner
              WHERE owner_auth=` + mysql.escape(ownerAuth);
    connection.query(sql, function (err, results) {
        res.render(writeProductView, {
            storeMainUrl: storeMainUrl,
            contents: results,
            logoutUrl: logoutUrl,
            isOwner: 1,
            writeProductUrl: writeProductUrl
        });
    });
});
router.post(writeProductUrl, function (req, res) {
    const ownerAuth = req.session.passport.user;
    console.log('1, ', writeProductUrl, ' post callback');
    var sql2 = `SELECT MAX(number) AS maxNum
              FROM product_info
              WHERE owner_auth=` + mysql.escape(ownerAuth);
    connection.query(sql2, function (err, results2) {
        console.log(results2);
        if (results2[0].maxNum == null) {
            var number = 0;
        } else {
            var number = results2[0].maxNum;
        }
        console.log(number);
        var sql1 = `SELECT *
                FROM product_info
                WHERE product=` + mysql.escape(req.body.product) + ` AND owner_auth=` + mysql.escape(ownerAuth);
        connection.query(sql1, function (err, results1) {
            console.log(results1);
            if (results1 == '') {
                console.log('blank');
                var sql = `INSERT INTO product_info SET ?`;
                number = number + 1;
                var product = {
                    owner_auth: ownerAuth,
                    number: number,
                    product: req.body.product,
                    price: req.body.price
                };
            } else {
                number = results1[0].number
                var sql = ` UPDATE product_info
                    SET ?
                    WHERE number=` + mysql.escape(number) + ` AND owner_auth=` + mysql.escape(ownerAuth);
                var product = {
                    owner_auth: ownerAuth,
                    product: req.body.product,
                    price: req.body.price
                };
            }
            console.log(number);
            console.log(sql);
            connection.query(sql, product, function (err, results) {
                //console.log(results);
                res.render(writeProductImageView, {
                    logoutUrl: logoutUrl,
                    isOwner: isOwner,
                    writeProductImageUrl: writeProductImageUrl + '/' + number,
                    productUrl: productUrl
                });
            });
        });
    });
});


router.get(productDetailUrl + '/:owner_auth/:number', function (req, res) {
    var ownerAuth = req.session.passport.user;
    var sql = ` SELECT product_info.*, owner.store
              FROM product_info
              JOIN owner
              ON product_info.owner_auth=owner.owner_auth
              WHERE product_info.owner_auth=` + mysql.escape(ownerAuth) + ` and number=` + mysql.escape(req.params.number);
    connection.query(sql, function (err, results) {
        console.log(results);
        res.render(productDetailView, {
            storeMainUrl: storeMainUrl,
            writeBargain: writeBargain,
            deleteBargain: deleteBargain,
            logoutUrl: logoutUrl,
            isOwner: 1,
            contents: results[0]
        });
    });
});

/**
 * 메뉴 할인 정보 등록
 */

router.post(writeBargain, function (req, res) {
    var ownerAuth = req.session.passport.user;
    console.log('req_body : ', req.body);
    var sql = ` UPDATE product_info
              SET ?
              WHERE owner_auth=` + mysql.escape(ownerAuth) + ` and number=` + mysql.escape(req.body.number);
    var product = {
        sale: req.body.bargain
    };
    connection.query(sql, product, function (err, results) {
        res.redirect(productUrl);
    });
});

/**
 * 메뉴 할인 정보 삭제
 */

router.post(deleteBargain, function (req, res) {
    var ownerAuth = req.session.passport.user;
    console.log('req_body : ', req.body);
    var sql = ` UPDATE product_info
              SET ?
              WHERE owner_auth=` + mysql.escape(ownerAuth) + ` and number=` + mysql.escape(req.body.number);
    var product = {
        sale: null
    };
    connection.query(sql, product, function (err, results) {
        res.redirect(productUrl);
    });
});

router.get(storeMainContentContainerUrl, function (req, res) {
    console.log('1, storeMainContainer');
    const ownerAuth = req.session.passport.user;
    var sql = 'SELECT * FROM content_list WHERE owner_auth=';
    connection.query(sql + mysql.escape(ownerAuth), function (err, results) {
        //console.log(results);
        res.render(storeMainContentContainerView, {
            storeMainUrl: storeMainUrl,
            owner_auth: ownerAuth,
            contents: results,
            storeMainContentDetailUrl: storeMainContentDetailUrl
        });
    });
});
router.get(storeMainContentDetailUrl + '/:number', function (req, res) {
    console.log('1, contentDetail');
    const ownerAuth = req.session.passport.user;
    const sql = ` SELECT content_list.*, owner.*
                FROM content_list
                JOIN owner
                ON content_list.owner_auth=owner.owner_auth
                WHERE content_list.owner_auth=` + mysql.escape(ownerAuth) + ` AND content_list.number=` + mysql.escape(req.params.number);
    connection.query(sql, function (err, results) {
        //console.log(results);
        res.render(storeMainContentDetailView, {
            isOwner: isOwner,
            deleteContentUrl: deleteContentUrl,
            commentUrl: commentUrl + '/' + ownerAuth + '/' + results[0].number,
            storeMainUrl: storeMainUrl,
            contents: results[0]
        });
    });
});

/**
 * 게시물 사진 업로드
 */

router.get(storeMainContentUploadUrl, function (req, res) {
    console.log('1, contentUpload');
    res.render(storeMainContentUploadView, {
        uploadUrl: uploadUrl,
        storeMainUrl: storeMainUrl
    });
});

/**
 * 게시물 삭제
 */

router.post(deleteContentUrl, function (req, res) {
    console.log('1, deleteContent', deleteContentUrl);
    const ownerAuth = req.session.passport.user;
    const sql = ` DELETE
                FROM content_list
                WHERE owner_auth=` + mysql.escape(ownerAuth) + ` AND number=` + mysql.escape(req.body.number);
    connection.query(sql, function (err, results) {
        res.redirect(storeMainContentContainerUrl);
    });
});

/**
 * 팔로우 수
 */

router.get(storeMainFollowerUrl, function (req, res) {
    console.log('1, follow');
    const sql = 'SELECT * FROM follow WHERE owner_auth=';
    connection.query(sql + mysql.escape(req.session.passport.user), function (err, results) {
        console.log(results);
        res.render(storeMainFollowerView, {
            storeMainUrl: storeMainUrl,
            follow: results
        });
    });
});

/**
 * 리뷰 리스트
 */

router.get(reviewListUrl, function (req, res) {
    console.log('1, reviewList');
    const ownerAuth = req.session.passport.user;
    console.log('1.1, ' + ownerAuth);
    var sql = 'SELECT store FROM owner WHERE owner_auth=' + mysql.escape(ownerAuth);
    connection.query(sql, function (err, results) {
        //console.log(results);
        console.log('2, review list before render');
        res.render(reviewListView, {
            storeMainUrl: storeMainUrl,
            logoutUrl: logoutUrl,
            isOwner: 1,
            owner_auth: ownerAuth,
            store: results[0].store,
            reviewListContainerUrl: reviewListContainerUrl
        });
        console.log('3, review list after render');
    });
    console.log('4, review list after callback');
});
//Reviews Container
router.get(reviewListContainerUrl, function (req, res) {
    console.log('1, reviewContainer');
    const ownerAuth = req.session.passport.user;
    console.log('1.1, reviewContainer/' + ownerAuth);
    var sql = ` SELECT r2.*, u.user_id, u.name
              FROM (
              SELECT r1.*, o.store
              FROM review AS r1
              JOIN owner AS o
              ON r1.owner_auth = o.owner_auth
              WHERE o.owner_auth=` + mysql.escape(ownerAuth) + `) AS r2
              JOIN  user AS u
            ON r2.user_auth = u.user_auth`;
    connection.query(sql, function (err, results) {
        if (err) throw err;
        console.log(results);
        console.log('2, review container before render');
        res.render(reviewListContainerView, {
            reviewDetailUrl: reviewDetailUrl,
            contents: results
        });
    });
});
//Review Detail
router.get(reviewDetailUrl + '/:number', function (req, res) {
    console.log('1, reviewDetail');
    const ownerAuth = req.session.passport.user;
    const reviewNumber = req.params.number;
    console.log('1.1, review/detail/' + ownerAuth + '/' + reviewNumber);
    var sql = ` SELECT r2.*, u.user_id, u.name
              FROM (
              SELECT r1.*, o.store
              FROM review AS r1
              JOIN owner AS o
              ON r1.owner_auth = o.owner_auth
              WHERE o.owner_auth=` + mysql.escape(ownerAuth) + `) AS r2
              JOIN  user AS u
            ON r2.user_auth = u.user_auth`;
    var query = connection.query(sql, function (err, results) {
        if (err) throw err;
        console.log(results[reviewNumber]);
        console.log('2, review detail before render');
        res.render(reviewDetailView, {
            storeMainUrl: storeMainUrl,
            logoutUrl: logoutUrl,
            contents: results[reviewNumber],
            isOwner: 1
        });
        console.log('3, review detail after render');
    });
    console.log('4, review detail after callback');
});

/**
 * s3 파일 업로드
 */

var Upload = require('./s3upload/uploadservice');
router.post(storeProfileImageUrl, function (req, res) {
    //var content=req.body.content;
    console.log('1, upload');
    var tasks = [
        function (callback) {
            Upload.formidable(req, function (err, files, field) {
                callback(err, files);
            });
        }, function (files, callback) {
            Upload.s3(files, function (err, result) {
                console.log('upload.s3');
                //console.log(result);
                callback(err, files);
                var ownerAuth = req.session.passport.user;
                var sql = `UPDATE owner SET ? WHERE owner_auth=` + mysql.escape(ownerAuth);
                var params = result;
                var image = {
                    image_url: params.Location
                };
                connection.query(sql, image, function (err, results) {
                    if (err) {
                        console.log(err);
                    } else {
                        // console.log(rows);
                    }
                });
            });
        }
    ];
    //사용자에게 업로드 여부 메세지 전송
    async.waterfall(tasks, function (err, result) {
        if (!err) {
            //res.json({success:true, msg:'업로드 성공'})
            res.redirect(storeMainUrl);
        } else {
            res.redirect(storeMainUrl);
        }
    });
});
router.post(writeContentImageUrl + '/:number', function (req, res) {
    //var content=req.body.content;
    var ownerAuth = req.session.passport.user;
    console.log('1, upload');
    var tasks = [
        function (callback) {
            Upload.formidable(req, function (err, files, field) {
                callback(err, files);
            });
        },
        function (files, callback) {
            Upload.s3(files, function (err, result) {
                console.log('upload.s3');
                //console.log(result);
                callback(err, files);
                var sql = `UPDATE content_list SET ? WHERE number=` + mysql.escape(req.params.number) + `AND owner_auth=` + mysql.escape(ownerAuth);
                var params = result;
                var image = {
                    url: params.Location
                };
                connection.query(sql, image, function (err, results) {
                    if (err) {
                        console.log(err);
                    } else {
                        // console.log(rows);
                    }
                });
            });
        }
    ];
    //사용자에게 알려줌
    async.waterfall(tasks, function (err, result) {
        if (!err) {
            //res.json({success:true, msg:'업로드 성공'})
            res.redirect(storeMainUrl);
        } else {
            res.redirect(storeMainUrl);
        }
    });
});
router.post(writeProductImageUrl + '/:number', function (req, res) {
    //var content=req.body.content;
    console.log('1, upload');
    var tasks = [
        function (callback) {
            console.log('2, upload');
            Upload.formidable(req, function (err, files, field) {
                console.log('3, upload');
                callback(err, files);
            });
        },
        function (files, callback) {
            console.log('4, upload');
            Upload.s3(files, function (err, result) {
                console.log('5, upload');
                var ownerAuth = req.session.passport.user;
                console.log('upload.s3');
                //console.log(result);
                callback(err, files);
                var sql = `UPDATE product_info SET ? WHERE number=` + mysql.escape(req.params.number) + `AND owner_auth=` + mysql.escape(ownerAuth);
                var params = result;
                var image = {
                    product_imgUrl: params.Location
                };
                connection.query(sql, image, function (err, results) {
                    console.log('6, upload');
                    if (err) {
                        console.log(err);
                    } else {
                        // console.log(rows);
                    }
                });
            });
        }
    ];
    //사용자에게 알려줌
    async.waterfall(tasks, function (err, result) {
        console.log('7, upload');
        if (!err) {
            console.log('8, upload');
            //res.json({success:true, msg:'업로드 성공'})
            res.redirect(productUrl);
        } else {
            console.log('9, upload');
            res.redirect(productUrl);
        }
    });
});

router.listen(3000, function () {
    console.log('connect 3000 port owner server');
});
