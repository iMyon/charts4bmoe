/**
合并定时任务获取的角色得票数据
**/

/*阵营归类 用于合并*/
var AnimateGroup = [
  ["Fate/stay night [UBW]", "Fate stay night [UBW]", "Fate/stay night [UBW]"],
  ["天麻 阿知贺篇SP&咲日和", "天才麻将少女 阿知贺篇SP", "咲日和"]
];

require('array.prototype.find');
var fs = require("fs");
var path = require("path");

var dir = "../data/";

var war = [];             //角色数据
var totalVote = [];       //总票数数据
var rankData = [];        //统计名次
var campInfo= [];         //阵营统计
var bangumis = [];        //阵营列表
var failList = {};        //角色淘汰列表，hashmap形式

var files = fs.readdirSync(dir);
files.forEach(function(item) {
  var voteDay = item.replace(/-\d+\.json/, "");
  var maleCount = 0;
  var femaleCount = 0;
  var time = item.replace(/.*-(\d+).json/,"$1");
  try{
    var dataJson = require(path.join(dir,item));
    var data = dataJson.data;
    var doMerge = function(role, index)
    {
      //添加阶段标识
      if(voteDay<="15-12-06") role.stage = 1;       //海选
      else if(voteDay<="15-12-11") role.stage = 2;  //复活
      else if(voteDay<="15-12-19") role.stage = 3;  //128强
      else if(voteDay<="15-12-23") role.stage = 4;  //32强
      else if(voteDay<="15-12-26") role.stage = 5;  //16强
      else if(voteDay<="15-12-30") role.stage = 6;  //8强
      else if(voteDay<="16-01-01") role.stage = 7;  //半决赛
      else if(voteDay<="16-01-02") role.stage = 8;  //三四名决赛
      else role.stage = 9;                          //决赛
      //23点加入名次统计
      if(time == 23){
        var riseRank, recoveryRank;
        switch(role.stage){
          case 1: riseRank = 3;recoveryRank=6;break;
          case 2: riseRank = 5;recoveryRank=5;break;
          case 3: riseRank = 1;recoveryRank=1;break;
          case 4: riseRank = 1;recoveryRank=1;break;
          case 5: riseRank = 1;recoveryRank=1;break;
          case 6: riseRank = 1;recoveryRank=1;break;
          case 7: riseRank = 1;recoveryRank=1;break;
          case 8: riseRank = 1;recoveryRank=1;break;
          case 9: riseRank = 1;recoveryRank=1;break;
        }
        var r = {
          id: role.id,
          name: role.name,
          bangumi: role.bangumi,
          date: voteDay,
          stage: role.stage,
          sex: role.sex,
          count: role.votes_count,
          rank: index+1
        };
        //晋级
        if(r.rank<=riseRank) r.stat = 1;
        //复活
        else if(r.rank <=recoveryRank) r.stat = 2;
        //淘汰
        else r.stat = 3;
        if(r.stage == 1) rankData.push(r);    //添加排名
        if(r.stat == 3) failList[[r.name, r.bangumi].join(" @")] = true;
        //添加阵营
        var bgm = role.bangumi;
        for(var i in AnimateGroup){
          if(AnimateGroup[i].indexOf(bgm) != -1){
            bgm = AnimateGroup[i][0];
            break;
          }
        }
        if(bangumis.indexOf(bgm) == -1)
          bangumis.push(bgm);
      }
      if(~~role.sex === 0) femaleCount+=~~role.votes_count;
      else  maleCount+=~~role.votes_count;
      var info = {};
      info.time = time;
      info.count = role.votes_count;
      var r_data = war.find(function(e){ return e.id==role.id;});
      if(r_data === undefined){
        war.push({
          id: role.id,
          name: role.name,
          bangumi: role.bangumi,
          date:voteDay,
          stage: role.stage,
          sex: role.sex,
          data:[info]
        });
      }
      else r_data.data.push(info);
    };
    for(var k in data){
      data[k].forEach(doMerge);
    }
    totalVote.push({
      date: voteDay,
      time: time,
      sex: 1,
      count: maleCount
    });
    totalVote.push({
      date: voteDay,
      time: time,
      sex: 0,
      count: femaleCount
    });
  }catch(e){
    console.log(e);
  }
});

war = war.sort(function(a, b){
  var maxCount1 = ~~a.data[a.data.length-1].count;
  var maxCount2 = ~~b.data[b.data.length-1].count;
  return maxCount2-maxCount1;
});

//阵营合并
war.forEach(function(w, index){
  for(var i in AnimateGroup){
    if(AnimateGroup[i].indexOf(w.bangumi) != -1){
      war[index].bangumi = AnimateGroup[i][0];
      break;
    }
  }
}); 
rankData.forEach(function(w, index){
  for(var i in AnimateGroup){
    if(AnimateGroup[i].indexOf(w.bangumi) != -1){
      rankData[index].bangumi = AnimateGroup[i][0];
      break;
    }
  }
});
rankData = rankData.sort(function(a, b){
  return  b.count - a.count || a.rank-b.rank;
});
//统计阵营
bangumis.forEach(function(bgm){
  var suc = rankData.filter(function(rd){
    return rd.bangumi == bgm && rd.rank<=3;
  }).length;
  var wait = rankData.filter(function(rd){
    return rd.bangumi == bgm && rd.rank>3 && rd.rank<=6;
  }).length;
  var fail = rankData.filter(function(rd){
    return rd.bangumi == bgm && rd.rank>6;
  }).length;
  var total = suc + wait + fail;
  campInfo.push({
    bangumi: bgm,
    total: total,
    suc: suc,
    wait: wait,
    fail: fail
  });
});
campInfo = campInfo.sort(function(a, b){
  return  b.suc/b.total - a.suc/a.total || b.wait/b.total-a.wait/a.total || a.total-b.total;
});

fs.writeFileSync(path.join("public","camp.json"),JSON.stringify(campInfo)); 
fs.writeFileSync(path.join("public","data.json"),JSON.stringify(war)); 
fs.writeFileSync(path.join("public","rankData.json"),JSON.stringify(rankData)); 
fs.writeFileSync(path.join("public","totalVote.json"),JSON.stringify(totalVote)); 
fs.writeFileSync(path.join("public","failList.json"),JSON.stringify(failList)); 