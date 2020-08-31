var lineBreakRegex=/\r?\n/g;
var itemSeparatorRegex=/[\t ,]/g;
window.onload=function (){
  console.clear();
  dg('input').onkeydown=handlekey;
  dg('input').onfocus=handlekey;
  dg('input').onmousedown=handlekey;
  load();
  expandall();
}
function dg(s){
  return document.getElementById(s);
}
var calculatedMountains=null;
function parseSequenceElement(s,i){
  if (s.indexOf("v")==-1||!isFinite(Number(s.substring(s.indexOf("v")+1)))){
    var numval=Number(s);
    return {
      value:numval,
      position:i,
      parentIndex:-1
    };
  }else{
    return {
      value:Number(s.substring(0,s.indexOf("v"))),
      position:i,
      parentIndex:Math.max(Math.min(i-1,Number(s.substring(s.indexOf("v")+1))),-1),
      forcedParent:true
    };
  }
}
function calcMountain(s){
  //if (!/^(\d+,)*\d+$/.test(s)) throw Error("BAD");
  var lastLayer;
  if (typeof s=="string"){
    lastLayer=s.split(itemSeparatorRegex).map(parseSequenceElement);
  }
  else lastLayer=s;
  var calculatedMountain=[lastLayer]; //rows
  while (true){
    //assign parents
    var hasNextLayer=false;
    for (var i=0;i<lastLayer.length;i++){
      if (lastLayer[i].forcedParent) continue;
      var p;
      if (calculatedMountain.length==1){
        p=lastLayer[i].position+1;
      }else{
        p=0;
        while (calculatedMountain[calculatedMountain.length-2][p].position<lastLayer[i].position+1) p++;
      }
      while (true){
        if (p<0) break;
        var j;
        if (calculatedMountain.length==1){
          p--;
          j=p-1;
        }else{ //ignoring
          p=calculatedMountain[calculatedMountain.length-2][p].parentIndex;
          if (p<0) break;
          j=0;
          while (lastLayer[j].position<calculatedMountain[calculatedMountain.length-2][p].position-1) j++;
        }
        if (j<0||j<lastLayer.length-1&&lastLayer[j].position+1!=lastLayer[j+1].position) break;
        if (lastLayer[j].value<lastLayer[i].value){
          lastLayer[i].parentIndex=j;
          hasNextLayer=true;
          break;
        }
      }
    }
    if (!hasNextLayer) break;
    var currentLayer=[];
    calculatedMountain.push(currentLayer);
    for (var i=0;i<lastLayer.length;i++){
      if (lastLayer[i].parentIndex!=-1){
        currentLayer.push({value:lastLayer[i].value-lastLayer[lastLayer[i].parentIndex].value,position:lastLayer[i].position-1,parentIndex:-1});
      }
    }
    lastLayer=currentLayer;
  }
  return calculatedMountain;
}
function calcDiagonal(mountain){
  var diagonal=[];
  var diagonalTree=[];
  for (var i=0;i<mountain[0].length;i++){ //only one diagonal exists for each left-side-up diagonal line
    for (var j=mountain.length-1;j>=0;j--){ //prioritize the top
      var k=0;
      while (mountain[j][k]&&mountain[j][k].position+j<i) k++;
      if (!mountain[j][k]||mountain[j][k].position+j!=i) continue;
      var height=j;
      var lastIndex=k;
      while (true){
        if (height==0){
          lastIndex=mountain[height][lastIndex].parentIndex;
        }else{
          var l=0; //find right-down
          while (mountain[height-1][l].position!=mountain[height][lastIndex].position+1) l++;
          l=mountain[height-1][l].parentIndex; //go to its parent=left-down
          var m=0; //find up-left of that=left
          while (mountain[height][m].position<mountain[height-1][m].position-1) m++;
          if (mountain[height][m].position==mountain[height-1][m].position-1){ //left exists
            lastIndex=m;
          }else{
            height--;
            lastIndex=l;
          }
        }
        if (!mountain[height][lastIndex]||mountain[height][lastIndex].parentIndex==-1){
          diagonal.push(mountain[j][k].value);
          diagonalTree.push(lastIndex+height);
          break;
        }
      }
      break;
    }
  }
  var pw=[];
  for (var i=0;i<diagonal.length;i++){
    var p=-1;
    for (var j=i-1;j>=0;j--){
      if (diagonal[j]<diagonal[i]){
        p=j;
        break;
      }
    }
    pw.push(p);
  }
  var r=[];
  for (var i=0;i<diagonal.length;i++){
    var p=i;
    while (true){
      p=diagonalTree[p];
      if (p<0||diagonal[p]<diagonal[i]) break;
    }
    if (p==pw[i]) r.push(diagonal[i]);
    else r.push(diagonal[i]+"v"+p);
  }
  console.log(diagonalTree);
  return r.join(",");
}
function cloneMountain(mountain){
  var newMountain=[];
  for (var i=0;i<mountain.length;i++){
    var layer=[];
    for (var j=0;j<mountain[i].length;j++){
      layer.push({
        value:mountain[i][j].value,
        position:mountain[i][j].position,
        parentIndex:mountain[i][j].parentIndex,
        forcedParent:mountain[i][j].forcedParent
      });
    }
    newMountain.push(layer);
  }
  return newMountain;
}
function getBadRoot(s){
  var mountain;
  if (typeof s=="string") mountain=calcMountain(s);
  else mountain=cloneMountain(s);
  var diagonal=calcMountain(calcDiagonal(mountain));
  if (diagonal[0][diagonal[0].length-1].value!=1){
    return getBadRoot(diagonal);
  }else{
    for (var i=mountain.length-1;i>=0;i--){
      if (mountain[i][mountain[i].length-1].position+i==mountain[0].length-1) return mountain[i-1][mountain[i-1][mountain[i-1].length-1].parentIndex].position+i-1;
    }
  }
}
function expand(s,n,stringify){
  var mountain;
  if (typeof s=="string") mountain=calcMountain(s);
  else mountain=cloneMountain(s);
  var result=cloneMountain(mountain);
  if (mountain[0][mountain[0].length-1].parentIndex==-1){
    result[0].pop();
  }else{
    var result=cloneMountain(mountain);
    var cutHeight=mountain.length-1;
    while (mountain[cutHeight][mountain[cutHeight].length-1].position+cutHeight!=mountain[0].length-1) cutHeight--;
    var actualCutHeight=cutHeight;
    var badRootSeam=getBadRoot(mountain);
    var badRootHeight;
    var diagonal=calcMountain(calcDiagonal(mountain));
    var newDiagonal;
    var yamakazi=diagonal[0][diagonal[0].length-1].value==1; //Yamakazi-Funka dualilty
    if (yamakazi){
      newDiagonal=cloneMountain(diagonal);
      newDiagonal[0].pop();
      for (var i=0;i<n;i++){
        for (var j=badRootSeam;j<mountain[0].length-1;j++){
          newDiagonal[0].push(newDiagonal[0][j]); //who cares about mountains in diagonal?
        }
      }
      cutHeight--;
      badRootHeight=cutHeight;
    }else{
      newDiagonal=expand(diagonal,n,false);
      badRootHeight=mountain.length-1;
      while (true){
        var i=0;
        while (mountain[badRootHeight][i]&&mountain[badRootHeight][i].position+badRootHeight<badRootSeam) i++;
        if (mountain[badRootHeight][i]&&mountain[badRootHeight][i].position+badRootHeight==badRootSeam) break;
        badRootHeight--;
      }
    }
    for (var i=0;i<=actualCutHeight;i++) result[i].pop(); //cut child
    var afterCutHeight=result.length;
    var afterCutMountain=cloneMountain(result);
    //Create Mt.Fuji shell
    for (var i=1;i<=n;i++){ //iteration
      for (var j=0;j<badRootHeight+(cutHeight-badRootHeight)*(i+!yamakazi)+(afterCutHeight-cutHeight);j++){ //height
        //alert(j)
        if (!result[j]) result.push([]);
        if (j<badRootHeight){ //Bb
          var sourceHeight=j;
          var workLayer=mountain[sourceHeight];
          var cutWorkLayer=afterCutMountain[sourceHeight];
          var badRootIndex=0;
          while (workLayer[badRootIndex]&&workLayer[badRootIndex].position+sourceHeight<badRootSeam) badRootIndex++;
          var k=badRootIndex;
          while (k<cutWorkLayer.length){
            var sourceParentIndex=workLayer[k].position+sourceHeight==badRootSeam?workLayer[workLayer.length-1].parentIndex:workLayer[k].parentIndex;
            var parentShifts=workLayer[k].position+sourceHeight==badRootSeam?i-1:i;
            var parentPosition=workLayer[sourceParentIndex]?workLayer[sourceParentIndex].position+parentShifts*(afterCutMountain[0].length-badRootSeam)*Boolean(workLayer[sourceParentIndex].position+sourceHeight>=badRootSeam)-(j-sourceHeight):-1;
            var parentIndex=0;
            while (result[j][parentIndex]&&result[j][parentIndex].position<parentPosition) parentIndex++;
            if (!result[j][parentIndex]||result[j][parentIndex].position!=parentPosition) parentIndex=-1;
            result[j].push({
              value:parentIndex==-1?newDiagonal[0][workLayer[k].position+(afterCutMountain[0].length-badRootSeam)*i-(j-sourceHeight)+j].value:NaN,
              position:workLayer[k].position+(afterCutMountain[0].length-badRootSeam)*i-(j-sourceHeight),
              parentIndex:parentIndex,
              forcedParent:workLayer[k].forcedParent
            });
            k++;
          }
        }else if (j<=badRootHeight+(cutHeight-badRootHeight)*i){ //Br
          var sourceHeight=badRootHeight;
          var workLayer=mountain[sourceHeight];
          var cutWorkLayer=afterCutMountain[sourceHeight];
          var badRootIndex=0;
          while (workLayer[badRootIndex]&&workLayer[badRootIndex].position+sourceHeight<badRootSeam) badRootIndex++;
          var k=badRootIndex;
          //alert(k+" "+afterCutMountain[j].length)
          while (k<cutWorkLayer.length){
            if (!yamakazi&&workLayer[k].position+sourceHeight==badRootSeam&&j>(cutHeight-badRootHeight)*(i-1)+badRootHeight){
              var sourceParentIndex=mountain[j-(cutHeight-badRootHeight)*(i-1)][mountain[j-(cutHeight-badRootHeight)*(i-1)].length-1].parentIndex;
              var parentShifts=i-1;
              var parentPosition=mountain[j-(cutHeight-badRootHeight)*(i-1)][sourceParentIndex]?mountain[j-(cutHeight-badRootHeight)*(i-1)][sourceParentIndex].position+parentShifts*(afterCutMountain[0].length-badRootSeam)-(cutHeight-badRootHeight)*(i-1):-1;
              var parentIndex=0;
              while (result[j][parentIndex]&&result[j][parentIndex].position<parentPosition) parentIndex++;
              /*if (j==5){
                alert(mountain[j-(cutHeight-badRootHeight)*(i-1)][mountain[j-(cutHeight-badRootHeight)*(i-1)].length-1].position+(afterCutMountain[0].length-badRootSeam)*(i-1)-(cutHeight-badRootHeight)*(i-1));
                alert(parentPosition);
                alert(parentIndex);
              }*/
              if (!result[j][parentIndex]||result[j][parentIndex].position!=parentPosition) parentIndex=-1;
              result[j].push({
                value:parentIndex==-1?newDiagonal[0][mountain[j-(cutHeight-badRootHeight)*(i-1)][mountain[j-(cutHeight-badRootHeight)*(i-1)].length-1].position+(afterCutMountain[0].length-badRootSeam)*(i-1)-(cutHeight-badRootHeight)*(i-1)+j].value:NaN,
                position:mountain[j-(cutHeight-badRootHeight)*(i-1)][mountain[j-(cutHeight-badRootHeight)*(i-1)].length-1].position+(afterCutMountain[0].length-badRootSeam)*(i-1)-(cutHeight-badRootHeight)*(i-1),
                parentIndex:parentIndex,
                forcedParent:workLayer[k].forcedParent
              });
            }else{
              var sourceParentIndex=workLayer[k].position+sourceHeight==badRootSeam?yamakazi?workLayer[workLayer[workLayer.length-1].parentIndex].parentIndex:j==badRootHeight+(cutHeight-badRootHeight)*i?-1:workLayer[workLayer.length-1].parentIndex:workLayer[k].parentIndex;
              var parentShifts=workLayer[k].position+sourceHeight==badRootSeam?i-1:i;
              var parentPosition=workLayer[sourceParentIndex]?workLayer[sourceParentIndex].position+parentShifts*(afterCutMountain[0].length-badRootSeam)*Boolean(workLayer[sourceParentIndex].position+sourceHeight>=badRootSeam)-(j-sourceHeight):-1;
              var parentIndex=0;
              while (result[j][parentIndex]&&result[j][parentIndex].position<parentPosition) parentIndex++;
              if (!result[j][parentIndex]||result[j][parentIndex].position!=parentPosition) parentIndex=-1;
              result[j].push({
                value:parentIndex==-1?newDiagonal[0][workLayer[k].position+(afterCutMountain[0].length-badRootSeam)*i-(j-sourceHeight)+j].value:NaN,
                position:workLayer[k].position+(afterCutMountain[0].length-badRootSeam)*i-(j-sourceHeight),
                parentIndex:parentIndex,
                forcedParent:workLayer[k].forcedParent
              });
            }
            k++;
          }
        }else{ //Be
          var sourceHeight=j-(cutHeight-badRootHeight)*i;
          var workLayer=mountain[sourceHeight];
          var cutWorkLayer=afterCutMountain[sourceHeight];
          var badRootIndex=0;
          while (workLayer[badRootIndex]&&workLayer[badRootIndex].position+sourceHeight<badRootSeam) badRootIndex++;
          var k=badRootIndex;
          //alert(k+" "+afterCutMountain[j].length)
          while (k<cutWorkLayer.length){
            var sourceParentIndex=/*workLayer[k].position+sourceHeight==badRootSeam?yamakazi?workLayer[workLayer[workLayer.length-1].parentIndex].parentIndex:workLayer[workLayer.length-1].parentIndex:*/workLayer[k].parentIndex;
            var parentShifts=/*workLayer[k].position+sourceHeight==badRootSeam?i-1:*/i;
            var parentPosition=workLayer[sourceParentIndex]?workLayer[sourceParentIndex].position+parentShifts*(afterCutMountain[0].length-badRootSeam)*Boolean(workLayer[sourceParentIndex].position+sourceHeight>=badRootSeam)-(j-sourceHeight):-1;
            var parentIndex=0;
            while (result[j][parentIndex]&&result[j][parentIndex].position<parentPosition) parentIndex++;
            if (!result[j][parentIndex]||result[j][parentIndex].position!=parentPosition) parentIndex=-1;
            result[j].push({
              value:parentIndex==-1?newDiagonal[0][workLayer[k].position+(afterCutMountain[0].length-badRootSeam)*i-(j-sourceHeight)+j].value:NaN,
              position:workLayer[k].position+(afterCutMountain[0].length-badRootSeam)*i-(j-sourceHeight),
              parentIndex:parentIndex,
              forcedParent:workLayer[k].forcedParent
            });
            k++;
          }
        }
      }
    }
  }
  //Build number from ltr, ttb
  for (var i=result.length-1;i>=0;i--){
    if (!result[i].length){
      result.pop();
      continue;
    }
    for (var j=0;j<result[i].length;j++){
      if (!isNaN(result[i][j].value)) continue;
      var k=0; //find left-up
      while (result[i+1][k].position<result[i][j].position-1) k++;
      result[i][j].value=result[i][result[i][j].parentIndex].value+result[i+1][k].value;
    }
  }
  var rr;
  if (stringify){
    rr=[];
    for (var i=0;result[0]&&i<result[0].length;i++){
      rr.push(result[0][i].value+(result[0].forcedParent?"v"+result[0].parentIndex:""));
    }
    rr=rr.join(",");
  }else{
    rr=result;
  }
  return rr;
}
var input="";
var inputn=3;
function expandall(){
  if (input==dg("input").value&&inputn==Math.min(dg("inputn").value,10)) return;
  input=dg("input").value;
  inputn=Math.min(dg("inputn").value,10);
  dg("output").value=input.split(lineBreakRegex).map(e=>expand(e,inputn,true)).join("\n");
}
window.onpopstate=function (e){
  load();
  expandall();
}
function saveSimple(clipboard){
  var encodedInput=input.split(lineBreakRegex).map(e=>e.split(itemSeparatorRegex).map(parseSequenceElement).map(e=>e.forcedParent?e.value+"v"+e.parentIndex:e.value)).join(";");
  history.pushState(encodedInput,"","?"+encodedInput);
  if (clipboard){
    var copyarea=dg("copyarea");
    copyarea.value=location.href;
    copyarea.style.display="";
    copyarea.select();
    copyarea.setSelectionRange(0,99999);
    document.execCommand("copy");
    copyarea.style.display="none";
  }
}
function saveDetailed(clipboard){
  var state={};
  for (var i of options){
    state[i]=window[i];
  }
  var encodedState=btoa(JSON.stringify(state)).replace(/\+/g,"-").replace(/\//g,"_").replace(/\=/g,"");
  history.pushState(state,"","?"+encodedState);
  if (clipboard){
    var copyarea=dg("copyarea");
    copyarea.value=location.href;
    copyarea.style.display="";
    copyarea.select();
    copyarea.setSelectionRange(0,99999);
    document.execCommand("copy");
    copyarea.style.display="none";
  }
}
function load(){
  var encodedState=location.search.substring(1);
  if (!encodedState) return;
  try{
    var state=encodedState.replace(/\-/g,"+").replace(/_/g,"/");
    if (state.length%4) state+="=".repeat(4-state.length%4);
    state=JSON.parse(atob(state));
  }catch (e){ //simple
    var input=encodedState.replace(/;/g,"\r\n");
    dg("input").value=input;
  }finally{ //detailed
    console.log(state);
    for (var i of options){
      if (state[i]) dg(i).value=state[i];
    }
  }
}
var handlekey=function(e){
  setTimeout(expandall,0,true);
}
//console.log=function (s){alert(s)};
window.onerror=function (e,s,l,c,o){alert(JSON.stringify(e+"\n"+s+":"+l+":"+c+"\n"+o.stack))}