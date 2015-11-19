var express = require("express");
var swig = require("swig");
var fs = require("fs");
var path = require("path");
var bodyParser = require('body-parser');

var app = express();

//请求响应压缩 （这个中间件导致获取不到content-length）
var compress = require('compression');
app.use(compress());
app.use(bodyParser.json());
app.disable('x-powered-by');

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
    bangumis:bangumis
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
 * 根据参数返回角色得票数据，api参数列表如下：
 * @param  {string} date      日期
 * @param  {string} name      角色名称
 * @param  {string} bangumi   动画名称
 * @param  {string} sex       性别，0女1男
 * @param  {string} format    格式，默认json，table为使用网页表格显示
 * @param  {string} id        b站标识id
 */
app.get('/api/data/role', function(req, res){
  var war = require("./public/data.json", 'utf-8');
  //根据参数筛选
  war = war.filter(function(w) {
    for(var key in req.query){
      if(w[key] != undefined && w[key] != req.query[key]) return false;
    }
    return true;
  });
  //使用表格视图渲染数据
  if(req.query.format == "table"){
    res.render("role",{
      roles: war
    });
  }
  else{
    var resStr = JSON.stringify(war);
    res.header( 'content-type', 'application/json;charset=utf-8');
    // res.header( 'Transfer-Encoding', 'gzip');
    res.header( 'Access-Control-Allow-Origin', '*');  //允许跨域请求
    res.header( 'content-length', Buffer.byteLength(resStr, "utf-8"));
    res.send(resStr);
  }
  
});

/**
 * 根据参数返回票仓数据，api参数列表如下：
 * @param  {string} date      日期
 * @param  {string} format    格式，默认json，table为使用网页表格显示
 */
app.get('/api/data/ballot', function(req, res){
  var ballots = require("./public/voteData.json", 'utf-8');
  //根据参数筛选
  ballots = ballots.filter(function(w) {
    for(var key in req.query){
      if(w[key] != undefined && w[key] != req.query[key]) return false;
    }
    return true;
  });

  //使用表格视图渲染数据
  if(req.query.format == "table"){
    res.render("ballot",{
      ballots: ballots
    });
  }
  //json
  else{
    var resStr = JSON.stringify(ballots);
    res.header( 'content-type', 'application/json;charset=utf-8');
    // res.header( 'Transfer-Encoding', 'gzip');
    res.header( 'Access-Control-Allow-Origin', '*');
    res.header( 'content-length', Buffer.byteLength(resStr, "utf-8"));
    res.send(resStr);
  }
  
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