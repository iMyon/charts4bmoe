# charts4bmoe
[Bilibili Moe曲线图](http://bmoe.uuzsama.me/)  
### 说明  
* 数据从b站接口抓取，每小时01分更新曲线  
* 11月7日之后有完整数据，之前数据不完整
* 由于b站票仓api有点混乱，不保证票仓数据完全正确

### 名词解释  
`票仓图`：b萌领票人数的统计图  
`面票图`：组内票数总和的统计图  

### 公式说明  
1. 按时间/阵营图  
`每小时票数` = 时间段内增加的票数  
`每小时票率` = 角色`每小时票数`/组内`每小时票数总和`  
`总得票率` = 角色`总票数`/组内`总票数`  
2. 票仓图/面票图  
`每小时票率` = `时间段票数增长数量`/`全天总票数`  

------------------------------------------------------------



------------------------------------------------------------

### 安装部署
    git clone https://github.com/iMyon/charts4bmoe
    cd charts4bmoe
    npm install
    node app.js
浏览器打开`http://127.0.0.1:2333/`  
需要nodejs环境支持  
## 对外API接口说明  
### 1./api/data/role  
#### 描述  
获取人物得票数据

#### 请求方法
Get

#### 参数  
Reuqired    |   Name   |  Type  |  description
------------|----------|--------|-----------------
optional    |date      |string  |日期
optional    |name      |string  |人物名称
optional    |bangumi   |string  |动画名称
optional    |sex       |int     |性别，0女1男
optional    |stage     |int     |比赛阶段 1:海选 2:复活 3:128强 4:32强 5:16强 6：8强 7:半决赛 8：三四位半决赛 9:决赛
optional    |format    |string  |数据格式，默认json，table为使用网页表格显示
optional    |id        |int     |人物标识id

#### 返回参数  
返回角色数据数组

#### 请求样例  
GET     http://bmoe.uuzsama.me/api/data/role?date=15-11-14&name=岩泽雅美  
返回json：

```js
[{
    "id": "9415",
    "name": "岩泽雅美",
    "bangumi": "Angel Beats OVA",
    "date": "15-11-14",
    "sex": "0",
    "data": [
    {"time": "00","count": "0"}, 
    {"time": "01","count": "1075"}, 
    {"time": "02","count": "1721"}, 
    {"time": "03","count": "2016"}, 
    ...
    {"time": "23","count": "13458"}]
}]
```

### 2./api/data/ballot  
#### 描述  
获取领票数据  
#### 请求方法  
GET  
#### 参数  
Reuqired    |   Name   |  Type  |  description
------------|----------|--------|-----------------
optional    |date      |string  |日期
optional    |format    |string  |数据格式，默认json，table为使用网页表格显示

#### 请求样例  
GET     http://bmoe.uuzsama.me/api/data/ballot?date=15-11-19  
返回json：  
```js
[{
    "date": "15-11-19",
    "time": "00:00",
    "total": 10000,
    "token": 0
}, {
    "date": "15-11-19",
    "time": "01:00",
    "total": 10000,
    "token": 4971
}, {
    "date": "15-11-19",
    "time": "02:00",
    "total": 12000,
    "token": 6790
}, {
    "date": "15-11-19",
    "time": "03:00",
    "total": 12400,
    "token": 7617
},
... 
]

```

#### 返回参数说明  
Name    |   Description
--------|-----------------------
date    |   日期
time    |   时间
total   |   总发票数
token   |   领票数

### 3./api/data/rank  
#### 描述  
获取排名数据  
#### 请求方法  
GET  
#### 参数  
Reuqired    |   Name   |  Type  |  description
------------|----------|--------|-----------------
optional    |date      |string  |日期
optional    |name      |string  |人物名称
optional    |bangumi   |string  |动画名称
optional    |sex       |int     |性别，0女1男
optional    |stage     |int     |比赛阶段 1:海选 2:复活 3:128强 4:32强 5:16强 6：8强 7:半决赛 8：三四位半决赛 9:决赛
optional    |format    |string  |数据格式，默认json，table为使用网页表格显示
optional    |id        |int     |人物标识id
optional    |rank      |int     |名次
optional    |stat      |int     |晋级状态： 1晋级 2复活 3淘汰

#### 请求样例  
GET     http://bmoe.uuzsama.me/api/data/rank?bangumi=凭物语  
返回json：  
```js
[
  {"id":"9443","name":"阿良良木历","bangumi":"凭物语","date":"15-11-07","sex":"1","count":"37523","rank":1},
  {"id":"8561","name":"阿良良木火怜","bangumi":"凭物语","date":"15-11-19","sex":"0","count":"16469","rank":1},
  {"id":"8729","name":"阿良良木月火","bangumi":"凭物语","date":"15-11-22","sex":"0","count":"23990","rank":3},
  {"id":"8060","name":"忍野忍","bangumi":"凭物语","date":"15-11-08","sex":"0","count":"23730","rank":3},
  {"id":"7850","name":"战场原黑仪","bangumi":"凭物语","date":"15-11-04","sex":"0","count":"18471","rank":3},
  {"id":"8229","name":"斧乃木余接","bangumi":"凭物语","date":"15-11-12","sex":"0","count":"12482","rank":5},
  {"id":"8787","name":"忍野扇","bangumi":"凭物语","date":"15-11-24","sex":"0","count":"8590","rank":7},
  {"id":"6240","name":"手折正弦","bangumi":"凭物语","date":"15-11-02","sex":"1","count":"963","rank":18}
]

```

### 4./api/data/camp  
#### 描述  
获取排名数据  
#### 请求方法  
GET  
#### 参数  
Reuqired    |   Name   |  Type  |  description
------------|----------|--------|-----------------
optional    |bangumi   |string  |动画名称
optional    |format    |string  |数据格式，默认json，table为使用网页表格显示

#### 请求样例  
GET     http://bmoe.uuzsama.me/api/data/camp?bangumi=%E5%88%80%E5%89%91%E7%A5%9E%E5%9F%9F%20%E7%AC%AC%E4%BA%8C%E5%AD%A3  
返回json：  
```js
  [{"bangumi":"刀剑神域 第二季","total":7,"suc":6,"wait":0,"fail":1}]

```

#### 返回参数说明  
Name    |   Description
--------|-----------------------
bangumi |   动画名次
total   |   参与人数
suc     |   晋级人数
wait    |   复活人数
fail    |   淘汰人数
