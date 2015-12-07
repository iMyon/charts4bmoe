/**获取视图表格tr数据
 * 
 * @param  {Array} trDatas tr数据数组[{innerHTML:"html", link:"http://sss.com"},...]
 */
function genTrLIst(trDatas){
  var tr = document.createElement("tr");
  trDatas.forEach(function(data){
    var td = document.createElement("td");
    if(!!data.link){
      var a = document.createElement("a");
      a.innerHTML = data.innerHTML;
      a.target = "_blank";
      a.href = data.link;
      td.appendChild(a);
    }
    else td.innerHTML = data.innerHTML!==undefined ? data.innerHTML : "";
    tr.appendChild(td);
  });
  return tr;
}