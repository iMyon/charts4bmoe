// 路径配置
require.config({
  paths: {
    echarts: 'http://echarts.baidu.com/build/dist'
  }
});

var war;
var voteData;

if(!war){
  $.getJSON('public/data.json', function(data) {
      war = data;
      startDraw();
  });
}

//根据动画画图
function getDataByBangumi(bangumi,chartType, sex){
  var AllCharDatas;
  var v_times = ["00:00","01:00","02:00","03:00","04:00","05:00","06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"];
  for(var i=0; i<dates.length;i++){
    var tdata = getChartData(war, dates[i], sex);
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
    if(AllCharDatas == undefined){
      AllCharDatas = tdata;
    }
    else AllCharDatas.series = AllCharDatas.series.concat(tdata.series);
  }
  AllCharDatas.series = AllCharDatas.series.filter(function(e) {
    if(bangumi == "any") return true;
    return e.info.bangumi==bangumi;
  });
  AllCharDatas.subtext = bangumi;
  return AllCharDatas;
}

function getChartData(war, day, sex){
  if(day=="any") return getDataByBangumi("any", $("#sel-chart").val(), sex);
  var dayData = war.filter(function(e) {
    return (e.v_day==day) && (sex==e.sex || sex==2 );
  });
  var chartData = {};
  chartData.text = "总票数折线图";
  chartData.subtext = day+" | "+ (sex==1?"男子组":sex==0?"女子组":"男女");
  chartData.formatter = '{value} 票';
  chartData.v_times = [];
  chartData.series = [];
  if(dayData){
    if(dayData[0].data[0].v_time!="00") chartData.v_times.push("00:00");
    for(var i=0;i<dayData[0].data.length;i++){
      chartData.v_times.push(dayData[0].data[i].v_time+":00")
    }
    for(var i=0;i<dayData.length;i++){
      var sery = {};
      sery.info = {
        sex: dayData[i].sex,
        bangumi: dayData[i].bangumi
      }
      sery.name = dayData[i].name;
      sery.type = "line";
      sery.data = [];
      sery.itemStyle = {
        emphasis : {
          label : {show: true},
        }
      };
      if(dayData[0].data[0].v_time!="00")  sery.data.push(0);
      for(var j=0;j<dayData[i].data.length;j++)
        sery.data.push(dayData[i].data[j].v_count);
      chartData.series.push(sery);
    }
  }
  return chartData;
}
//每小时得票数
function getGradChartData(chartData){
  chartData.text = "每小时票数折线图";
  var gradchartData = chartData;
  var v_times = gradchartData.v_times;
  gradchartData.v_times = [];
  for(var i=0;i<v_times.length-1;i++)
      gradchartData.v_times.push((v_times[i]+"-"+v_times[i+1]));
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

//每小时得票率
function getRatePerHChartData(chartData){
  var gradchartData = getGradChartData(chartData);      //获取每小时票数数据
  var rateChartData = gradchartData = getRateChartData(gradchartData);    //根据每小时票数数据计算每小时占比例
  rateChartData.text = "每小时得票率折线图";
  // rateChartData.subtext = rateChartData.subtext + " | 交点表示票数差距缩小";
  rateChartData.formatter = '{value}%';
  return rateChartData;
}

//总得票率
function getTotalRateChart(chartData){
  var totalRateChart = getRateChartData(chartData);
  totalRateChart.text = "总得票率折线图";
  var v_times = totalRateChart.v_times;
  totalRateChart.v_times = [];
  for(var i=0;i<v_times.length-1;i++)
      totalRateChart.v_times.push((v_times[i]+"-"+v_times[i+1]).replace(/:00/g, ""));
  totalRateChart.series.forEach(function(sery, index){
    totalRateChart.series[index].data.shift();
  });
  return totalRateChart;
}

//同一时间段各个数据所占比例
function getRateChartData(chartData){
  chartData.formatter = '{value}%';
  chartData.tooltip_formatter = function (params,ticket,callback) {
      var res = '时间段得票率: <br/>' + params[0].name;
      for (var i = 0, l = params.length; i < l; i++) {
        res += '<br/>' + params[i].seriesName + ' : ' + params[i].value + " %";
      }
      return res;
  };
  var sums_boy = [];
  var sums_girl = [];
  var ratechartData = chartData;
  ratechartData.series.forEach(function(sery, index){
    for(var i=0; i<sery.data.length; i++){
      if(sery.info.sex == 0) sums_girl[i] = ~~sums_girl[i]+~~sery.data[i];  
      if(sery.info.sex == 1) sums_boy[i] = ~~sums_boy[i]+~~sery.data[i];  
    }
  });
  ratechartData.series.forEach(function(sery, index){
    var data = new Array();
    var sums = sery.info.sex==0?sums_girl:sums_boy;
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

//领票数曲线
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
      label : {show: true},
    }
  };
  vDatas.forEach(function(vData){
    ticketChartData.v_times.push(vData.time);
    sery.data.push(vData.token);
  });
  ticketChartData.series.push(sery);

  return  ticketChartData;
}

//绘图
function draw(chartData, sliceStart, sliceEnd){
  //排序desu 降序
  chartData.series = chartData.series.sort(function(a,b){
    var data1 = a.data[a.data.length-1]?a.data[a.data.length-1]:0;
    var data2 = b.data[b.data.length-1]?b.data[b.data.length-1]:0;
    return data2-data1;
  });
  chartData.roles = [];
  chartData.series.forEach(function(sery){
    chartData.roles.push(sery.name);
  });
  //

  sliceStart = sliceStart?sliceStart-1:0;
  sliceEnd = sliceEnd?sliceEnd:12;
  sliceEnd = sliceEnd<chartData.series.length?sliceEnd:chartData.series.length;
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
          subtext: chartData.subtext + " | " + (sliceStart+1) + "-" + sliceEnd + "名"
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
        series: chartData.series.slice(sliceStart, sliceEnd)
      };

      // 为echarts对象加载数据 
      myChart.setOption(option);
    }
  );
}

//前置补全0
function prefixZero(num, val) {
  return (new Array(num).join('0') + val).slice(-num);
}

$(document).ready(function() {
  function setShowAndHidden(){
    var dob = $("#date-or-bangumi").val();
    if(dob == 0){
      $("#sel-date").show();
      $("#sel-sex").show();
      $("#sp-range").show();
      $("#sel-bangumi").hide();
    }
    else if(dob == 1){
      $("#sel-date").hide();
      $("#sel-sex").hide();
      $("#sp-range").hide();
      $("#sel-bangumi").show();
    }
    else if(dob == 2){
      $("#sel-date").show();
      $("#sel-sex").hide();
      $("#sp-range").hide();
      $("#sel-bangumi").hide();
    }
  }
  setShowAndHidden();
  $("#date-or-bangumi").change(setShowAndHidden);
  $("#submit").click(function(){
    startDraw();
  })
});
function startDraw(){
  var dob = $("#date-or-bangumi").val();
  var sex = $("#sel-sex").val();
  var date = $("#sel-date").val();
  var chart = $("#sel-chart").val(); 
  var bangumi = $("#sel-bangumi").val();
  var sliceStart = ~~$("#sliceStart").val();
  var sliceEnd = ~~$("#sliceEnd").val();
  if(dob == 0){
    var chartData = getChartData(war, date, sex);
    if(date != "any"){
      if(chart == 1) chartData = getGradChartData(chartData);
      else if(chart == 2) chartData = getRatePerHChartData(chartData);
      else if(chart == 3) chartData = getTotalRateChart(chartData);
    }
    
    draw(chartData, sliceStart, sliceEnd);
  }
  else if(dob == 1){
    draw(getDataByBangumi(bangumi, chart, $("#sel-chart").val()), 1, 999999);
  }
  else if(dob == 2){
    if(["0","1"].indexOf(chart) != -1){
      getVoteDataJson(function(voteData){
        var chartData;
        if(date == "any"){//合并data
          dates.forEach(function(date){
            var d = getTicketChartData(voteData, date);
            if(chartData == undefined) chartData = d;
            else chartData.series = chartData.series.concat(d.series);
          });
        }
        else chartData = getTicketChartData(voteData, $("#sel-date").val());
        var chart = $("#sel-chart").val();
        if(chart == 1) chartData = getGradChartData(chartData)
        else if(chart == 2) chartData = getRatePerHChartData(chartData)
        else if(chart == 3) chartData = getTotalRateChart(chartData)
        draw(chartData, sliceStart, sliceEnd);
        draw(chartData);
      });
    }
    else alert("这图真画不了");
  }
}

//获取投票json
function getVoteDataJson(callback){
  if(voteData) callback(voteData);
  else{
    $.get("public/voteData.json", function(data){
      voteData = data;
      callback(voteData);
    })
  }
}