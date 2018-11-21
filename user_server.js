var express = require('express');
var router = express();
var mysql = require('mysql');
var async = require('async');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var bodyParser = require('body-parser');
var bkfd2Password = require("pbkdf2-password");
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var hasher = bkfd2Password();
var FacebookStrategy = require('passport-facebook').Strategy;
var logout = require('express-passport-logout');


/**
 * 데이터 베이스 연결
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

//URLs
const loginUrl = `/user/login`;
const logoutUrl = `/user/logout`;
const registerUrl = `/user/register`;
const mainUrl = `/user/main`;
const mainTimelineUrl = `/user/main/timeline`;
const mainBargainsUrl = `/user/main/sale`;
const mainSearchUrl = `/user/main/search`;
const mainFollowsUrl = `/user/main/follows`;
const mainStoreUrl = `/user/main/store`;
const mainUserInfoUrl = `/user/main/profile`;
const userProfileImageUploadUrl = `/user/main/profile/image`;
const successUrl = `/success`;
const followUrl = `/user/main/store/follow`;
const writeReviewUrl = `/user/main/store/review/write`;
const followBtnUrl = `/followBtn`;
const productUrl = `/user/main/store/product`;
const productDetailUrl = `/user/main/store/product/detail`;

const storeMainUrl = `/owner/storeMain`;
const storeMainContentContainerUrl = `/owner/storeMain/container`;
const storeMainContentDetailUrl = `/owner/storeMain/container/detail`;
const storeMainContentUploadUrl = `/owner/storeMain/upload/content`;
const storeMainFollowerUrl = `/owner/storeMain/follower`;
const storeMainSaleUrl = `/owner/storeMain/sale`;
const reviewListUrl = `/owner/storeMain/review/list`;
const reviewListContainerUrl = `/owner/storeMain/review/list/container`;
const reviewDetailUrl = `/owner/storeMain/review/detail`;
const uploadUrl = `/upload`;
const commentUrl = `/owner/content`;


//Views
const loginView = `user_login`;
const registerView = `user_register`;
const timelineView = `user_timeline`;
const timelineFollowContainerView = `user_timelineFollowContainer`;
const timelineSaleContainerView = `user_timelineSaleContainer`;
const mainSearchView = `search2`;
const mainUserInfoView = `user_userInformation`;
const searchResultView = `user_searchResult`;
const storeMainContentDetailView = `user_contentDetail`;
const followBtnView = `followBtn`;
const followingStoreView = `user_followingStore`;

const storeMainView = `user_storeMain`;
const storeMainContentContainerView = `user_storeMainContentContainer`;
const storeMainContentUploadView = `contentUpload`;
const storeMainFollowerView = `follow`;
const storeMainSaleView = `sale`;
const reviewListView = `review_reviewList`;
const reviewListContainerView = `review_reviewListContainer`;
const reviewDetailView = `review_reviewDetail`;
const writeReviewView = `user_review_write`;
const successView = `success`;
const productView = `product`;
const productDetailView = `productDetail`;
const commentView = `comment`;

//etc
const defaultUserImage = `/iconmonstr-user-20-48.png`;
const isOwner = 0;


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

/**
 * 세션 등록
 */

router.use(passport.initialize());
router.use(passport.session());
router.get('/count', function (req, res) {
    if (req.session.count) {
        req.session.count++;
    } else {
        req.session.count = 1;
    }
    res.send('count : ' + req.session.count);
});

/**
 * 로그인 인증
 */

passport.serializeUser(function (user, done) {
    console.log('serializeUser', user);
    done(null, user.user_auth);
});
passport.deserializeUser(function (id, done) {
    //console.log('deserializeUser', id);
    var sql = 'SELECT * FROM user WHERE user_auth=?';
    connection.query(sql, [id], function (err, results) {
        console.log(sql, 'err:' + err, results);
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
        usernameField: 'user_id',
        passwordField: 'user_password'
    },
    function (user_id, user_password, done) {
        console.log('login function start');
        var uname = user_id;
        var pwd = user_password;
        var sql = 'SELECT * FROM user WHERE user_auth=?';
        connection.query(sql, ['local:' + uname], function (err, results) {
            console.log(results);
            if (err) {
                return done('There is no user.');
            }
            var user = results[0];
            return hasher({
                password: pwd,
                salt: user.salt
            }, function (err, pass, salt, hash) {
                if (hash === user.user_password) {
                    console.log('LocalStrategy', user);
                    console.log('login success');
                    done(null, user);
                } else {
                    console.log('incorrect password');
                    console.log(hash);
                    console.log(user.user_password);
                    done(null, false);
                }
            });
        });
    }
));

/**
 * 로그인 화면
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
router.get(loginUrl, function (req, res) {
    if (req.session.passport) {
        if (req.session.passport.user) {
            res.redirect(mainUrl);
        }
    } else {
        res.render(loginView, {
            idBoxName: 'user_id',
            passwordBoxName: 'user_password',
            loginPostUrl: loginUrl,
            registerUrl: registerUrl
        });
    }
});
router.post(loginUrl, passport.authenticate('local', {
    failureRedirect: loginUrl
}), function (req, res) {
    console.log('loginPostFunction');
    console.log(req.session.passport.user);
    res.redirect(mainUrl);
});

/**
 * 회원가입 화면
 */

router.get(registerUrl, function (req, res) {
    console.log('1, ' + registerUrl + 'get callback start');
    res.render(registerView, {
        idBoxName: 'user_id',
        passwordBoxName: 'user_password',
        nameBoxName: 'user_name',
        registerPostUrl: registerUrl
    });
});
router.post(registerUrl, function (req, res) {
    console.log('1, ' + registerUrl + 'post callback start');
    hasher({
        password: req.body.user_password
    }, function (err, pass, salt, hash) {//POST방식으로 보낸 값
        var user = {
            user_auth: 'local:' + req.body.user_id,
            user_id: req.body.user_id,
            user_password: hash,
            salt: salt,
            name: req.body.user_name,
            image_url: defaultUserImage
        };
        console.log('1.1, ' + registerUrl + user);
        var sql = 'INSERT INTO user SET ?';
        connection.query(sql, user, function (err, results) {
            if (err) {
                console.log(err);
                res.status(500);
            } else {
                req.login(user, function (err) {
                    req.session.save(function () {
                        res.redirect(loginUrl);
                    });
                });
            }
        });
    });
});

/**
 * 메인화면
 */

router.get(mainUrl, function (req, res) {
    console.log('1, ' + mainUrl + ' get callback start');
    var userAuth = req.session.passport.user;
    console.log('1.1, ' + mainUrl + '/' + userAuth);
    console.log();
    res.render(timelineView, {
        logoutUrl: logoutUrl,
        iframeUrl: mainTimelineUrl,
        searchUrl: mainSearchUrl,
        followsUrl: mainFollowsUrl,
        userInfoUrl: mainUserInfoUrl
    });
});

/**
 * 팔로우 리스트 보기
 */

router.get(mainFollowsUrl, function (req, res) {
    const userAuth = req.session.passport.user;
    const sql = 'select * from owner where owner_auth in (select owner_auth from follow where user_auth=?);'
    var params = userAuth;
    connection.query(sql, params, function (err, results) {
        var isStore = 1;
        if (results.length == 0) {
            isStore = 0;
        }
        //console.log(results);
        res.render(followingStoreView, {
            isStore: isStore,
            followBtnUrl: followBtnUrl,
            storeUrl: mainStoreUrl,
            contents: results
        });
    });
});

/**
 * 타임라인
 */

router.get(mainTimelineUrl, function (req, res) {
    console.log('1, ' + mainTimelineUrl + ' get callback start');
    const userAuth = req.session.passport.user;
    console.log('1.1, ' + mainTimelineUrl + '/' + userAuth);
    const sql1 = `SELECT owner_auth FROM follow WHERE user_auth=` + mysql.escape(userAuth);
    connection.query(sql1, function (err, results) {
        if (err) return done(err);
        //console.log('results1 : ', results);
        //console.log('sql1 : ', sql1);
        if (results.length != 0) {
            let sql2 = `
    SELECT DISTINCT content_list.*, owner.*
    FROM content_list, owner
    `;
            //console.log(results.length);
            for (var i = 0; i < results.length; i++) {
                if (results.length > 0 && i == 0) {
                    sql2 += ` WHERE `;
                }
                sql2 += `(content_list.owner_auth=` + mysql.escape(results[i].owner_auth) + ` and owner.owner_auth=` + mysql.escape(results[i].owner_auth) + ')';
                if (i < results.length - 1) {
                    sql2 += ' or ';
                }
            }
            sql2 += ` ORDER BY content_list.date DESC`;
            // console.log('mainTimelineUrl.sql2 :', sql2);
            connection.query(sql2, function (err, results2) {
                //console.log(results2);
                res.render(timelineFollowContainerView, {
                    contents: results2,
                    iframeUrl: mainBargainsUrl,
                    storeUrl: mainStoreUrl
                });
            });
        } else {
            res.render(timelineFollowContainerView, {
                contents: null,
                iframeUrl: mainBargainsUrl,
                storeUrl: mainStoreUrl
            });
        }
    });
});

/**
 * 인스타 스토리
 */

router.get(mainBargainsUrl, function (req, res) {
    console.log('1, ' + mainBargainsUrl + ' get callback start');
    const userAuth = req.session.passport.user;
    const sql1 = `SELECT owner_auth FROM follow WHERE user_auth=` + mysql.escape(userAuth);
    connection.query(sql1, function (err, results1) {
        var sql2 = `SELECT product_info.*, owner.image_url, owner.store FROM product_info INNER JOIN owner ON product_info.owner_auth=owner.owner_auth WHERE (product_info.sale is not null) and (`;
        for (var i = 0; i < results1.length; i++) {
            sql2 += `product_info.owner_auth=`;
            sql2 += mysql.escape(results1[i].owner_auth);
            if (i < results1.length - 1) {
                sql2 += ` OR `;
            }
        }
        sql2 += `)`;
        //console.log('mainBargains.results1', results1);
        //console.log('mainBargains.sql2 : ', sql2);
        connection.query(sql2, function (err, results) {
            // console.log('mainBargains.results', results);
            res.render(timelineSaleContainerView, {
                storeUrl: mainStoreUrl,
                contents: results
            });
        });
    });
});

/**
 * 검색 화면
 */

router.get(mainSearchUrl, function (req, res) {
    var userAuth = req.session.passport.user;
    var sql = `SELECT address1, address2, address3 FROM user WHERE user_auth=` + mysql.escape(userAuth);
    connection.query(sql, function (err, results) {
        // console.log('result', results);
        res.render(mainSearchView, {
            contents: results,
            searchUrl: mainSearchUrl
        });
    });
});
router.post(mainSearchUrl, function (req, res) {
    console.log('1, ', mainSearchUrl);
    var store = req.body.store;
    var address1 = req.body.address1;
    var address2 = req.body.address2;
    var address3 = req.body.address3;
    var lastStr1 = address1.charAt(address1.length - 1);
    var lastStr2 = address2.charAt(address2.length - 1);
    var lastStr3 = address3.charAt(address3.length - 1);

    if (lastStr1 == '시' || lastStr1 == '도') {
        address1 = address1.slice(0, -1);
    }
    if (lastStr2 == '시' || lastStr2 == '군' || lastStr2 == '구') {
        address2 = address2.slice(0, -1);
    }
    if (lastStr3 == '읍' || lastStr3 == '면' || lastStr3 == '동') {
        address3 = address3.slice(0, -1);
    }
    // console.log('address');
    // console.log(address1,address2, address3);
    // if(address3 == null)console.log('null');
    // if(address3 == '')console.log('blank');
    var sql = `SELECT owner_auth, owner_id, store, image_url FROM owner`;
    if (address1 != '' || address2 != '' || address3 != '' || store != '') {
        sql += ` WHERE `;
        if (store != '') {
            sql += `store LIKE ` + mysql.escape('%' + store + '%');
        } else {
            if (address1 != '') {
                sql += `address1 LIKE ` + mysql.escape('%' + address1 + '%');
            }
            if (address1 != '' && (address2 != '' || address3 != '')) {
                sql += ` and `;
                if (address2 != '') {
                    sql += `address2 LIKE ` + mysql.escape('%' + address2 + '%');
                }
            }
            if ((address1 != '' || address2 != '') && address3 != '') {
                sql += ` and `;
            }
            if (address3 != '') {
                sql += `address3 LIKE ` + mysql.escape('%' + address3 + '%');
            }
        }
    }
    console.log('search sql = ', sql);
    connection.query(sql, function (err, results) {
        //console.log('search results = ', results);
        //console.log(req.headers);
        var isStore = 1;
        if (results.length == 0) {
            isStore = 0;
        }
        res.render(searchResultView, {
            followBtnUrl: followBtnUrl,
            isStore: isStore,
            contents: results,
            storeUrl: mainStoreUrl
        });
    });
});

/**
 * user 프로필 화면
 */

router.get(mainUserInfoUrl, function (req, res) {
    var userAuth = req.session.passport.user;
    var sql = `SELECT * FROM user WHERE user_auth=` + mysql.escape(userAuth);
    connection.query(sql, function (err, results) {
        //console.log('results : ',results);
        res.render(mainUserInfoView, {
            contents: results,
            userInfoPostUrl: mainUserInfoUrl,
            uploadUrl: userProfileImageUploadUrl
        });
    });
});
router.post(mainUserInfoUrl, function (req, res) {
    var userAuth = req.session.passport.user;
    var user = {
        name: req.body.name,
        address1: req.body.address1,
        address2: req.body.address2,
        address3: req.body.address3,
        address4: req.body.address4,
    };
    var sql = `UPDATE user SET ? WHERE user_auth=` + mysql.escape(req.session.passport.user);
    connection.query(sql, user, function (err, results) {
        res.redirect(mainUserInfoUrl);
    });
});

/**
 * 타임라인 화면
 */

router.get(mainStoreUrl + '/:owner_auth', function (req, res) {
    console.log('1, storeMain');
    const ownerAuth = req.params.owner_auth;
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
                    logoutUrl: logoutUrl,
                    isOwner: 0,
                    productUrl: productUrl + '/' + ownerAuth,
                    followBtnUrl: followBtnUrl + '/' + ownerAuth,
                    contentCount: results1.length,
                    followerCount: results2.length,
                    contents: results[0],
                    saleUrl: storeMainSaleUrl + '/' + ownerAuth,
                    followUrl: storeMainFollowerUrl + '/' + ownerAuth,
                    reviewUrl: reviewListUrl + '/' + ownerAuth,
                    contentUploadUrl: storeMainContentUploadUrl + '/' + ownerAuth,
                    storeMainContentContainerUrl: storeMainContentContainerUrl + '/' + ownerAuth
                });
                console.log('4, after render');
            });
        });
    });
    console.log('5, after query');
});

/**
 * 메뉴 화면
 */

router.get(productUrl + '/:owner_auth', function (req, res) {
    const ownerAuth = req.params.owner_auth;
    const userAuth = req.session.passport.user;
    //var sql = `SELECT * FROM product_info WHERE owner_auth=` + mysql.escape(ownerAuth);
    var sql = ` SELECT product_info.*, owner.store
              FROM product_info
              JOIN owner
              ON product_info.owner_auth=owner.owner_auth
              WHERE product_info.owner_auth=` + mysql.escape(ownerAuth);
    connection.query(sql, function (err, results) {
        console.log(results);
        res.render(productView, {
            storeMainUrl: storeMainUrl,
            isOwner: 0,
            productDetailUrl: productDetailUrl,
            contents: results
        });
    });
});

/**
 * 메뉴 글 작성
 */

router.get(productDetailUrl + '/:owner_auth/:number', function (req, res) {
    const ownerAuth = req.params.owner_auth;
    const userAuth = req.session.passport.user;
    var sql = ` SELECT product_info.*, owner.store
              FROM product_info
              JOIN owner
              ON product_info.owner_auth=owner.owner_auth
              WHERE product_info.owner_auth=` + mysql.escape(ownerAuth) + ` and number=` + mysql.escape(req.params.number);
    connection.query(sql, function (err, results) {
        console.log(results);
        res.render(productDetailView, {
            storeMainUrl: storeMainUrl,
            isOwner: 0,
            contents: results[0]
        });
    });
});

/**
 * 팔로우 버튼
 */

router.get(followBtnUrl + '/:owner_auth', function (req, res) {
    const ownerAuth = req.params.owner_auth;
    const userAuth = req.session.passport.user;
    var sql = `SELECT * FROM follow WHERE user_auth=` + mysql.escape(userAuth) + ` and owner_auth=` + mysql.escape(ownerAuth);
    connection.query(sql, function (err, results) {
        if (results != '') { //팔로우를 했으면
            var isFollow = 1;
        } else {
            var isFollow = 0;
        }
        res.render(followBtnView, {
            isFollow: isFollow,
            followUrl: followUrl + '/' + ownerAuth
        });
    });
});

/**
 * 팔로워
 */

router.get(followUrl + '/:owner_auth', function (req, res) {
    console.log('1, store follow');
    var ownerAuth = req.params.owner_auth;
    var userAuth = req.session.passport.user;
    var sql = `SELECT * FROM follow WHERE user_auth=` + mysql.escape(userAuth) + ` and owner_auth=` + mysql.escape(ownerAuth);
    connection.query(sql, function (err, results) {
        console.log('2, store follow sql conn');
        if (results != '') {
            var sql2 = `DELETE FROM follow WHERE user_auth=` + mysql.escape(userAuth) + ` and owner_auth=` + mysql.escape(ownerAuth);
        } else {
            var sql2 = `INSERT INTO follow VALUES (?,?)`;
        }
        connection.query(sql2, [ownerAuth, userAuth], function (err, results) {
            res.redirect(followBtnUrl + '/' + ownerAuth);
        });
    });
});

/**
 * 게시물 리스트
 */

router.get(storeMainContentContainerUrl + '/:owner_auth', function (req, res) {
    console.log('1, storeMainContainer');
    const ownerAuth = req.params.owner_auth;
    var sql = 'SELECT * FROM content_list WHERE owner_auth=';
    connection.query(sql + mysql.escape(ownerAuth), function (err, results) {
        //console.log(results);
        res.render(storeMainContentContainerView, {
            owner_auth: ownerAuth,
            contents: results,
            storeMainContentDetailUrl: storeMainContentDetailUrl + '/' + ownerAuth
        });
    });
});

/**
 * 게시물 글 작성
 */

router.get(storeMainContentDetailUrl + '/:owner_auth/:number', function (req, res) {
    console.log('1, contentDetail');
    const ownerAuth = req.params.owner_auth;
    const sql = ` SELECT content_list.*, owner.*
                FROM content_list
                JOIN owner
                ON content_list.owner_auth=owner.owner_auth
                WHERE content_list.owner_auth=` + mysql.escape(ownerAuth) + ` AND content_list.number=` + mysql.escape(req.params.number);
    connection.query(sql, function (err, results) {
        // console.log(results);
        res.render(storeMainContentDetailView, {
            isOwner: isOwner,
            contents: results[0]
        });
    });
});

/**
 * 게시물 사진 업로드
 */

router.get(storeMainContentUploadUrl + '/:owner_auth', function (req, res) {
    console.log('1, contentUpload');
    const ownerAuth = req.params.owner_auth;
    res.render(storeMainContentUploadView, {
        storeMainUrl: storeMainUrl,
        uploadUrl: uploadUrl + '/' + ownerAuth,
        storeMainUrl: storeMainUrl + '/' + ownerAuth
    });
});

/**
 * 팔로워 수
 */

router.get(storeMainFollowerUrl + '/:owner_auth', function (req, res) {
    console.log('1, follow');
    const ownerAuth = req.params.owner_auth;
    const sql = 'SELECT * FROM follow WHERE owner_auth=';
    connection.query(sql + mysql.escape(ownerAuth), function (err, results) {
        // console.log(results);
        res.render(storeMainFollowerView, {
            storeMainUrl: storeMainUrl,
            contents: results
        });
    });
});

/**
 * 인스타 스토리 등록
 */

router.get(storeMainSaleUrl + '/:owner_auth', function (req, res) {
    console.log('1, sale');
    const ownerAuth = req.params.owner_auth;
    res.render(storeMainSaleView);
});

/**
 * 리뷰 리스트
 */

router.get(reviewListUrl + '/:owner_auth', function (req, res) {
    console.log('1, reviewList');
    const ownerAuth = req.params.owner_auth;
    console.log('1.1, ' + ownerAuth);
    var sql = 'SELECT store FROM owner WHERE owner_auth=' + mysql.escape(ownerAuth);
    connection.query(sql, function (err, results) {
        console.log(sql);
        console.log(results);
        console.log('2, review list before render');
        res.render(reviewListView, {
            storeMainUrl: storeMainUrl,
            logoutUrl: logoutUrl,
            owner_auth: ownerAuth,
            store: results[0].store,
            reviewListContainerUrl: reviewListContainerUrl + '/' + ownerAuth,
            isOwner: 0,
            writeReviewUrl: writeReviewUrl
        });
        console.log('3, review list after render');
    });
    console.log('4, review list after callback');
});

/**
 * 리뷰 글 보기
 */

router.get(reviewListContainerUrl + '/:owner_auth', function (req, res) {
    console.log('1, reviewContainer');
    const ownerAuth = req.params.owner_auth;
    console.log('1.1, reviewContainer/' + ownerAuth);
    var sql = `SELECT r2.*, u.user_id, u.name
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
            reviewDetailUrl: reviewDetailUrl + '/' + ownerAuth,
            contents: results
        });
    });
});

/**
 * 리뷰  수
 */

router.get(reviewDetailUrl + '/:owner_auth' + '/:number', function (req, res) {
    console.log('1, reviewDetail');
    const ownerAuth = req.params.owner_auth;
    const reviewNumber = req.params.number;
    console.log('1.1, review/detail/' + ownerAuth + '/' + reviewNumber);
    var sql = `SELECT r2.*, u.user_id, u.name
            FROM (
              SELECT r1.*, o.store
              FROM review AS r1
              JOIN owner AS o
              ON r1.owner_auth = o.owner_auth
              WHERE o.owner_auth=` + mysql.escape(ownerAuth) + `
            ) AS r2
              JOIN  user AS u
            ON r2.user_auth = u.user_auth`;
    var query = connection.query(sql, function (err, results) {
        if (err) throw err;
        // console.log(results);
        console.log('2, review detail before render');
        res.render(reviewDetailView, {
            storeMainUrl: storeMainUrl,
            logoutUrl: logoutUrl,
            contents: results[reviewNumber],
            isOwner: 0
        });
        console.log('3, review detail after render');
    });
    console.log('4, review detail after callback');
});

/**
 * 리뷰 작성
 */

router.get(writeReviewUrl + '/:owner_auth', function (req, res) {
    const ownerAuth = req.params.owner_auth;
    var sql = `SELECT store FROM owner WHERE owner_auth=` + mysql.escape(ownerAuth);
    connection.query(sql, function (err, results) {
        res.render(writeReviewView, {
            storeMainUrl: storeMainUrl,
            store: results[0].store,
            writeReviewPostUrl: writeReviewUrl + '/' + ownerAuth
        });
    });
});
router.post(writeReviewUrl + '/:owner_auth', function (req, res) {
    const ownerAuth = req.params.owner_auth;
    const userAuth = req.session.passport.user;
    var review = {
        owner_auth: ownerAuth,
        user_auth: userAuth,
        good: req.body.good,
        bad: req.body.bad,
        score: req.body.rating
    };
    var sql1 = `SELECT * FROM review WHERE owner_auth=` + mysql.escape(ownerAuth) + ` and user_auth=` + mysql.escape(userAuth);
    connection.query(sql1, function (err, results1) {
        //console.log('results1 : ', results1, typeof results1, !results1, results1=='');
        if (results1 == '') {
            var sql = `INSERT INTO review SET ?`;
        } else {
            var sql = `UPDATE review SET ? WHERE owner_auth=` + mysql.escape(ownerAuth) + ` and user_auth=` + mysql.escape(userAuth);
        }
        connection.query(sql, review, function (err, results2) {
            res.render(successView, {
                success: reviewListUrl + '/' + ownerAuth
            });
        });
    });
});
router.get(successUrl, function (req, res) {
    res.render(successView, {
        success: '/'
    });
});

/**
 * 사진 S3 업로드
 */

Upload = require('./s3upload/uploadservice')
router.post(userProfileImageUploadUrl, function (req, res) {
    console.log('1, upload');

    var tasks = [
        function (callback) {
            Upload.formidable(req, function (err, files, field) {
                callback(err, files);
            })
        }, function (files, callback) {
            Upload.s3(files, function (err, result) {
                callback(err, files);
                const userAuth = req.session.passport.user;
                var sql = `UPDATE user SET image_url=? WHERE user_auth=` + mysql.escape(userAuth);
                var params = result;
                connection.query(sql, [params.Location], function (err, rows) {
                    // console.log(rows);
                    if (err) {
                        console.log(err);
                    } else {
                        // console.log(rows);
                    }
                });
            });
        }
    ]
    // 업로드 시 mainUserInfo로 redirect
    async.waterfall(tasks, function (err, result) {
        if (!err) {
            res.redirect(mainUserInfoUrl);
        } else {
            res.redirect(mainUserInfoUrl);
        }
    });
});

/**
 * 서버 연결
 */

router.listen(80, function () {
    console.log('connect 80 port user server');
});
