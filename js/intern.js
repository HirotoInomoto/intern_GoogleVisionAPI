let url = "https://vision.googleapis.com/v1/images:annotate?key=";
let api_url = url + KEY;

function clickSwich() {
  "use strict";
  var isObject = 0; //現在地判定
  var btnObject = document.getElementById("tub-list1");
  var btnSafe = document.getElementById("tub-list2");
  var result1 = document.getElementById("result-tab-1");
  var result2 = document.getElementById("result-tab-2");

  function setState(isA) {
    btnObject.className = isObject == 0 ? "btn-inactive" : "btn";
    result1.className = isObject == 0 ? "boxDisplay" : "boxNone";
    btnSafe.className = isObject == 1 ? "btn-inactive" : "btn";
    result2.className = isObject == 1 ? "boxDisplay" : "boxNone";
  }
  setState(0);

  btnObject.addEventListener("click", function () {
    if (isObject == 0) return;
    isObject = 0;
    setState(0);
  });
  btnSafe.addEventListener("click", function () {
    if (isObject == 1) return;
    isObject = 1;
    setState(1);
  });
}
document.addEventListener("DOMContentLoaded", clickSwich, false);
//画像をbase64に変換して、urlに書き換え、画像表示を変更する。
//const image = document.querySelectorAll(".image-display img");
const readFile = document.getElementById("img-input").addEventListener(
  "change",
  function (e) {
    const input = document.getElementById("img-input").files[0];
    const reader = new FileReader();
    reader.addEventListener(
      "load",
      function (e) {
        document.getElementById("result").src = reader.result;
      },
      true
    );
    reader.readAsDataURL(input);
  },
  true
);
//リクエストを送信する。
//JSON型でAPIから画像データを受け取る
const cvAPI = document
  .getElementById("img-input")
  .addEventListener("change", function () {
    const input2 = document.getElementById("img-input").files[0];
    const reader2 = new FileReader();
    reader2.addEventListener("load", function (e) {
      let imgUrl = reader2.result;
      //余計な文字列を削除する。
      let imgUrlEncorded = imgUrl.replace(/data:.*\/.*;base64,/, "");
      let xhr = new XMLHttpRequest();
      xhr.open("POST", api_url, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.addEventListener(
        "load",
        function () {
          //ここが一番最後に実行される。
          console.log(xhr.response); //ここでAPIからのレスポンスを表示している。
          let responseJsOb = JSON.parse(xhr.response); //JSONをJSオブジェクト形式に変換した。
          console.log(responseJsOb);
          //data[content]を数値化する関数の定義
          function safeSearchMeter(result) {
            let resultNum = 0;
            if (result == "UNKNOWN") {
              resultNum = 0;
            } else if (result == "VERY_UNLIKELY") {
              resultNum = 1;
            } else if (result == "UNLIKELY") {
              resultNum = 2;
            } else if (result == "POSSIBLE") {
              resultNum = 3;
            } else if (result == "LIKELY") {
              resultNum = 4;
            } else if (result == "VERY_LIKELY") {
              resultNum = 5;
            } else {
              resultNum = 0;
            }
            return resultNum;
          }
          //メーターの表示
          let data = responseJsOb.responses[0].safeSearchAnnotation;
          let i = 1;
          for (var content in data) {
            document.querySelector(
              ".result-tab__safesearch-list-text-title-" + i
            ).innerText = content; //この部分がdataオブジェクトのkey
            document.querySelector(
              ".result-tab__safesearch-list-text-result-" + i
            ).innerText = data[content];
            let meterNum = safeSearchMeter(data[content]); //data[content]を数値化
            for (let j = 1; j < meterNum + 1; j++) {
              document.querySelector(
                ".result-tab__safesearch-list-meter-tab-" + i + "-" + j
              ).style.backgroundColor = "#90ee90";
            }
            i++;
          }
          //オブジェクト画面の表示
          let data2 = responseJsOb.responses[0].localizedObjectAnnotations;
          let objectSvg = document.getElementById("objectWrapper");
          objectSvg.style.display = "block";
          let imageWidth = document.querySelector("#result").clientWidth;
          let imageHeight = document.querySelector("#result").clientHeight;
          objectSvg.setAttribute("width", imageWidth);
          objectSvg.setAttribute("height", imageHeight);
          let tableBase = document.getElementById("objectTable");
          tableBase.style.display = "block";
          let tableTitle = document.createElement("div");
          tableTitle.classList.add("objectTable__title");
          tableTitle.innerHTML = "<p>Name</p><p>Score</p>";
          tableBase.appendChild(tableTitle); //'TableBase'の子要素に、今作ったtableTitleをいれた。
          for (let i = 0; i < data2.length; i++) {
            let tableContent = document.createElement("div");
            let tableName = document.createElement("p");
            let tableScore = document.createElement("p");
            tableContent.classList.add("objectTable__content");
            tableName.innerText = data2[i].name;
            console.log(data2[i].name);
            tableScore.innerText = data2[i].score.toPrecision(3);
            tableContent.appendChild(tableName); //ここで階層構造を作る
            tableContent.appendChild(tableScore);
            tableBase.appendChild(tableContent);
          }
          //画像の中で検出されたobjectの枠を表示させる
          let svgBorder = "";
          for (let i = 0; i < data2.length; i++) {
            let coodinate = {
              0: null,
              1: null,
              2: null,
              3: null,
            };
            for (let j = 0; j < 4; j++) {
              coodinate[j] = data2[i].boundingPoly.normalizedVertices[j];
            }
            svgBorder +=
              '<path fill="none" stroke="#76FF03" d="M' +
              coodinate[0].x * imageWidth +
              "," +
              coodinate[0].y * imageHeight +
              "L" +
              coodinate[1].x * imageWidth +
              "," +
              coodinate[1].y * imageHeight +
              "L" +
              coodinate[2].x * imageWidth +
              "," +
              coodinate[2].y * imageHeight +
              "L" +
              coodinate[3].x * imageWidth +
              "," +
              coodinate[3].y * imageHeight +
              'Z"></path>'; //APIから帰ってくる座標は画像の縦横を1とした場合の割合なので、画像の縦横の長座を掛ければpxで座標がでる。
          }
          objectSvg.innerHTML += svgBorder;
        },
        xhr.send(
          JSON.stringify({
            requests: [
              {
                image: {
                  content: imgUrlEncorded, //fileReaderで読み込んだものをDataURL化したものを代入している。
                },
                features: [
                  {
                    maxResults: 10,
                    type: "OBJECT_LOCALIZATION",
                  },
                  {
                    maxResults: 10,
                    type: "SAFE_SEARCH_DETECTION",
                  },
                ],
              },
            ],
          })
        )
      );
    });
    reader2.readAsDataURL(input2);
  });
//画像の中に枠を表示する
//オブジェクト画面を表示
