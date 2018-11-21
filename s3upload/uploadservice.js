var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '111111',
  database : 'o2'
});

var formidable = require('formidable'),
    AWS = require('aws-sdk'),
    Upload = {};
AWS.config.region = 'ap-northeast-2'; //지역 서울 설정
var s3 = new AWS.S3();
var form = new formidable.IncomingForm({
    encoding: 'utf-8',
    multiples: true,
    keepExtensions: false //확장자 제거
});

//s3버킷설정
var params = {
    Bucket: 'nodeeverybody',
    Key: null,
    ACL: 'public-read',
    Body: null
};



//업로드 로직
 Upload.formidable = function (req, callback) {
    form.parse(req, function (err, fields, files) {
    });
    form.on('error', function (err) {
        callback(err, null);
    });
    form.on('end', function () {
        callback(null, this.openedFiles);
    });
    form.on('aborted', function () {
        callback('form.on(aborted)', null);
    });
};
Upload.s3 = function (files, callback) {
    params.Key = 'test/'+files[0].name;
    params.Body = require('fs').createReadStream(files[0].path);
    s3.upload(params, function (err, result) {
        callback(err, result);

/*connection.connect(function(err){
if(!err) {
    console.log("Database is connected ... \n\n");
} else {
    console.log("Error connecting database ... \n\n");
}
});
var sql='insert into content_list (owner_id, url) values ("hyk1031",?)';
var params=result;

connection.query(sql,params.Location,function(err, rows, fields) {
if(err){
console.log(err);
}else{
console.log(rows);}
});*/
    });
};
module.exports=Upload;

