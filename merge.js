/**
合并数据
**/
require('array.prototype.find');
var fs = require("fs");
var path = require("path");

var dir = "/home/Myon/bmoe/data/";

var war = [];
var files = fs.readdirSync(dir);
files.forEach(function(item) {
  var voteDay = item.replace(/-\d+\.json/, "");
  try{
    var dataJson = require(path.join(dir,item));
    var data = dataJson.data;
    for(var k in data)
      data[k].forEach(function(role)
      {
        var info = {};
        info.v_count = role.votes_count;
        info.v_time = item.replace(/.*-(\d+).json/,"$1");
        info.sex = role.sex;
        var r_data = war.find(function(e){ return e.id==role.id;});
        if(r_data == undefined){
          war.push({
            id: role.id,
            name: role.name,
            bangumi: role.bangumi,
            v_day:voteDay,
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
  var maxCount1 = ~~a.data[a.data.length-1].v_count;
  var maxCount2 = ~~b.data[b.data.length-1].v_count;
  return maxCount2-maxCount1;
});

fs.writeFileSync(path.join("/home/Myon/bmoe/chart/public","data.json"),JSON.stringify(war)); 