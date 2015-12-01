#指定角色的曲线图如何画？  
由于懒得写界面，只实现了功能函数，想画的话比较麻烦，操作如下：  

###打开浏览器控制台，运行下面的代码  

```js
var roles = [9471,9584];    /*角色id，英文逗号分隔*/
var _chartType = 0;         /*0总票数 1每小时票数 2每小时票率*/

getWarData({date:dates.join(',')}, function(war){
  var d = getDataByIds(war, roles, _chartType);
  draw(d);
});
```

###浏览器控制台怎么打开？  
我只用`firefox`，各浏览器应该都差不多  
`F12` 点击控制台，粘贴代码回车就能运行  


###角色id如何获取？   
打开[http://bmoe.uuzsama.me/api/data/rank?format=table](http://bmoe.uuzsama.me/api/data/rank?format=table)  
