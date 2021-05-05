// 画像拡大はいったん捨てる
// document.querySelector('.image input').addEventListener('input',() => {
//     let ratio = document.querySelector('.image input').value;
//     document.querySelector('.image img').style.transform = "scale(" + ratio + ", " + ratio + ")";
//     console.log(document.querySelector('.image img'));
//     console.log(ratio);
// })

// URLの定義
var KEY = 'AIzaSyAAYebjirqRPCo3tkhJYWOEeMzt5IM9Bt4';
// ここは人によって変わる
var url = 'https://vision.googleapis.com/v1/images:annotate?key=';
var api_url = url + KEY;

// 画像をbase64に変換
const readFile = (file) => {
  let reader = new FileReader();
  // 画像をオブジェクトからURLに書きかえる
  reader.readAsDataURL(file);
  const promise = new Promise((resolve, reject) => {
    reader.onload = (event) => {
      // 画像表示を投稿されたものに変更
      // srcとするならURLをとる必要がある。（オブジェクトではだめ）
      // とれたのがここなので、いったんここで実装
      document.querySelector('.image img').src = event.target.result;
      resolve(event.target.result.replace(/^data:image\/(png|jpeg);base64,/, ''));
    };
  })
  return promise;
};

// リクエストを送信
const cvAPI = (base64string) => {
  let xhr = new XMLHttpRequest();
  xhr.open('POST', api_url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  // requestの作成
  // どういう情報を返してほしいのかを設定
  xhr.send(JSON.stringify({
    requests: [{
      "image": {
        content: base64string
      },
      "features": [
        {
          type: 'OBJECT_LOCALIZATION',
          maxResults: 10,
        },
        {
          type: 'SAFE_SEARCH_DETECTION',
          maxResults: 10,
        },
      ]
    }]
  }));
  // 送信
  const promise = new Promise((resolve, reject) => {
    xhr.onreadystatechange = () => {
      if (xhr.readyState != XMLHttpRequest.DONE) {
        return
      };
      if (xhr.status >= 400) {
        return reject({ message: `Failed with ${xhr.status}:${xhr.statusText}` })
      };
      resolve(JSON.parse(xhr.responseText));
    };
  })
  return promise;
}


// ファイルがinputされると起動
document.getElementById("img-input").addEventListener('input', event => {
  // document.getElementById('objectWrapper').remove();
  Array.from(document.getElementById('objectWrapper').childNodes).forEach(element => {
    element.remove();
  });
  Array.from(document.getElementById('objectTable').childNodes).forEach(element => {
    element.remove();
  });

  // ファイルが求めているものと違う場合ははじく
  if (!event.target.files || event.target.files.length == 0) {
    return
  };
  Promise.resolve(event.target.files[0])
    .then(readFile) // まず画像をbase64に変換
    .then(cvAPI) // 次にリクエストを送信
    .then(res => {
      console.log('SUCCESS!', res);
      let imageWidth = document.querySelector('.image img').clientWidth;
      let imageHeight = document.querySelector('.image img').clientHeight;
      display1(res, imageWidth, imageHeight);
      display2(res);
    })
    .catch(err => {
      console.log('FAILED:(', err);
    });
});

// tab1 オブジェクトの表示
function display1(response, imageWidth, imageHeight){
  let data = response.responses[0].localizedObjectAnnotations;
  let objectSvg = document.getElementById('objectWrapper');
  objectSvg.style.display = "block";
  // svgの枠を画像の表示サイズに合わせる
  objectSvg.setAttribute('width', imageWidth);
  objectSvg.setAttribute('height', imageHeight);

  // ◇◇画像上にオブジェクトを囲う枠を描画◇◇

  // // htmlを成形してぶち込む方法
  // let svgWrap = "";
  // for(let i = 0; i < data.length; i++){
  //   // オブジェクトを囲う4点の座標を取得
  //   let coodinate = {
  //     0: null,
  //     1: null,
  //     2: null,
  //     3: null,
  //   }
  //   for(let j = 0; j < 4; j++){
  //     coodinate[j] = data[i].boundingPoly.normalizedVertices[j];
  //   }
  //   // 線を引くpathを成形
  //   // JSONでの座標は割合で返ってきているので、表示上の画像サイズに掛けてpx座標にする
  //   svgWrap += '<path fill="none" stroke="#76FF03" d="M '
  //           + coodinate[0].x * imageWidth + ',' + coodinate[0].y * imageHeight
  //           + ' L ' + coodinate[1].x * imageWidth + ',' + coodinate[1].y * imageHeight
  //           + ' L ' + coodinate[2].x * imageWidth + ',' + coodinate[2].y * imageHeight
  //           + ' L ' + coodinate[3].x * imageWidth + ',' + coodinate[3].y * imageHeight
  //           + ' Z"></path>';
  // }
  // objectSvg.innerHTML += svgWrap;

  // jsの機能を使って簡潔に
  for(let i = 0; i < data.length; i++){
    let pathTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathTemplate.setAttribute('fill', 'none');
    pathTemplate.setAttribute('stroke', '#76FF03');
    pathTemplate.setAttribute('class', "object-path object-path-" + i)
    let coodinate = {
      0: null,
      1: null,
      2: null,
      3: null,
    }
    for(let j = 0; j < 4; j++){
      coodinate[j] = data[i].boundingPoly.normalizedVertices[j];
    }
    let pathLine = 'M ' + coodinate[0].x * imageWidth + ',' + coodinate[0].y * imageHeight
                + ' L ' + coodinate[1].x * imageWidth + ',' + coodinate[1].y * imageHeight
                + ' L ' + coodinate[2].x * imageWidth + ',' + coodinate[2].y * imageHeight
                + ' L ' + coodinate[3].x * imageWidth + ',' + coodinate[3].y * imageHeight
                + ' Z';
    pathTemplate.setAttribute('d', pathLine);
    objectSvg.appendChild(pathTemplate);
  }

  // ◇◇オブジェクトの名列を表示◇◇
  // 1列の表なのでgridで挿入
  // いったんホバーは後回し
  let tableBase = document.getElementById('objectTable');
  tableBase.style.display = "block";
  let tableTitle = document.createElement('div');
  tableTitle.classList.add('objectTable__title');
  tableTitle.innerHTML = "<p>Name</p><p>Score</p>";
  tableBase.appendChild(tableTitle);
  for(let i = 0; i < data.length; i++){
    let tableContent = document.createElement('div');
    let tableName = document.createElement('p');
    let tableScore = document.createElement('p');
    tableContent.classList.add('objectTable__content');
    tableContent.setAttribute('onmouseover', "borderEmphasis(" + i + ")");
    tableName.innerText = data[i].name;
    tableScore.innerText = data[i].score.toPrecision(3);
    tableContent.appendChild(tableName);
    tableContent.appendChild(tableScore);
    tableBase.appendChild(tableContent);
  }
}

function display2(response){
  let data = response.responses[0].safeSearchAnnotation;
  let i = 1;
  for(var content in data){
    document.querySelector('.result-tab__safesearch-list-text-title-' + i).innerText = content;
    document.querySelector('.result-tab__safesearch-list-text-result-' + i).innerText = data[content];
    let meterNum = safeSearchMeter(data[content]);
    for(let j = 1; j < meterNum + 1; j++){
      document.querySelector('.result-tab__safesearch-list-meter-tab-' + i + '-' + j).style.backgroundColor = "#90ee90";
    }
    i++;
  }
}

function borderEmphasis(classNum){
  Array.from(document.getElementsByClassName('object-path')).forEach(element => {
    element.classList.remove('active');
  })
  document.querySelector('.object-path-' + classNum).classList.add('active');
};

// フリック操作で結果タブの表示を切り替える
let resultTabNum = 1;
let touchCoodinateStart;
let touchCoodinateEnd;
document.getElementById('result').addEventListener('touchstart', (event) => {
  touchCoodinateStart = event.touches[0].pageX;
})
document.getElementById('result').addEventListener('touchmove', (event) => {
  touchCoodinateEnd = event.touches[0].pageX;
})
document.getElementById('result').addEventListener('touchend', () => {
  if(touchCoodinateStart - touchCoodinateEnd > 200){
    // 右に遷移
    if(resultTabNum < 2){
      resultTabNum += 1;
      resultTabJump(resultTabNum);
    }
  }
  else if(touchCoodinateEnd - touchCoodinateStart > 200){
    // 左に遷移
    if(resultTabNum > 1){
      resultTabNum -= 1;
      resultTabJump(resultTabNum);
    }
  }
  if(resultTabNum == 1){
    document.getElementById('objectWrapper').style.display = "block";
  }
  else{
    document.getElementById('objectWrapper').style.display = "none";
  }
  tabColor(resultTabNum);
})

function resultTabJump(tabNum){
  document.querySelectorAll('.result-tab').forEach(elememnt => {
    elememnt.style.display = 'none';
  })
  document.getElementById('result-tab-' + tabNum).style.display = 'block';
  // tab-listを押したときのジャンプでもフリックの遷移の数字と合うように
  resultTabNum = tabNum;
  if(resultTabNum == 1){
    document.getElementById('objectWrapper').style.display = "block";
  }
  else{
    document.getElementById('objectWrapper').style.display = "none";
  }
  tabColor(resultTabNum);
}

function tabColor(resultTabNum){
  document.querySelectorAll('.tab-list__content').forEach(element => {
    element.style.backgroundColor = "#ccc";
    element.style.fontWeight = "normal";
  })
  document.querySelectorAll('.tab-list__content')[resultTabNum - 1].style.backgroundColor = "#ff8";
  document.querySelectorAll('.tab-list__content')[resultTabNum - 1].style.fontWeight = "bold";
}

function safeSearchMeter(result){
  let resultNum = 0;
  if(result == "UNKNOWN"){
    resultNum = 0;
  }
  else if(result == "VERY_UNLIKELY"){
    resultNum = 1;
  }
  else if(result == "UNLIKELY"){
    resultNum = 2;
  }
  else if(result == "POSSIBLE"){
    resultNum = 3;
  }
  else if(result == "LIKELY"){
    resultNum = 4;
  }
  else if(result == "VERY_LIKELY"){
    resultNum = 5;
  }
  else{
    resultNum = 0;
  }
  return resultNum;
}