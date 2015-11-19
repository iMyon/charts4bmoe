#charts4bmoe
[Bilibili Moe曲线图](http://bmoe.uuzsama.me/)  
###说明  
* 数据从b站接口抓取，每小时01分更新曲线  
* 11月7日之后有完整数据，之前数据不完整
* 由于b站票仓api有点混乱，不保证票仓数据完全正确

------------------------------------------------------------

程序员分割线

------------------------------------------------------------

###安装部署
    git clone https://github.com/iMyon/charts4bmoe
    cd charts4bmoe
    npm install
    node app.js
浏览器打开`http://127.0.0.1:2333/`  
需要nodejs环境支持  
##对外API接口说明  
###1./data/role  
####描述  
获取人物得票数据

####请求方法
Get

####参数  
Reuqired    |   Name   |  Type  |  description
------------|----------|--------|-----------------
optional    |date      |string  |日期
optional    |name      |string  |人物名称
optional    |bangumi   |string  |动画名称
optional    |sex       |string  |性别，0女1男
optional    |format    |string  |数据格式，默认json，table为使用网页表格显示
optional    |id        |string  |人物标识id

####返回参数  
返回角色数据数组

####请求样例  
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

###2./data/ballot  
####描述  
获取领票数据  
####请求方法  
GET  
####参数  
Reuqired    |   Name   |  Type  |  description
------------|----------|--------|-----------------
optional    |date      |string  |日期
optional    |format    |string  |数据格式，默认json，table为使用网页表格显示

####请求样例  
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

####返回参数说明  
Name    |   Description
--------|-----------------------
date    |   日期
time    |   时间
total   |   总发票数
token   |   领票数

