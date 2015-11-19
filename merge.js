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

var war = [];
var files = fs.readdirSync(dir);
files.forEach(function(item) {
  var voteDay = item.replace(/-\d+\.json/, "");
  try{
    var dataJson = require(path.join(dir,item));
    var data = dataJson.data;
    for(var k in data)
      data[k].forEach(function(role, index)
      {
        var info = {};
        info.time = item.replace(/.*-(\d+).json/,"$1");
        info.count = role.votes_count;
        var r_data = war.find(function(e){ return e.id==role.id;});
        if(r_data == undefined){
          war.push({
            id: role.id,
            name: role.name,
            bangumi: role.bangumi,
            date:voteDay,
            sex: role.sex,
            data:[info]
          });
        }
        else r_data.data.push(info);
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

fs.writeFileSync(path.join("public","data.json"),JSON.stringify(war)); 