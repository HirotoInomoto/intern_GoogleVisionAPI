'use strict';

//sendContent()の中に入れる予定のものを以下に書く、つまりイベントは効いているものとして考えてよし。
const objectsBtn = document.getElementById('objects-btn');
const safeSearchBtn = document.getElementById('safe-search-btn');
const objectsResults = document.getElementById('objects-results');
const safeSearchResults = document.getElementById('safe-search-results');

//クリック時のボタンの表示切り替え用の関数
objectsBtn.onclick = function () {
  if (objectsBtn.className === 'objects-btn2') {
    //objects-btnが灰色の時にクリックが発生したら、safe-search-btnの色を灰色にsafeSearchResult非表示。
    //加えてobjects-btnの色を黄色に(classNameをトリガーにしてるのでクラス名切り替え),objectsResultsを表示。
    safeSearchResults.style.display = 'none';
    objectsResults.style.display = 'block';
    objectsBtn.className = 'objects-btn';
    safeSearchBtn.className = 'safe-search-btn';
  }
}
safeSearchBtn.onclick = function () {
  if (safeSearchBtn.className === 'safe-search-btn') {
    //safe-search-btnが灰色の時にクリックが発生したら、objects-btnの色を灰色にobjectsResults非表示。
    //加えてsafeSearchResultの色を黄色に(classNameをトリガーにしてるのでクラス名切り替え),safeSearchResultを表示。
    objectsResults.style.display = 'none';
    safeSearchResults.style.display = 'block';
    safeSearchBtn.className = 'safe-search-btn2';
    objectsBtn.className = 'objects-btn2';
  }
}

setSwipe('.safe-search-results')//スワイプしたらボタン切り替えと結果の表示切り替え　後ろで定義
setSwipe('.objects-results')

//ボタン切り替え終了






//イメージタグの取得
const input = document.getElementById("input");
//ファイルリーダーインスタンス生成
const reader = new FileReader();


//インプットタグのイベント設定＝ファイルの取得とbase64エンコード処理
input.addEventListener('change', function () {
  const file = document.getElementById("input").files[0]; //ファイルリーダーで読み込むファイル取得
  //readerが読み込み(load)をするたびに、以下の操作を実行。(実行の順番は最後)
  reader.onload = function () {
    //検出したオブジェクトの枠線に用いている全てのdivを消去(全ての結果反映処理より前に実行したいのでできるだけ前置)
    while(document.getElementById('divdiv').lastChild){
      document.getElementById('divdiv').removeChild(document.getElementById('divdiv').lastChild);
    }
    const readerResult = reader.result;//DataURL形式　文字列を格納
    const base64EncodedFile = readerResult.replace(/data:.*\/.*;base64,/, '');
    //通信処理の実行 と受け取った後の処理　後ろで定義
    sendContent(base64EncodedFile)
    //写真の入れ替え。
    document.getElementById('changing-img').src = readerResult;
  }
  //readAsDataURLでファイル読みこみ、DataURL形式にする。以下の操作実行後にreader.onload起動。
  reader.readAsDataURL(file);
  //GoogleVisionAPIに渡すリクエストの定義　contentにbase64エンコードしたものを入れ込む。
}, false)



//ここから関数定義
//通信全般の処理を関数で定義
function sendContent(content) {
  const requestFile = {
    "requests": [
      {
        "image": {
          "content": content
        },
        "features": [
          {
            "maxResults": 10,
            "type": "OBJECT_LOCALIZATION"
          }, {
            "maxResults": 10,
            "type": "SAFE_SEARCH_DETECTION"
          }

        ]
      }
    ]
  };
  //JavaScript内で有効なJSONっぽい文字列をJSON形式に変換。
  const lastRequest = JSON.stringify(requestFile);
  //通信の開始
  const request = new XMLHttpRequest();
  request.open("POST", "https://vision.googleapis.com/v1/images:annotate?key=" + KEY);
  //response.responsetype='json'でparseされる。
  request.responseType = 'json';
  request.send(lastRequest);
//結果受信後の処理
  request.onload = function () {
    const serverResponse = request.response;
    console.log(serverResponse);
    //sereverResponseから必要な情報の取得
    const versace = serverResponse.responses;
    const hyun = versace['0'];//.0で表記すると０が数字判定されて取り出し不可。
    console.log(hyun.safeSearchAnnotation);
  
    //safesearchannotaionの結果をメータに表示
    safeAnnotation('adult', 1)
    safeAnnotation('medical', 2)
    safeAnnotation('racy', 3)
    safeAnnotation('spoof', 4)
    safeAnnotation('violence', 5)
    //メーターに反映終了


    //以下、localizedobjectAnnotationsの出力関連全般

    //前の表示を消去して、表の１行目を作成
    while (objectsResults.lastChild) {
      objectsResults.removeChild(objectsResults.lastChild);
    }
    const firstDiv = document.createElement('div');
    objectsResults.appendChild(firstDiv);
    const firstParagraph = document.createElement('p');
    firstParagraph.textContent = 'Name';
    const secondParagraph = document.createElement('p');
    secondParagraph.textContent = 'Score';
    firstDiv.appendChild(firstParagraph);
    firstDiv.appendChild(secondParagraph);

    const flyTecc = hyun.localizedObjectAnnotations;
    ////localizedobjectAnnotationsの出力開始
    for (const key in flyTecc) {
      //フレックス効かせるためのdivタグ作成　objects-resultsの子要素に追加
      var wrapTag = document.createElement('div');
      objectsResults.appendChild(wrapTag);

      var contentParagraph1 = document.createElement('p');
      var contentParagraph2 = document.createElement('p');
      contentParagraph1.textContent = flyTecc[key]['name'];
      contentParagraph2.textContent = flyTecc[key]['score'];
      wrapTag.appendChild(contentParagraph1);
      wrapTag.appendChild(contentParagraph2);
    }
    //写真上描画処理が以下
    //描画開始
    for (const key in flyTecc) {
      //描画に必要な数値を変数格納
      const imageHeight = document.getElementById('changing-img').height;
      const imageWidth = document.getElementById('changing-img').width;
      const soulAir = flyTecc[key]['boundingPoly']['normalizedVertices'];//normalizedVerticesを格納
      //描画用のdivの作成と挿入
      const rectDiv=document.createElement('div');
      document.getElementById('divdiv').appendChild(rectDiv);
      //rectDivの大きさを写真に合わせる。
      document.getElementById('divdiv').style.height = `${imageHeight}px`;
      document.getElementById('divdiv').style.width = `${imageWidth}px`;

      var X1 = imageWidth * soulAir['0']['x'];
      var Y1 = imageHeight * soulAir['0']['y'];
      var X2 = imageWidth * soulAir['1']['x'];;
      var Y2 = imageHeight * soulAir['2']['y'];

      //APIが座標を返さない時は0を代入
      if (!soulAir['0']['x']) {
        X1 =0;
      }
      if (!soulAir['0']['y']) {
        Y1=0;
      }
      if (!soulAir['1']['x']) {
        X2=0;
      }
      if (!soulAir['2']['y']) {
        Y2=0;
      }
      //作るdivの高さと広さを定義
      const rectHeight=Y2-Y1;
      const rectWidth=X2-X1;
      //各数値代入
      rectDiv.style.top=`${Y1}px`;
      rectDiv.style.left=`${X1}px`;
      rectDiv.style.width=`${rectWidth}px`;
      rectDiv.style.height=`${rectHeight}px`;

      // //localizedobjectAnnotationsの出力関連全般 終了

    }
    //メーター表示のためのsafeannottation関数の定義 繰り返し使うので関数として定義する。
    function safeAnnotation(plug, index) {
      const sort = hyun.safeSearchAnnotation[plug];
      const insertText = document.getElementById(`insert-text${index}`);
      switch (sort) {
        case 'VERY_UNLIKELY':
          var veryUnlikely1 = document.getElementById(`parameter${index}1`);
          var veryUnlikely2 = document.getElementById(`parameter${index}2`);
          var veryUnlikely3 = document.getElementById(`parameter${index}3`);
          var veryUnlikely4 = document.getElementById(`parameter${index}4`);
          var veryUnlikely5 = document.getElementById(`parameter${index}5`);
          veryUnlikely1.className = 'on-parameter';
          veryUnlikely2.className = 'parameter';
          veryUnlikely3.className = 'parameter';
          veryUnlikely4.className = 'parameter';
          veryUnlikely5.className = 'parameter';
          insertText.textContent = sort;
          break;
        case 'UNLIKELY':
          var Unlikely1 = document.getElementById(`parameter${index}1`);
          var Unlikely2 = document.getElementById(`parameter${index}2`);
          var Unlikely3 = document.getElementById(`parameter${index}3`);
          var Unlikely4 = document.getElementById(`parameter${index}4`);
          var Unlikely5 = document.getElementById(`parameter${index}5`);
          Unlikely1.className = 'on-parameter';
          Unlikely2.className = 'on-parameter';
          Unlikely3.className = 'parameter';
          Unlikely4.className = 'parameter';
          Unlikely5.className = 'parameter';
          insertText.textContent = sort;
          break;
        case 'POSSIBLE':
          var POSSIBLE1 = document.getElementById(`parameter${index}1`);
          var POSSIBLE2 = document.getElementById(`parameter${index}2`);
          var POSSIBLE3 = document.getElementById(`parameter${index}3`);
          var POSSIBLE4 = document.getElementById(`parameter${index}4`);
          var POSSIBLE5 = document.getElementById(`parameter${index}5`);
          POSSIBLE1.className = 'on-parameter';
          POSSIBLE2.className = 'on-parameter';
          POSSIBLE3.className = 'on-parameter';
          POSSIBLE4.className = 'parameter';
          POSSIBLE5.className = 'parameter';
          insertText.textContent = sort;
          break;

        case 'LIKELY':
          const LIKELY1 = document.getElementById(`parameter${index}1`);
          const LIKELY2 = document.getElementById(`parameter${index}2`);
          const LIKELY3 = document.getElementById(`parameter${index}3`);
          const LIKELY4 = document.getElementById(`parameter${index}4`);
          const LIKELY5 = document.getElementById(`parameter${index}5`);
          LIKELY1.className = 'on-parameter';
          LIKELY2.className = 'on-parameter';
          LIKELY3.className = 'on-parameter';
          LIKELY4.className = 'on-parameter';
          LIKELY5.className = 'parameter';
          insertText.textContent = sort;
          break;
        case 'VERY_LIKELY':
          var VERY_LIKELY1 = document.getElementById(`parameter${index}1`);
          var VERY_LIKELY2 = document.getElementById(`parameter${index}2`);
          var VERY_LIKELY3 = document.getElementById(`parameter${index}3`);
          var VERY_LIKELY4 = document.getElementById(`parameter${index}4`);
          var VERY_LIKELY5 = document.getElementById(`parameter${index}5`);
          VERY_LIKELY1.className = 'on-parameter';
          VERY_LIKELY2.className = 'on-parameter';
          VERY_LIKELY3.className = 'on-parameter';
          VERY_LIKELY4.className = 'on-parameter';
          VERY_LIKELY5.className = 'on-parameter';
          insertText.textContent = sort;
          break;
        default:
          var UNKOWN1 = document.getElementById(`parameter${index}1`);
          var UNKOWN2 = document.getElementById(`parameter${index}2`);
          var UNKOWN3 = document.getElementById(`parameter${index}3`);
          var UNKOWN4 = document.getElementById(`parameter${index}4`);
          var UNKOWN5 = document.getElementById(`parameter${index}5`);
          UNKOWN1.className = 'parameter';
          UNKOWN2.className = 'parameter';
          UNKOWN3.className = 'parameter';
          UNKOWN4.className = 'parameter';
          UNKOWN5.className = 'parameter';
          insertText.textContent = sort;
          break;
      }

    }

  }
}
//スワイプでのボタと表示の切り替えの関数
function setSwipe(elem) {
  let t = document.querySelector(elem);
  let startX;        // タッチ開始 x座標
  let startY;        // タッチ開始 y座標
  let moveX;    // スワイプ中の x座標
  let moveY;    // スワイプ中の y座標
  let dist = 30;    // スワイプを感知する最低距離（ピクセル単位）
   
  // タッチ開始時： xy座標を取得
  t.addEventListener("touchstart", function(e) {
      e.preventDefault();
      startX = e.touches[0].pageX;
      startY = e.touches[0].pageY;
  });
   
  // スワイプ中： xy座標を取得
  t.addEventListener("touchmove", function(e) {
      e.preventDefault();
      moveX = e.changedTouches[0].pageX;
      moveY = e.changedTouches[0].pageY;
  });
   
  // タッチ終了時： スワイプした距離から左右どちらにスワイプしたかを判定する/距離が短い場合何もしない
  t.addEventListener("touchend", function(e) {
      if (startX > moveX && startX > moveX + dist) {        // 右から左にスワイプ
        objectsResults.style.display = 'none';// 右から左にスワイプした時の処理
        safeSearchResults.style.display = 'block';
        safeSearchBtn.className = 'safe-search-btn2';
        objectsBtn.className = 'objects-btn2';
      }
      else if (startX < moveX && startX + dist < moveX) {    // 左から右にスワイプ
        safeSearchResults.style.display = 'none';// 左から右にスワイプした時の処理
        objectsResults.style.display = 'block';
        objectsBtn.className = 'objects-btn';
        safeSearchBtn.className = 'safe-search-btn'
      }
  });
}


//残骸コード　無念にも描画時に実装不可だった悲しきモンスター。何がいけなかったのか。
 // // canvasタグをmainの子要素として生成
      // const canvas = document.getElementById('canvas');


      // const context = canvas.getContext('2d');//描画時に必要なオブジェクト
      // //canvasタグのサイズをimgタグの大きさに合わせる
      // canvas.style.height = `${imageHeight}px`;
      // canvas.style.width = `${imageWidth}px`;
      // const soulAir = flyTecc[key]['boundingPoly']['normalizedVertices'];//後々使う変数
      // // 座標の数値を計算してそれを元に座標に入れるものを作成
      // const X1 = imageWidth * soulAir['0']['x'];
      // const Y1 = imageHeight * soulAir['0']['y'];
      // const X2 = imageWidth * soulAir['1']['x'];
      // const Y2 = imageHeight * soulAir['2']['y'];
      // const vectorX1 = `${X1}px`;
      // const vectorY1 = `${Y1}px`;
      // const vectorX2 = `${X2}px`;
      // const vectorY2 = `${Y2}px`;
      // console.log(X1);
      // //描画の開始
      // context.beginPath();
      // context.moveTo(X1, Y1);
      // context.lineTo(X2, Y1);
      // context.lineTo(X2, Y2);
      // context.lineTo(X1, Y2);
      // context.lineTo(X1, Y1);
      // context.strokeStyle = 'yellow';
      // context.lineWidth = 1;
      // context.stroke();





