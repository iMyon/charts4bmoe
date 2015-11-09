var express = require("express");
var swig = require("swig");
var fs = require("fs");

var app = express();


app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

//静态文件目录
app.use('/public', express.static(__dirname+'/public'));
app.use('/data', express.static("/home/Myon/bmoe/data")); 


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
  var files = fs.readdirSync("/home/Myon/bmoe/data/");
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