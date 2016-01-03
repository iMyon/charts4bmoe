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

var bmoePath = "../";
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

//休息日
var yasumiDate = ["15-12-06","15-12-11","15-12-26"];

var roleLinks = require("./public/info/roleLinks.json");
var cvInfo = require("./public/info/cv.json");
var bangumiLinks = require("./public/info/bangumiLinks.json");
var failList = require("./public/failList.json");

app.get('/', function(req, res){
  var bangumis = [];
  var dataJson = require("./public/data.json");
  var notice;
  try{
    notice = require("./public/notice.json");
  }
  catch(e){
    console.log(e);
  }
  dataJson.forEach(function(role){
    if(bangumis.indexOf(role.bangumi) == -1)
      bangumis.push(role.bangumi);
  });
  var dates = [];
  var i=0;
  while(true){
    //2016-1-3结束日期
    var d = new Date(new Date(2016, 0, 3)-24*60*60*1000*i++);
    var bday = (""+d.getFullYear()).slice(2)+"-"+prefixZero(2, d.getMonth()+1)+"-"+prefixZero(2, d.getDate());
    if(yasumiDate.indexOf(bday) != -1) continue;
    if(bday>="15-10-31") dates.push(bday);
    else break;
  }
  res.render('index', {
    title:"b萌战况曲线",
    dates:dates,
    notice:notice,
    bangumis:bangumis
  });
});
/*
得票数据原始文件列表
*/
app.get('/data/', function(req, res){
  var files = fs.readdirSync(dataPath);
  res.render('data', {
    title: "数据备份",
    files:files
  });
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
/**
 * 根据参数返回角色得票数据，api参数列表如下：
 * @param  {string} date      日期
 * @param  {string} name      角色名称
 * @param  {string} bangumi   动画名称
 * @param  {string} stage     比赛阶段 1:海选 2:复活 3:128强 4:32强 5:16强 6：8强 7:半决赛 8：三四位半决赛 9:决赛
 * @param  {string} sex       性别，0女1男
 * @param  {string} format    格式，默认json，table为使用网页表格显示
 * @param  {string} id        b站标识id
 */
app.get('/api/data/role', function(req, res){
  var datas = require("./public/data.json", 'utf-8');
  //根据参数筛选
  datas = datas.filter(function(w) {
    if(req.query.date == "today") req.query.date = getToday();
    for(var key in req.query){
      if(w[key] !== undefined && w[key] != req.query[key]) return false;
    }
    return true;
  });
  //排序
  datas = datas.sort(function (a, b) {
    return a.group > b.group ? 1 : -1;
  });
  //使用表格视图渲染数据
  if(req.query.format == "table"){
    res.render("role",{
      datas: datas,
      title: "角色得票数据表格"
    });
  }
  else{
    var resStr = JSON.stringify(datas);
    res = setResJson(res,resStr);
    res.send(resStr);
  }
});

/**
 * 根据参数返回票仓数据，api参数列表如下：
 * @param  {string} date      日期
 * @param  {string} format    格式，默认json，table为使用网页表格显示
 */
app.get('/api/data/ballot', function(req, res){
  var datas = require("./public/ballot.json", 'utf-8');
  //根据参数筛选
  datas = datas.filter(function(w) {
    if(req.query.date == "today") req.query.date = getToday();
    for(var key in req.query){
      if(w[key] !== undefined && w[key] != req.query[key]) return false;
    }
    return true;
  });

  //使用表格视图渲染数据
  if(req.query.format == "table"){
    res.render("ballot",{
      datas: datas,
      title: "票仓数据表格"
    });
  }
  //json
  else{
    var resStr = JSON.stringify(datas);
    res = setResJson(res,resStr);
    res.send(resStr);
  }
  
});
/**
 * 排名数据，api参数列表如下：
 * @param  {string} date      日期
 * @param  {string} sex       性别
 * @param  {string} bangumi   动画
 * @param  {string} rank      名次
 * @param  {string} stage     比赛阶段 1:海选 2:复活 3:128强 4:32强 5:16强 6：8强 7:半决赛 8：三四位半决赛 9:决赛
 * @param  {string} id        角色id
 * @param  {string} name      角色名
 * @param  {string} stat      晋级情况：1晋级 2复活 3 淘汰
 * @param  {string} format    格式，默认json，table为使用网页表格显示
 */
app.get('/api/data/rank', function(req, res){
  var rankData = require("./public/rankData.json", 'utf-8');
  //根据参数筛选
  rankData = rankData.filter(function(w) {
    for(var key in req.query){
      if(w[key] !== undefined && w[key] != req.query[key]) return false;
    }
    return true;
  });

  //使用表格视图渲染数据
  if(req.query.format == "table"){
    var datas = {};
    datas.rankData = rankData;
    datas.cvInfo = cvInfo;
    datas.roleLinks = roleLinks;
    datas.failList = failList;
    datas.bangumiLinks = bangumiLinks;
    res.render("rank",{
      datas: datas,
      title: "角色数据表格"
    });
  }
  //json
  else{
    var resStr = JSON.stringify(rankData);
    res = setResJson(res,resStr);
    res.send(resStr);
  }
  
});
/**
 * 阵营数据api，api参数列表如下：
 * @param  {string} bangumi   动画
 * @param  {string} format    格式，默认json，table为使用网页表格显示
 */
app.get('/api/data/camp', function(req, res){
  var datas = require("./public/camp.json", 'utf-8');
  //根据参数筛选
  datas = datas.filter(function(w) {
    for(var key in req.query){
      if(w[key] !== undefined && w[key] != req.query[key]) return false;
    }
    return true;
  });

  //使用表格视图渲染数据
  if(req.query.format == "table"){
    res.render("camp",{
      datas: datas,
      title: "阵营表格"
    });
  }
  //json
  else{
    var resStr = JSON.stringify(datas);
    res = setResJson(res,resStr);
    res.send(resStr);
  }
  
});

/**
 * 前置补全0
 * @param  {int}    num 数值位数
 * @param  {int}    val 数值
 * @return {string}     补全后的字符串
 */
function prefixZero(num, val) {
  return (new Array(num).join('0') + val).slice(-num);
}

/**
 * 设置response为json格式
 * @param  {string} res  response对象
 * @return {object}      response对象
 */ 
function setResJson(res, resStr){
  res.header( 'content-type', 'application/json;charset=utf-8');
  // res.header( 'Transfer-Encoding', 'gzip');
  res.header( 'Access-Control-Allow-Origin', '*');
  res.header( 'content-length', Buffer.byteLength(resStr, "utf-8"));
  return res;
}

/**
 *获取今天的字符串 
**/
function getToday(){
  var d = new Date();
  return (""+d.getFullYear()).slice(2)+
  "-"+prefixZero(2, d.getMonth()+1)+
  "-"+prefixZero(2, d.getDate());
}

var server = app.listen(2333, function() {
    console.log('Listening on port %d', server.address().port);
});