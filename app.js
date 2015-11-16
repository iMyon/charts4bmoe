var express = require("express");
var swig = require("swig");
var fs = require("fs");
var path = require("path");

var app = express();

var bmoePath = "/home/Myon/bmoe/";
var dataPath = path.join(bmoePath, "data");
var voteDataPath = path.join(bmoePath, "voteData");

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

//静态文件目录
app.use('/public', express.static(__dirname+'/public'));
app.use('/', express.static(__dirname+'/static'));
app.use('/data', express.static(dataPath)); 
app.use('/voteData', express.static(voteDataPath)); 


app.get('/', function(req, res){
  var bangumis = [];
  var dataJson = require("./public/data.json");
  dataJson.forEach(function(role){
    if(bangumis.indexOf(role.bangumi) == -1)
      bangumis.push(role.bangumi);
  });
  var dates = [];
  var today = (""+new Date().getFullYear()).slice(2)+"-"+prefixZero(2, new Date().getMonth()+1)+"-"+prefixZero(2, new Date().getDate());
  dates.push(today);
  var i=1;
  while(true){
    var d = new Date(new Date()-24*60*60*1000*i++);
    var bday = (""+d.getFullYear()).slice(2)+"-"+prefixZero(2, d.getMonth()+1)+"-"+prefixZero(2, d.getDate());
    if(bday>="15-10-31") dates.push(bday);
    else break;
  }
  res.render('index', {
  	title:"b萌战况曲线",
    dates:dates,
    bangumis:bangumis,
    dataSize: ~~(fs.statSync('./public/data.json').size/1024) + "kb"
  });
});
app.get('/data/', function(req, res){
  var files = fs.readdirSync(dataPath);
  res.render('data', {
    title: "数据备份",
    files:files
  });
});
/**
 * 根据日期返回json数据
 * @param  {string} date			日期
 */
app.get('/api/data', function(req, res){
	var war = require("./public/data.json", 'utf-8');
	war = war.filter(function(w) {
		return w.date == req.query.date;
	});
	var resStr = JSON.stringify(war);
	res.header( 'content-type', 'application/json;charset=utf-8');
	res.header( 'content-length', Buffer.byteLength(resStr, "utf-8"));
	res.send(resStr);
});
/*
投票数据文件列表
 */
app.get('/voteData/', function(req, res){
  var files = fs.readdirSync(voteDataPath);
  res.render('data', {
    title: "数据备份",
    files:files
  });
});

var server = app.listen(2333, function() {
    console.log('Listening on port %d', server.address().port);
});

//前置补全0
function prefixZero(num, val) {
  return (new Array(num).join('0') + val).slice(-num);
}