// 引入百度echarts支持
require.config({
  paths: {
    echarts: 'http://echarts.baidu.com/build/dist'
  }
});

var war;                  //比赛数据（json获取
var voteData;             //投票数据（json获取
var requestDatas = [];    //保存每次请求数据避免重复请求
//b萌事件
var Events = [
{
  day: "15-11-14",
  time: "16",
  name: "b站炸了",
  desc: "b站炸了"
},
{
  day: "15-11-06",
  time: "21",
  name: "私信推送",
  desc: "私信推送，一大波散票袭来"
},
{
  day: "15-11-16",
  time: "20",
  name: "保鸭战争",
  desc: "鸭子被影姐首次超过，战吧愤慨，不择手段拉票"
},
{
  day: "15-11-17",
  time: "22",
  name: "黄前久美子票数之谜",
  desc: "由于战吧拉票+未知厨团影响，久美子打出目前最强海底"
},
{
  day: "15-11-22",
  time: "14",
  name: "终物语播放效应",
  desc: "评论+承包拉票"
}
];

/**
 * 根据筛选条件获取数据
 * 
 * @param  {object} war				人物原数据
 * @param  {object} condition 筛选条件，例{bangumi:"咲日和","sex":0}
 * @param  {string} chartType 图表类型：0总票数 1每小时票数 2每小时票率 3 总票率
 * @return {object} 返回echarts图形数据
 *
 * condition参数列表：
 * bangumi		动画名称
 * sex				性别0女1男
 * id					角色id
 */
function getDataByCondition(war, condition,chartType){
  var AllCharDatas;
  var v_times = ["00:00","01:00","02:00","03:00","04:00","05:00","06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"];
  var _dates = dates;
  //如果参数中有日期，则按照参数中的筛选
  if(condition.day) _dates = condition.day.split(",");
  for(var i=0; i<_dates.length;i++){
    var tdata = getChartData(war, _dates[i], "any");
    tdata.series.forEach(function(sery,index){
      for(var i=0,j=0;i<v_times.length;i++){
        if(tdata.v_times[j] != v_times[i]){
          tdata.series[index].data.splice(i, 0, undefined);
        }
        else j++;
      }
    });
    tdata.v_times = v_times;
    if(chartType == 1) tdata = getGradChartData(tdata);
    else if(chartType == 2) tdata = getRatePerHChartData(tdata);
    else if(chartType == 3) tdata = getTotalRateChart(tdata);
    if(AllCharDatas == undefined){  //初始化首次数据
      AllCharDatas = tdata;
    }
    else AllCharDatas.series = AllCharDatas.series.concat(tdata.series);
  }
  if(condition.bangumi) AllCharDatas.subtext = condition.bangumi;
  // if(condition.day) AllCharDatas.subtext = condition.day;
  if(condition.sex) AllCharDatas.subtext = AllCharDatas.subtext+" | "+ (condition.sex==1?"男子组":condition.sex==0?"女子组":"男女");
  condition.day = undefined;//重置day，以便后面筛选
  AllCharDatas.series = AllCharDatas.series.filter(function(e) {
    for(var key in condition){
      if(condition[key] == "any") continue;
      if(condition[key] != e.filterCondition[key]) return false;
    }
    return true;
  });
  return AllCharDatas;
}

/**
 * 获取指定列表的人物数据
 * 
 * @param  {object} war				人物原数据
 * @param  {Array} 	ids		 		角色id数组
 * @param  {string} chartType 图表类型：0总票数 1每小时票数 2每小时票率 3 总票率
 * @return {object} 返回echarts图形数据
 *
 */
function getDataByIds(war, ids, chartType){
	var datas;
	ids.forEach(function(id){
		if(datas == undefined) datas = getDataByCondition(war, {id: id}, chartType);
		else datas.series = datas.series.concat(getDataByCondition(war, {id: id}, chartType).series);
	});
	var roles = [];
	datas.series.forEach(function(sery){
		roles.push(sery.name);
	});
	datas.subtext = roles.join("、");
	return datas;
}

/**
 * 根据日期和性别得到当前时间人物获得的总票数曲线图信息
 * 
 * @param  {object} war 萌战比赛json原始数据
 * @param  {string} day 比赛日期，逗号分隔
 * @param  {string} sex 性别：0女 1男 any任意
 * @return {object} echarts总票数图形数据
 * 
 */
function getChartData(war, day, sex){
  var days = day.split(",");
  if(days.length>1) return getDataByCondition(war, {bangumi: "any", sex: sex, day:day}, $("#sel-chart").val());
  var dayData = war.filter(function(e) {
    return (e.date==day) && (sex==e.sex || sex=="any" );
  });
  var chartData = {};
  chartData.text = "总票数折线图";
  chartData.subtext = day+" | "+ (sex==1?"男子组":sex==0?"女子组":"男女");
  chartData.formatter = '{value} 票';
  chartData.v_times = [];
  chartData.series = [];
  chartData.tooltip_formatter = function (params,ticket,callback) {
    var res = params[0].name + ' 总共获得票数: ';
    params.sort(function(a,b){
      return ~~b.value > ~~a.value || -1;
    });
    for (var i = 0, l = params.length; i < l; i++) {
      res += '<br/>' + (i+1) + "." + params[i].seriesName + ' : ' + params[i].value;
    }
    return res;
  };
  if(dayData){
    if(dayData[0].data[0].time!="00") chartData.v_times.push("00:00");
    for(var i=0;i<dayData[0].data.length;i++){
      chartData.v_times.push(dayData[0].data[i].time+":00")
    }
    for(var i=0;i<dayData.length;i++){
      var sery = {};
      sery.filterCondition = {
        id: dayData[i].id,
        sex: dayData[i].sex,
        bangumi: dayData[i].bangumi
      }
      sery.name = dayData[i].name;
      sery.type = "line";
      // sery.symbol = "none"; //取消点显示
      sery.data = [];
      sery.itemStyle = {
        emphasis : {
          label : {show: true}
        }
      };
      if(dayData[0].data[0].time!="00")  sery.data.push(0);
      for(var j=0;j<dayData[i].data.length;j++){
        sery.data.push(dayData[i].data[j].count);
        //添加事件
/*        Events.forEach(function(e){
          if(e.day == dayData[i].date && e.time == dayData[i].data[j].time){
            if(!sery.markLine) {
              sery.markLine = {
                data:[
                  [
                    {name: '', value:e.desc, xAxis: chartData.v_times[j], yAxis: 0},
                    {name: '', value:e.desc, xAxis: chartData.v_times[j], yAxis: 999999999999}
                  ]
                ],
                itemStyle:{
                  normal:{
                    label:{
                      formatter: e.desc
                    }
                  }
                }
              }
            }
            else{
              sery.markLine.data.push([
                {name: '', value:e.desc, xAxis: chartData.v_times[j], yAxis: 0},
                {name: '', value:e.desc, xAxis: chartData.v_times[j], yAxis: 999999999999}
              ]);
            };
          }
        });*/
      }
      chartData.series.push(sery);
    }
  }
  return chartData;
}

/**
 * 根据总票数获取每小时得票数
 * 
 * @param  {object} chartData echarts的总票数图形数据
 * @return {object} 返回echarts图形数据
 * 
 */
function getGradChartData(chartData){
  chartData.tooltip_formatter = function (params,ticket,callback) {
    var res = '时间段得票数: <br/>' + params[0].name;
    params.sort(function(a,b){
      return ~~b.value > ~~a.value || -1;
    });
    for (var i = 0, l = params.length; i < l; i++) {
      res += '<br/>' + (i+1) + "." + params[i].seriesName + ' : ' + params[i].value;
    }
    return res;
  };
  chartData.text = "每小时票数折线图";
  var gradchartData = chartData;
  var v_times = gradchartData.v_times;
  gradchartData.v_times = [];
  for(var i=0;i<v_times.length-1;i++)
      gradchartData.v_times.push((v_times[i+1]));
      // gradchartData.v_times.push((v_times[i]+"-"+v_times[i+1]).replace(/:\d+/g, ""));
  gradchartData.series.forEach(function(sery, index){
    var data = new Array();
    for(var i=0; i<sery.data.length-1; i++){
      if(sery.data[i+1] == undefined || sery.data[i] == undefined)
        data.push(undefined);
      else
        data.push(sery.data[i+1]-sery.data[i]);
    }
    gradchartData.series[index].data = data;
  });
  return gradchartData;
}

/**
 * 获取每小时得票率echarts数据
 * 
 * @param  {object} chartData echarts图形数据
 * @return {object} 每小时得票率echarts数据
 * 
 */
function getRatePerHChartData(chartData){
  //获取每小时票数数据
  var gradchartData = getGradChartData(chartData);
  //根据每小时票数数据计算每小时占比例
  var rateChartData = gradchartData = getRateChartData(gradchartData);
  rateChartData.text = "每小时得票率折线图";
  // rateChartData.subtext = rateChartData.subtext + " | 交点表示票数差距缩小";
  rateChartData.formatter = '{value}%';
  return rateChartData;
}

/**
 * 获取总得票率echarts数据
 * 
 * @param  {object} chartData echarts图形数据
 * @return {object} 总得票率echarts数据
 * 
 */
function getTotalRateChart(chartData){
  var totalRateChart = getRateChartData(chartData);
  totalRateChart.text = "总得票率折线图";
  var v_times = totalRateChart.v_times;
  totalRateChart.v_times = [];
  for(var i=0;i<v_times.length-1;i++)
    totalRateChart.v_times.push((v_times[i+1]));
    // totalRateChart.v_times.push((v_times[i]+"-"+v_times[i+1]).replace(/:00/g, ""));
  totalRateChart.series.forEach(function(sery, index){
    totalRateChart.series[index].data.shift();
  });
  return totalRateChart;
}

/**
 * 根据echarts数据求得同一时段数据占比
 * 
 * @param  {object} chartData echarts图形数据
 * @return {object} 数据占比echarts数据
 * 
 */
function getRateChartData(chartData){
  chartData.formatter = '{value}%';
  chartData.tooltip_formatter = function (params,ticket,callback) {
      var res = '时间段得票率: <br/>' + params[0].name;
      params.sort(function(a,b){
        return ~~b.value > ~~a.value || -1;
      });
      for (var i = 0, l = params.length; i < l; i++) {
        res += '<br/>' + (i+1) + "." + params[i].seriesName + ' : ' + params[i].value + " %";
      }
      return res;
  };
  var sums_boy = [];
  var sums_girl = [];
  var ratechartData = chartData;
  ratechartData.series.forEach(function(sery, index){
    for(var i=0; i<sery.data.length; i++){
      if(sery.filterCondition.sex == 0) sums_girl[i] = ~~sums_girl[i]+~~sery.data[i];  
      if(sery.filterCondition.sex == 1) sums_boy[i] = ~~sums_boy[i]+~~sery.data[i];  
    }
  });
  ratechartData.series.forEach(function(sery, index){
    var data = new Array();
    var sums = sery.filterCondition.sex==0?sums_girl:sums_boy;
    for(var i=0; i<sery.data.length; i++){ 
      if(sery.data[i] === undefined) data.push(undefined);
      else if(sums[i] == 0) data.push(0);
      else data.push( parseFloat(((~~sery.data[i]/sums[i]).toFixed(6)*100).toFixed(2)) ); 
    } 
    ratechartData.series[index].data = data;
    ratechartData.series[index].itemStyle.emphasis.label.formatter = "{c} %";
    ratechartData.series[index].markPoint={
      data : [
        {type : 'max', name: '最大值'},
        {type : 'average', name: '平均值'}
      ],
      itemStyle:{
        normal:{
          label:{
            formatter:"{c} %"
          }
        }
      }
    };
  });
  return ratechartData;
}

/**
 * 领票数曲线
 * 
 * @param  {object} voteData  领票数原始json数据
 * @param  {string} day       日期 
 * @return {object} echarts图形数据
 * 
 */
function getTicketChartData(voteData, day){
  // $.getJSON("public/voteData.json", function(data){
  //   voteData = data;
  // });
  var vDatas = voteData.filter(function(vData) {
    return vData.date == day;
  });
  var ticketChartData = {};
  ticketChartData.text = "领票总数折线图";
  ticketChartData.subtext = day + "日";
  ticketChartData.formatter = '{value} 票';
  ticketChartData.v_times = [];
  ticketChartData.series = [];

  var sery = {};
  sery.name = day;
  sery.type = "line";
  sery.data = [];
  sery.itemStyle = {
    emphasis : {
      label : {show: true}
    }
  };
  vDatas.forEach(function(vData){
    sery.data.push(vData.token);
  });
  ticketChartData.series.push(sery);
  ticketChartData.v_times = ["00:00","01:00","02:00","03:00","04:00","05:00","06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"];
  ticketChartData.tooltip_formatter = function (params,ticket,callback) {
    var res = params[0].name + ' 总共领取票数: ';
    params.sort(function(a,b){
      return ~~b.value > ~~a.value || -1;
    });
    for (var i = 0, l = params.length; i < l; i++) {
      res += '<br/>' + (i+1) + "." + params[i].seriesName + ' : ' + params[i].value;
    }
    return res;
  };
  return  ticketChartData;
}

/**
 * 绘制图形
 * 
 * @param  {object} chartData                        echarts图形数据
 * @param  {int}    [sliceStart=1]                   绘制数据的首元素坐标+1
 * @param  {int}    [sliceEnd=chartData.length-1]    绘制数据的末元素-2
 * 
 */
function draw(chartData, sliceStart, sliceEnd){
  //初始化开始坐标和结束坐标参数
  sliceStart = sliceStart?sliceStart-1:0;
  sliceEnd = sliceEnd?sliceEnd:12;
  sliceEnd = sliceEnd<chartData.series.length?sliceEnd:chartData.series.length;
  /*//删除空数据
  chartData.series = chartData.series.filter(function(sery){
    return !sery.data.join("") == "";
  });*/
  //按data最后一个元素降序排序
  chartData.series = chartData.series.sort(function(a,b){
    var data1 = a.data[a.data.length-1]?a.data[a.data.length-1]:0;
    var data2 = b.data[b.data.length-1]?b.data[b.data.length-1]:0;
    return data2-data1;
  });
  chartData.roles = [];
  chartData.series.forEach(function(sery){
    chartData.roles.push(sery.name);
  });
  //计算图形右侧线条说明的宽度
  var max = 0;
  for(var i=sliceStart;i<sliceEnd;i++)
    max = max>chartData.series[i].name.length?max:chartData.series[i].name.length;
  var x2 = 50+max*12;
  require(
    [
      'echarts',
      'echarts/chart/bar', 
      'echarts/chart/line', 
    ],
    function(ec) {
      // 基于准备好的dom，初始化echarts图表
      var myChart = ec.init(document.getElementById('main'));
      var option = {
        title: {
          text: chartData.text,
          subtext: chartData.subtext + " | " + (sliceStart+1) + "-" + sliceEnd + "位"
        },
        grid:{
          x2:x2
        },
        tooltip: {
          trigger: 'axis',
          formatter: chartData.tooltip_formatter
        },
        legend: {
          data: chartData.roles.slice(sliceStart, sliceEnd),
          x:"right",
          y:"center",
          orient:"vertical"
        },

        toolbox: {
          show: true,
          x: 'center',
          y: 'top',
          feature: {
            dataZoom : {
              show : true,
              title : {
                dataZoom : '区域缩放',
                dataZoomReset : '区域缩放-后退'
              }
            },
            magicType: {
              show: true,
              type: ['line', 'bar']
            },
            dataView : {
              show : true,
              title : '数据视图',
              readOnly: false,
              lang: ['数据视图', '关闭', '刷新']
            },
            mark : {
              show : true,
              title : {
                mark : '辅助线开关',
                markUndo : '删除辅助线',
                markClear : '清空辅助线'
              },
              lineStyle : {
                width : 2,
                color : '#1e90ff',
                type : 'dashed'
              }
            },
            restore: {
              show: true
            },
            saveAsImage: {
              show: true
            }
          }
        },
        calculable: true,
        xAxis: [{
          type: 'category',
          boundaryGap: false,
          data: chartData.v_times
        }],
        yAxis: [{
          type: 'value',
          axisLabel: {
            formatter: chartData.formatter
          }
        }],
        // dataZoom : {
        //   show : true,
        //   realtime : true
        // },
        series: chartData.series.slice(sliceStart, sliceEnd)
      };
      // 为echarts对象加载数据 
      myChart.setOption(option);
    }
  );
}

/**
 * 绘制图形按钮点击事件
 * 根据条件调用draw方法画图
 * @return none
 */
function startDraw(condition){
  if(condition.dob == 0){
    getWarData(condition, function(war){
      var chartData = getChartData(war, condition.date, condition.sex);
      if(condition.date.indexOf(",") == -1){
        if(condition.chart == 1) chartData = getGradChartData(chartData);
        else if(condition.chart == 2) chartData = getRatePerHChartData(chartData);
        else if(condition.chart == 3) chartData = getTotalRateChart(chartData);
      }
      draw(chartData, condition.sliceStart, condition.sliceEnd);
    });
  }
  else if(condition.dob == 1){
    getWarData(condition, function(war){
      draw(getDataByCondition(war, {
        bangumi: condition.bangumi,
        sex: condition.sex
      }, condition.chart), 1, 999999);
    });
  }
  else if(condition.dob == 2){
    if(["0","1"].indexOf(condition.chart) != -1){   //票仓只能画总票数和每小时票数折线图
      getVoteData(function(voteData){
        var chartData;
        if(condition.date.indexOf(",") != -1){
          //合并data
          condition.date.split(",").forEach(function(date){
            var d = getTicketChartData(voteData, date);
            if(chartData == undefined) chartData = d;
            else chartData.series = chartData.series.concat(d.series);
          });
        }
        else chartData = getTicketChartData(voteData, condition.date);
        if(condition.chart == 1) chartData = getGradChartData(chartData)
        else if(condition.chart == 2) chartData = getRatePerHChartData(chartData)
        else if(condition.chart == 3) chartData = getTotalRateChart(chartData)
        draw(chartData, 0, 99999);
      });
    }
    else alert("这个画不了");
  }
}

/**
 * 获取投票json
 * 
 * @param  {Function} callback  获取json后的回调函数
 * @return none
 * 
 */
function getVoteData(callback){
  //先取全局变量，否则ajax请求
  if(voteData) callback(voteData);
  else{
    $.get("public/voteData.json", function(data){
      voteData = data;
      callback(voteData);
    });
  }
}

/**
 * 获取萌战角色票数数据，回调函数形式
 * 使用全局变量存放请求过的数据，避免重复请求
 * @param  {object}   condition 已选择的画图条件
 * @param  {Function} callback  回调函数，参数为war数据
 * @return none
 */
function getWarData(condition, callback){
  //有总数据
  if(war) callback(war);
  //按日期画图，且有对应日期的数据
  else if(requestDatas[condition.date] != undefined && condition.dob == 0)
    callback(requestDatas[condition.date]);
  //
  else{
    $("#cup").show();       //显示遮罩层
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
      if(xhr.readyState==4 && xhr.status==200){
        var resJson = JSON.parse(xhr.responseText);
        if(resJson.length){
          if(condition.dob == 1 || condition.sex == "any" || condition.date.indexOf(",") != -1)
            war = resJson;
          else
            requestDatas[condition.date] = resJson;
          //获取数据后画图
          setTimeout(function(){
            callback(resJson);
            $("#cup").hide(); //隐藏遮罩层
          },100);
        }
        else{
          alert("获取数据失败");
          $("#cup").hide(); //隐藏遮罩层
        }
      }
    }
    //进度条处理(gzip压缩后下无法获取进度了，未解决)
    xhr.onprogress = function(evt){
      var loaded = evt.loaded;
      var tot = evt.total;
      var per = Math.floor(100*loaded/tot);
      var son =  document.getElementById('son');
      $("#data-tip .num").html(~~(this.getResponseHeader("Content-Length")/1024));
      progress(per, $('#progressBar'));
    }
    if(condition.dob == 1 || condition.sex == "any" || condition.date.indexOf(",") != -1)
      xhr.open("get","api/data/role");
    else
      xhr.open("get","api/data/role?date="+condition.date);
    xhr.send();
  }
}

/**
 * 更新数据获取进度条百分比
 * 
 * @param  {int}        percent   百分比
 * @param  {$document}  $element  jq元素
 * @return none
 * 
 */
function progress(percent, $element) {
  var progressBarWidth = percent * $element.width() / 100;
  $element.find('div').animate({ width: progressBarWidth }, 100).html(percent + "% ");
  $element.find('span.bar').animate({ width: progressBarWidth }, 100);
}



/**
 * 页面加载完处理
 */
$(document).ready(function() {
  /**
   * 下拉框change事件
   * 控制下拉框的隐藏和显示
   */
  //构建多选框
  $('#input-date').datepicker({
    format: "yy-mm-dd",
    language: "zh-CN",
    startDate: dates[dates.length-1],
    endDate: dates[0],
    todayHighlight: true,
    clearBtn: true,
    multidate: true
  });
  /*.on("clearDate", function(e){
    $('#input-date').datepicker('update', dates[0]);
  });*/
  function setShowAndHidden(){
    var dob = $("#date-or-bangumi").val();
    //按日期
    if(dob == 0){
      $("#input-date").show();
      $("#sel-sex").show();
      $("#sp-range").show();
      $("#sel-bangumi").hide();
    }
    //按阵营
    else if(dob == 1){
      $("#input-date").hide();
      $("#sel-sex").show();
      $("#sp-range").hide();
      $("#sel-bangumi").show();
    }
    //票仓图
    else if(dob == 2){
      $("#input-date").show();
      $("#sel-sex").hide();
      $("#sp-range").hide();
      $("#sel-bangumi").hide();
    }
  }
  setShowAndHidden();
  $("#date-or-bangumi").change(setShowAndHidden);
  $("#submit").click(function(){
    var condition = {};
    condition.dob = $("#date-or-bangumi").val();
    condition.sex = $("#sel-sex").val();
    condition.date = $("#input-date").val();
    condition.chart = $("#sel-chart").val();
    condition.bangumi = $("#sel-bangumi").val();
    condition.sliceStart = ~~$("#sliceStart").val();
    condition.sliceEnd = ~~$("#sliceEnd").val();
    startDraw(condition);
  });

  var condition = {};
  condition.dob = $("#date-or-bangumi").val();
  condition.sex = $("#sel-sex").val();
  condition.date = $("#input-date").val();
  condition.chart = $("#sel-chart").val();
  condition.bangumi = $("#sel-bangumi").val();
  condition.sliceStart = ~~$("#sliceStart").val();
  condition.sliceEnd = ~~$("#sliceEnd").val();
  startDraw(condition);
});