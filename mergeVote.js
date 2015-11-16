//合并投票数据
var fs = require("fs");
var path = require("path");

var dir = "/home/Myon/bmoe/voteData/";

var files = fs.readdirSync(dir);
var voteDatas = [];

files.forEach(function(item) {
  var sumVote = 10000; //初始一万票
  var hourTime = -1;  //时间的小时位
  var voteDay = item.replace(".json", "");
  try{
    var datas = fs.readFileSync(path.join(dir,item), 'utf-8');
    var datasLines = datas.split('\n');
    var voteAddStash = [];      //票仓
    var voteAddStashIndex = 0; //票仓下标
    var time_flag;						//最后一次领票时间标识
    datasLines.forEach(function(datasLine){
      var matches = datasLine.match(/^(\d+-\d+-\d+)-(\d+:\d+)\s+({.*})$/);
      if(matches){
        var day = matches[1];
        var time = matches[2];
        var time_h = time.replace(/:\d+/,"");
        var jsonstr = matches[3];
        var json = JSON.parse(jsonstr);

        if(json.state == 200){//票仓增加
          var token;  //当前总共领取票数
          var data = json.data;
          if(data[1].time != time_flag){ //领票时间发生变化
            time_flag = data[1].time;
            voteAddStash.push({
              time: time,
              voteRefreshTime: data[1].time,
              voteCount:data[1].number
            });

            var vrt = voteAddStash[voteAddStashIndex].voteRefreshTime;
            if(vrt && time > vrt.match(/\d+-\d+-\d+\s+(\d+:\d+):/)[1])
            {//当前时间超过发票时间
              sumVote+=~~voteAddStash[voteAddStashIndex].voteCount; 
              voteAddStashIndex++;
            }
            if(vrt && time == vrt.match(/\d+-\d+-\d+\s+(\d+:\d+):/)[1])
            {//当前等于超过发票时间
              token = sumVote-~~data[0].total;
              sumVote+=~~voteAddStash[voteAddStashIndex].voteCount; 
              voteAddStashIndex++;
            }
          }
          if(hourTime < time_h){   //过一小时统计一次
            hourTime = time_h;
            var data = json.data;
            voteDatas.push({
              date: day,
              time: time,
              total: sumVote,
              token: token?token:sumVote-~~data[0].total
            });
          }
        }
      }
    });
  }catch(e){
    console.log(e);
  }
});

fs.writeFileSync(path.join("/home/Myon/bmoe/chart/public/voteData.json"),JSON.stringify(voteDatas));