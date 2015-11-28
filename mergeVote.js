/**
 * 合并定时任务获取的票仓数据
 */
var fs = require("fs");
var path = require("path");

var dir = "../voteData/";

var files = fs.readdirSync(dir);
var voteDatas = [];

files.forEach(function(item) {
  //16 17号这两天只发了8000
  var specialDay = [
  {date: "15-11-16",count: 8000},
  {date: "15-11-17",count: 8000},
  {date: "15-11-22",count: 12000},
  {date: "15-11-25",count: 12000},
  {date: "15-11-26",count: 9000},
  {date: "15-11-27",count: 9000},
  {date: "15-11-28",count: 12000},
  {date: "15-11-29",count: 15000},
  {date: "15-11-18",count: 8000}
  ];
  var sumVote = 10000;  //初始一万票
  var hourTime = -1;    //时间的小时位
  var voteDay = item.replace(".json", "");
  specialDay.forEach(function(d){ //特殊处理
    if (d.date == voteDay)  sumVote = d.count;
  });
  try{
    var datas = fs.readFileSync(path.join(dir,item), 'utf-8');
    var datasLines = datas.split('\n');
    var voteAddStash = [];      //票仓
    var voteAddStashIndex = 0;  //票仓下标
    var time_flag;              //最后一次领票时间标识
    datasLines.forEach(function(datasLine){
      var matches = datasLine.match(/^(\d+-\d+-\d+)-(\d+:\d+)\s+({.*})$/);
      if(matches){
        var day = matches[1];
        var time = matches[2];
        var time_h = ~~time.replace(/:\d+/,"");
        var jsonstr = matches[3];
        var json = JSON.parse(jsonstr);

        if(json.state == 200){
          var token;  //当前总共领取票数
          var data = json.data;
          //初始化0点数据
          if(time == "00:00"){
            data = [{},{}];
            token = 0;
          }
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
            {//当前等于发票时间
              token = sumVote-~~data[0].total;
              sumVote+=~~voteAddStash[voteAddStashIndex].voteCount;
              voteAddStashIndex++;
            }
          }
          if(hourTime < time_h){   //过一小时统计一次
            hourTime = time_h;
            voteDatas.push({
              date: day,
              time: time,
              total: sumVote,
              token: token !== undefined?token:sumVote-~~data[0].total
            });
          }
        }
      }
    });
  }catch(e){
    console.log(e);
  }
});

fs.writeFileSync(path.join("public/voteData.json"),JSON.stringify(voteDatas));
