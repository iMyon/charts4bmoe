// 引入百度echarts支持
require.config({
  paths: {
    echarts: '/js/lib'
  }
});

var war;                  //比赛数据（json获取
var voteData;             //投票数据（json获取
var requestDatas = [];    //保存每次请求数据避免重复请求
var totalVoteData;        //面票总数
var stageMap = ["", "海选", "复活赛", "128强", "32强", "16强", "8强", "半决赛", "三四位决赛", "决赛"];
//echars属性：显示数值点
var itemStyle_show = {
  emphasis: {
    label: { show: true }
  }
};
//echars属性：markpoint 百分比添加平均值和最大值
var markPoint_percent = {
  data: [
    { type: 'max', name: '最大值' },
    { type: 'average', name: '平均值' }
  ],
  itemStyle: {
    normal: {
      label: {
        formatter: "{c} %"
      }
    }
  }
};
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
    desc: "鸭子被影姐首次超过，舆论一波"
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
  },
  {
    day: "15-12-01",
    time: "21",
    name: "2333",
    desc: "银魂厨舰c吧实力嘲讽提督+某群神秘战力"
  },
  {
    day: "15-12-20",
    time: "00",
    name: "b萌似乎开始偏离‘正常’",
    desc: "西木野真姬对战saber，第一波只差7票；绚濑绘里以绝对优势压住神乐。"
  },
  {
    day: "15-12-20",
    time: "22",
    name: "东L联盟",
    desc: "东京食尸鬼联盟LoveLive，双方贴吧正式公布消息。LL仇恨值达到峰值？"
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
function getDataByCondition(war, condition, chartType) {
  var AllCharDatas;
  var v_times = ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];
  var _dates = dates;
  //如果参数中有日期，则按照参数中的筛选
  if (condition.date) _dates = condition.date.split(",");
  var fillTime = function (sery, index) {
    for (var i = 0, j = 0; i < v_times.length; i++) {
      if (tdata.v_times[j] != v_times[i]) {
        tdata.series[index].data.splice(i, 0, undefined);
      }
      else j++;
    }
  };
  var setNameWithStage = function (stage) {
    return function (sery, index) {
      sery.name = sery.name + "（" + stageMap[stage] + "）";
    };
  };
  for (var i = 0; i < _dates.length; i++) {
    var stage = getStage(_dates[i]);
    var tdata = getChartData(war, {date:_dates[i], sex:"any", group:"any"});
    tdata.series.forEach(fillTime);
    if (stage > 1) tdata.series.forEach(setNameWithStage(stage));
    tdata.v_times = v_times;
    if (chartType == 1) tdata = getGradChartData(tdata);
    else if (chartType == 2) tdata = getRatePerHChartData(tdata);
    else if (chartType == 3) tdata = getTotalRateChart(tdata);
    if (AllCharDatas === undefined) {  //初始化首次数据
      AllCharDatas = tdata;
    }
    else AllCharDatas.series = AllCharDatas.series.concat(tdata.series);
  }
  condition.date = undefined;//重置day，以便后面筛选
  AllCharDatas.series = AllCharDatas.series.filter(function (e) {
    for (var key in condition) {
      if (condition[key] == "any") continue;
      if (condition[key] != e.filterCondition[key]) return false;
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
function getDataByIds(war, ids, chartType) {
  var datas;
  ids.forEach(function (id) {
    if (datas === undefined) datas = getDataByCondition(war, { id: id }, chartType);
    else datas.series = datas.series.concat(getDataByCondition(war, { id: id }, chartType).series);
  });
  var roles = [];
  datas.series.forEach(function (sery) {
    roles.push(sery.name);
  });
  datas.subtext = roles.join("、");
  return datas;
}

/**
 * 根据日期和性别得到当前时间人物获得的总票数曲线图信息
 * 
 * @param  {object} war 萌战比赛json原始数据
 * @param  {object} condition 表单条件
 * @return {object} echarts总票数图形数据
 * 
 */
function getChartData(war, condition) {
  var days = condition.date.split(",");
  if (days.length > 1) return getDataByCondition(war, { bangumi: "any", sex: condition.sex, date: condition.date }, $("#sel-chart").val());
  var dayData = war.filter(function (e) {
    return (e.date == condition.date) && 
      (condition.sex == e.sex || condition.sex == "any") && 
      (e.group == condition.group || condition.group == "any");
  });
  var chartData = {};
  chartData.text = "总票数折线图";
  chartData.formatter = '{value} 票';
  chartData.v_times = [];
  chartData.series = [];
  chartData.tooltip_formatter = tooltipFormatGenerator("{{name}} 总共获得票数: ");
  if (dayData) {
    if (dayData[0].data[0].time != "00") chartData.v_times.push("00:00");
    for (var i = 0; i < dayData[0].data.length; i++) {
      chartData.v_times.push(dayData[0].data[i].time + ":00");
    }
    for (i = 0; i < dayData.length; i++) {
      var sery = {};
      sery.filterCondition = {
        id: dayData[i].id,
        sex: dayData[i].sex,
        bangumi: dayData[i].bangumi
      };
      if (dayData[i].group !== undefined) sery.filterCondition.group = dayData[i].group;
      sery.name = dayData[i].name;
      if (sery.filterCondition.group !== undefined)
        sery.name = sery.name + "（" + sery.filterCondition.group + "）";
      sery.type = "line";
      // sery.symbol = "none"; //取消点显示
      sery.data = [];
      sery.itemStyle = itemStyle_show;
      if (dayData[0].data[0].time != "00") sery.data.push(0);
      for (var j = 0; j < dayData[i].data.length; j++) {
        sery.data.push(dayData[i].data[j].count);
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
function getGradChartData(chartData) {
  chartData.tooltip_formatter = tooltipFormatGenerator("时间段得票数: <br/>{{name}}");
  chartData.text = "每小时票数折线图";
  var gradchartData = chartData;
  var v_times = gradchartData.v_times;
  gradchartData.v_times = [];
  for (var i = 0; i < v_times.length - 1; i++)
    gradchartData.v_times.push((v_times[i + 1]));
  // gradchartData.v_times.push((v_times[i]+"-"+v_times[i+1]).replace(/:\d+/g, ""));
  gradchartData.series.forEach(function (sery, index) {
    var data = [];
    for (var i = 0; i < sery.data.length - 1; i++) {
      if (sery.data[i + 1] === undefined || sery.data[i] === undefined)
        data.push(undefined);
      else
        data.push(sery.data[i + 1] - sery.data[i]);
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
function getRatePerHChartData(chartData) {
  //获取每小时票数数据
  var gradchartData = getGradChartData(chartData);
  //根据每小时票数数据计算每小时占比例
  var rateChartData = getRateChartData(gradchartData);
  rateChartData.text = "每小时得票率折线图";
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
function getTotalRateChart(chartData) {
  var totalRateChart = getRateChartData(chartData);
  totalRateChart.text = "总得票率折线图";
  totalRateChart.tooltip_formatter = tooltipFormatGenerator("{{name}}总得票率：");
  var v_times = totalRateChart.v_times;
  totalRateChart.v_times = [];
  for (var i = 0; i < v_times.length - 1; i++)
    totalRateChart.v_times.push((v_times[i + 1]));
  // totalRateChart.v_times.push((v_times[i]+"-"+v_times[i+1]).replace(/:00/g, ""));
  totalRateChart.series.forEach(function (sery, index) {
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
function getRateChartData(chartData) {
  chartData.formatter = '{value}%';
  chartData.tooltip_formatter = tooltipFormatGenerator("时间段得票率: <br/>{{name}}");
  var sums_boy = [];
  var sums_girl = [];
  var ratechartData = chartData;
  ratechartData.series.forEach(function (sery, index) {
    var group = sery.filterCondition.group ? sery.filterCondition.group : "default";
    sums_boy[group] = sums_boy[group] ? sums_boy[group] : [];
    sums_girl[group] = sums_girl[group] ? sums_girl[group] : [];
    for (var i = 0; i < sery.data.length; i++) {
      if (sery.filterCondition.sex == "0") sums_girl[group][i] = ~~sums_girl[group][i] + ~~sery.data[i];
      if (sery.filterCondition.sex == "1") sums_boy[group][i] = ~~sums_boy[group][i] + ~~sery.data[i];
    }
  });
  ratechartData.series.forEach(function (sery, index) {
    var data = [];
    var sums = sery.filterCondition.sex == "0" ? sums_girl : sums_boy;
    var group = sery.filterCondition.group ? sery.filterCondition.group : "default";
    sums = sums[group];
    for (var i = 0; i < sery.data.length; i++) {
      if (sery.data[i] === undefined) data.push(undefined);
      else if (sums[i] === 0) data.push(0);
      else data.push(parseFloat(((~~sery.data[i] / sums[i]).toFixed(6) * 100).toFixed(2)));
    }
    ratechartData.series[index].data = data;
    ratechartData.series[index].itemStyle.emphasis.label.formatter = "{c} %";
    ratechartData.series[index].markPoint = markPoint_percent;
  });
  return ratechartData;
}

/**
 * 根据echarts数据求得时间段在全天的占比
 * 
 * @param  {object} chartData echarts图形数据
 * @return {object} 占比echarts数据
 * 
 */
function perHourDivTotal(chartData) {
  chartData = getGradChartData(chartData);
  chartData.formatter = '{value}%';
  chartData.text = "时间段得票率折线图";
  chartData.tooltip_formatter = tooltipFormatGenerator("时间段票数相对全天票数占比: <br/>{{name}}");
  var perDivTotalData = chartData;

  perDivTotalData.series.forEach(function (sery, index) {
    var data = [];
    var sum = 0;
    sery.data.forEach(function (e) {
      sum += ~~e;
    });
    sery.data.forEach(function (e) {
      data.push(parseFloat(((~~e / sum).toFixed(6) * 100).toFixed(2)));
    });
    perDivTotalData.series[index].data = data;
    perDivTotalData.series[index].itemStyle.emphasis.label.formatter = "{c} %";
    perDivTotalData.series[index].markPoint = markPoint_percent;
  });
  return perDivTotalData;
}

/**
 * 领票数曲线
 * 
 * @param  {object} voteData  领票数原始json数据
 * @param  {string} day       日期 
 * @return {object} echarts图形数据
 * 
 */
function getTicketChartData(voteData, day) {
  // $.getJSON("public/voteData.json", function(data){
  //   voteData = data;
  // });
  var vDatas = voteData.filter(function (vData) {
    return vData.date == day;
  });
  var ticketChartData = {};
  ticketChartData.text = "领票总数折线图";
  ticketChartData.formatter = '{value} 票';
  ticketChartData.v_times = [];
  ticketChartData.series = [];

  var sery = {};
  sery.name = day;
  sery.type = "line";
  sery.data = [];
  sery.itemStyle = itemStyle_show;
  vDatas.forEach(function (vData) {
    sery.data.push(vData.token);
  });
  ticketChartData.series.push(sery);
  ticketChartData.v_times = ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];
  ticketChartData.tooltip_formatter = tooltipFormatGenerator("{{name}} 总共领取票数: ");
  return ticketChartData;
}

/**
 * 面票总数数曲线
 * 
 * @param  {object} voteData  领票数原始json数据
 * @param  {string} condition 筛选条件 
 * @return {object} echarts图形数据
 * 
 */
function getTotalVoteChartData(totalVoteData, condition) {
  var vDatas = totalVoteData.filter(function (vData) {
    for (var key in condition) {
      if (vData[key] != condition[key]) return false;
    }
    return true;
  });
  var lingFlag = false; //是否有零点标志
  vDatas.forEach(function (e) {
    if (e.time == "00") lingFlag = true;
  });
  var totalVoteChartData = {};
  totalVoteChartData.text = "面票总数折线图";
  totalVoteChartData.formatter = '{value} 票';
  totalVoteChartData.v_times = [];
  totalVoteChartData.series = [];

  var moe = "萌";
  if (condition.sex == 1) moe = "燃";
  var sery = {};
  sery.name = condition.date + moe;
  sery.type = "line";
  sery.data = [];
  sery.itemStyle = itemStyle_show;
  if (!lingFlag) {
    sery.data.push(0);
  }
  vDatas.forEach(function (vData) {
    sery.data[~~vData.time] = vData.count;
  });
  //补全空值为undefined
  for (var i = 0; i <= 23; i++) {
    if (sery[i] === undefined) sery[i] = undefined;
  }
  totalVoteChartData.series.push(sery);
  totalVoteChartData.v_times = ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];
  totalVoteChartData.tooltip_formatter = tooltipFormatGenerator("{{name}} 投票数总和: ");
  return totalVoteChartData;
}

/**
 * 生成echarts的tooltip_format函数
 * @param  {string}           title 标题
 * @return {Function}         tooltip_format函数
 */
function tooltipFormatGenerator(title) {
  return function (params, ticket, callback) {
    var res = title.replace(/{{name}}/g, params[0].name);
    params.sort(function (a, b) {
      if (a.value === "-") return 1;
      return parseFloat(b.value) > parseFloat(a.value) || -1;
    });
    for (var i = 0, l = params.length; i < l; i++) {
      res += '<br/>' + (i + 1) + "." + params[i].seriesName + ' : ' + params[i].value;
    }
    return res;
  };
}

/**
 * 生成echarts的subtext参数的函数
 * @param  {object} condition     生成条件
 * @return {String}               subtext字符串
 */
function subTextGenerator(condition) {
  var date, bangumi, sex;
  if (condition.date !== undefined) {
    var dateArr = condition.date.split(",");
    date = condition.date;
    if (dateArr.length > 4) date = dateArr.slice(0, 4).join(",") + " 等";
  }
  if (condition.bangumi !== undefined) bangumi = condition.bangumi;
  if (condition.sex !== undefined) {
    if (condition.sex == "0") sex = "萌";
    else if (condition.sex == "1") sex = "燃";
    else sex = "萌燃";
  }
  var arr = [date, bangumi, sex].filter(function (e) {
    return e !== undefined;
  });
  return arr.join(" | ");
}

/**
 * 绘制图形
 * 
 * @param  {object} chartData                        echarts图形数据
 * @param  {int}    [sliceStart=1]                   绘制数据的首元素坐标+1
 * @param  {int}    [sliceEnd=chartData.length-1]    绘制数据的末元素-2
 * 
 */
function draw(chartData, sliceStart, sliceEnd) {
  //初始化开始坐标和结束坐标参数
  sliceStart = sliceStart ? sliceStart - 1 : 0;
  sliceEnd = sliceEnd ? sliceEnd : 12;
  sliceEnd = sliceEnd < chartData.series.length ? sliceEnd : chartData.series.length;
  /*//删除空数据
  chartData.series = chartData.series.filter(function(sery){
    return !sery.data.join("") == "";
  });*/
  //按data最后一个元素降序排序
  chartData.series = chartData.series.sort(function (a, b) {
    var data1 = a.data[a.data.length - 1] ? a.data[a.data.length - 1] : 0;
    var data2 = b.data[b.data.length - 1] ? b.data[b.data.length - 1] : 0;
    return data2 - data1;
  });
  chartData.roles = [];
  chartData.series.forEach(function (sery) {
    chartData.roles.push(sery.name);
  });
  //计算图形右侧线条说明的宽度
  var max = 0;
  for (var i = sliceStart; i < sliceEnd; i++)
    max = max > chartData.series[i].name.length ? max : chartData.series[i].name.length;
  var x2 = 50 + max * 12;
  require(
    [
      'echarts',
      'echarts/chart/bar',
      'echarts/chart/line',
    ],
    function (ec) {
      // 基于准备好的dom，初始化echarts图表
      var myChart = ec.init(document.getElementById('e-canvas'));
      var option = {
        title: {
          text: chartData.text,
          subtext: chartData.subtext + " | " + (sliceStart + 1) + "-" + sliceEnd + "位"
        },
        grid: {
          x2: x2
        },
        tooltip: {
          trigger: 'axis',
          formatter: chartData.tooltip_formatter
        },
        legend: {
          data: chartData.roles.slice(sliceStart, sliceEnd),
          x: "right",
          y: "center",
          orient: "vertical"
        },

        toolbox: {
          show: true,
          x: 'center',
          y: 'top',
          feature: {
            dataZoom: {
              show: true,
              title: {
                dataZoom: '区域缩放',
                dataZoomReset: '区域缩放-后退'
              }
            },
            magicType: {
              show: true,
              type: ['line', 'bar']
            },
            dataView: {
              show: true,
              title: '数据视图',
              readOnly: false,
              lang: ['数据视图', '关闭', '刷新']
            },
            mark: {
              show: true,
              title: {
                mark: '辅助线开关',
                markUndo: '删除辅助线',
                markClear: '清空辅助线'
              },
              lineStyle: {
                width: 2,
                color: '#1e90ff',
                type: 'dashed'
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
function startDraw(condition) {
  if (condition.dob == "0") {
    getWarData(condition, function (war) {
      var chartData = getChartData(war, condition);
      if (condition.date.indexOf(",") == -1) {
        if (condition.chart == 1) chartData = getGradChartData(chartData);
        else if (condition.chart == 2) chartData = getRatePerHChartData(chartData);
        else if (condition.chart == 3) chartData = getTotalRateChart(chartData);
      }
      chartData.subtext = subTextGenerator({ date: condition.date, sex: condition.sex });
      draw(chartData, condition.sliceStart, condition.sliceEnd);
    });
  }
  else if (condition.dob == 1) {
    getWarData(condition, function (war) {
      var chartData = getDataByCondition(war, {
        bangumi: condition.bangumi,
        sex: condition.sex
      }, condition.chart);
      chartData.subtext = subTextGenerator({ bangumi: condition.bangumi, sex: condition.sex });
      draw(chartData, 1, 999999);
    });
  }
  else if (condition.dob == 2) {
    if (["0", "1", "2"].indexOf(condition.chart) != -1) {   //票仓只能画总票数和每小时票数折线图
      getVoteData(function (voteData) {
        var chartData;
        if (condition.date.indexOf(",") != -1) {
          //合并data
          condition.date.split(",").forEach(function (date) {
            var d = getTicketChartData(voteData, date);
            if (chartData === undefined) chartData = d;
            else chartData.series = chartData.series.concat(d.series);
          });
        }
        else chartData = getTicketChartData(voteData, condition.date);
        if (condition.chart == 1) chartData = getGradChartData(chartData);
        else if (condition.chart == 2) chartData = perHourDivTotal(chartData);
        chartData.subtext = subTextGenerator({ date: condition.date });
        draw(chartData, 0, 99999);
      });
    }
    else alert("这个画不了");
  }
  else if (condition.dob == 3) {          //面票
    if (["0", "1", "2"].indexOf(condition.chart) != -1) {
      getTotalVoteData(function (totalVoteData) {
        var chartData;
        if (condition.date.indexOf(",") != -1) {
          //合并data
          condition.date.split(",").forEach(function (date) {
            var d = {};
            if (condition.sex != "any") d = getTotalVoteChartData(totalVoteData, { date: date, sex: condition.sex });
            //萌燃
            else {
              d = getTotalVoteChartData(totalVoteData, { date: date, sex: 0 });
              d.series = getTotalVoteChartData(totalVoteData, { date: date, sex: 1 }).series
                .concat(d.series);
            }
            if (chartData === undefined) chartData = d;
            else chartData.series = chartData.series.concat(d.series);
          });
        }
        else {
          if (condition.sex != "any") chartData = getTotalVoteChartData(totalVoteData, { date: condition.date, sex: condition.sex });
          //萌燃
          else {
            chartData = getTotalVoteChartData(totalVoteData, { date: condition.date, sex: 0 });
            chartData.series = getTotalVoteChartData(totalVoteData, { date: condition.date, sex: 1 }).series
              .concat(chartData.series);
          }
        }
        if (condition.chart == 1) chartData = getGradChartData(chartData);
        else if (condition.chart == 2) chartData = perHourDivTotal(chartData);
        chartData.subtext = subTextGenerator({ date: condition.date, sex: condition.sex });
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
function getVoteData(callback) {
  //先取全局变量，否则ajax请求
  if (voteData) callback(voteData);
  else {
    $.get("public/voteData.json", function (data) {
      voteData = data;
      callback(voteData);
    });
  }
}
/**
 * 获取面票json
 * 
 * @param  {Function} callback  获取json后的回调函数
 * @return none
 * 
 */
function getTotalVoteData(callback) {
  if (totalVoteData) callback(totalVoteData);
  else {
    $.get("public/totalVote.json", function (data) {
      totalVoteData = data;
      callback(totalVoteData);
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
function getWarData(condition, callback) {
  //有总数据
  if (war) callback(war);
  //按日期画图，且有对应日期的数据
  else if (requestDatas[condition.date] !== undefined && condition.dob == "0")
    callback(requestDatas[condition.date]);
  //
  else {
    $("#cup").show();       //显示遮罩层
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && xhr.status == 200) {
        var resJson = JSON.parse(xhr.responseText);
        if (resJson.length) {
          if (condition.dob == 1 || condition.sex == "any" || condition.date.indexOf(",") != -1)
            war = resJson;
          else
            requestDatas[condition.date] = resJson;
          //获取数据后画图
          setTimeout(function () {
            callback(resJson);
            $("#cup").hide(); //隐藏遮罩层
          }, 100);
        }
        else {
          alert("获取数据失败");
          $("#cup").hide(); //隐藏遮罩层
        }
      }
    };
    //进度条处理(gzip压缩后下无法获取进度了，未解决)
    xhr.onprogress = function (evt) {
      var loaded = evt.loaded;
      var tot = evt.total;
      var per = Math.floor(100 * loaded / tot);
      var son = document.getElementById('son');
      $("#data-tip .num").html(~~(this.getResponseHeader("Content-Length") / 1024));
      progress(per, $('#progressBar'));
    };
    if (condition.dob == 1 || condition.sex == "any" || condition.date.indexOf(",") != -1)
      xhr.open("get", "api/data/role");
    else
      xhr.open("get", "api/data/role?date=" + condition.date);
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
 * 根据日期获得阶段
 * 
 * @param  {string}     date   日期
 * @return {int}               阶段标识
 * 
 */
function getStage(voteDay) {
  var stage;
  if (voteDay <= "15-12-06") stage = 1;       //海选
  else if (voteDay <= "15-12-11") stage = 2;  //复活
  else if (voteDay <= "15-12-19") stage = 3;  //128强
  else if (voteDay <= "15-12-23") stage = 4;  //32强
  else if (voteDay <= "15-12-26") stage = 5;  //16强
  else if (voteDay <= "15-12-30") stage = 6;  //8强
  else if (voteDay <= "16-01-01") stage = 7;  //半决赛
  else if (voteDay <= "16-01-02") stage = 8;  //三四名决赛
  else stage = 9;                          //决赛
  return stage;
}


/**
 * 页面加载完处理
 */
$(document).ready(function () {
  $('select').material_select();
  $('.modal-trigger').leanModal();
  function setShowAndHidden() {
    var dob = $("#date-or-bangumi").val();
    $("[data-control='true']").attr('disabled', true);
    $("[data-show*='" + dob + "']").removeAttr('disabled');
    $("select").material_select();    //重新渲染
  }
  setShowAndHidden();
  $("#date-or-bangumi").change(setShowAndHidden);

  var doClick = function () {
    var condition = {};
    condition.dob = $("#date-or-bangumi").val();
    condition.sex = $("#sel-sex").val();
    condition.group = $("#sel-group").val();
    condition.date = $("#input-date").val();
    condition.date = condition.date ? condition.date : dates.join(",");
    condition.chart = $("#sel-chart").val();
    condition.bangumi = $("#input-bangumi").val();
    condition.sliceStart = ~~$("#sliceStart").val();
    condition.sliceEnd = ~~$("#sliceEnd").val();
    startDraw(condition);
  };
  doClick();
  $("#submit").click(doClick);
  
  var onDateChange = function(){
    setTimeout(function(){
      $("#sel-group").material_select();
    },500);
  };
  
  var vm = new Vue({
    el: "#main-content",
    data:{
      //本战分组
      a2h:{
        "15-12-12": ["A1","A2","A3","A4"],
        "15-12-13": ["B1","B2","B3","B4"],
        "15-12-14": ["C1","C2","C3","C4"],
        "15-12-15": ["D1","D2","D3","D4"],
        "15-12-16": ["E1","E2","E3","E4"],
        "15-12-17": ["F1","F2","F3","F4"],
        "15-12-18": ["G1","G2","G3","G4"],
        "15-12-19": ["H1","H2","H3","H4"],
        "15-12-20": ["1-A","1-B","1-C","1-D"],
        "15-12-21": ["2-A","2-B","2-C","2-D"],
        "15-12-22": ["3-A","3-B","3-C","3-D"],
        "15-12-23": ["4-A","4-B","4-C","4-D"],
        "15-12-24": ["1-A","1-B","1-C","1-D"],
        "15-12-25": ["2-A","2-B","2-C","2-D"]
      },
      dates:dates,
      bangumis: bangumis,
      yasumiNextDates:["15-12-07","15-12-12","15-12-27"],
    },
    attached: function(){
      onDateChange();
    },
    watch: {
      "condition.date": function(val, oldVal){
        onDateChange();
      }
    },
    methods:{
      changeStat: function(event){
        $(event.target).toggleClass('date-selected');
        this.setConditionDate();
      },
      selectAllDates: function(event){
        $('.date-unit span').addClass('date-selected');
        this.setConditionDate();
      },
      clearDates: function(event){
        $('.date-unit span').removeClass('date-selected');
        this.setConditionDate();
      },
      onBangumiClick: function(event){
        this.condition.bangumi = event.target.innerHTML.trim();
      },
      setConditionDate: function(){
        var dateArr = [];
        $("#modal-input-date .date-unit span.date-selected").each(function(){
          dateArr.push($(this).text().trim());
        });
        this.condition.date = dateArr.join(",");
      }
    }
  });
});
