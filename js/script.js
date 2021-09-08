'use strict'

var url = 'https://vision.googleapis.com/v1/images:annotate?key='
var api_url = url + KEY

const showObjects = () =>{
  document.getElementById('objects').classList.remove("none");
  document.getElementById('safe-search').classList.add("none");
}

const showSafeSearch = () =>{
  document.getElementById('objects').classList.add("none");
  document.getElementById('safe-search').classList.remove("none");
}

document.getElementById('result_objects').onclick = showObjects;
document.getElementById('result_safe-search').onclick = showSafeSearch;

document.getElementById("objects").addEventListener('touchmove', showSafeSearch);
document.getElementById("safe-search").addEventListener('touchmove', showObjects);

const sendAPI = (base64string) => {
  let requests = {
    requests: [
      {image: {content: base64string}, features: [{type: 'OBJECT_LOCALIZATION'},{'type': 'SAFE_SEARCH_DETECTION'}]}
    ]
  };
  let xhr = new XMLHttpRequest();
  xhr.open('POST', api_url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  const promise = new Promise((resolve, reject) => {
    xhr.onreadystatechange = () => {
      if (xhr.readyState != XMLHttpRequest.DONE) return;
      if (xhr.status >= 400) return reject({message: `Failed with ${xhr.status}:${xhr.statusText}`});
      resolve(JSON.parse(xhr.responseText));
    };
  })
  xhr.send(JSON.stringify(requests));
  return promise;
}

const readFile = (file) => {
  let reader = new FileReader();
  const promise = new Promise((resolve, reject) => {
    reader.onload = (ev) => {
      document.getElementById('upload_img').setAttribute('src', ev.target.result);
      resolve(ev.target.result.replace(/^data:image\/(png|jpeg);base64,/, ''));
    };
  })
  reader.readAsDataURL(file);
  return promise;
};

document.getElementById('input').addEventListener('change', ev => {
  if (!ev.target.files || ev.target.files.length == 0) return;
  Promise.resolve(ev.target.files[0])
    .then(readFile)
    .then(sendAPI)
    .then(res => {
      console.log('SUCCESS!', res);
      removeTable();
      removeLines();
      addTable(res);
      writeSquare(res);
      showChart(res);
    })
    .catch(err => {
      console.log('FAILED:(', err);
      window.alert('FAILED');
    }
  );
});

const addTable = (res) => {
  let responses =  res.responses[0].localizedObjectAnnotations
  for (let i = 0; i < responses.length; i++) {
    var resultContent = document.createElement('div')
    var resultName = document.createElement('p')
    var resultScore = document.createElement('p')
    document.getElementById('result_text_table').appendChild(resultContent).appendChild(resultName).appendChild(document.createTextNode(JSON.stringify(responses[i].name,null,2)))
    document.getElementById('result_text_table').appendChild(resultContent).appendChild(resultScore).appendChild(document.createTextNode(JSON.stringify(responses[i].score,null,2)))
  }
}

const removeTable = () => {
  let table = document.getElementById('result_text_table')
  while(table.lastChild){
    table.removeChild(table.lastChild);
  }
}

const removeLines = () => {
  let lines = document.getElementById('upload_img_line')
  while(lines.lastChild){
    lines.removeChild(lines.lastChild);
  }
}


const writeSquare = (res) => {
  let svg = document.getElementById('upload_img_line');
  let imgWidth = document.getElementById('upload_img').clientWidth;
  let imgHeight = document.getElementById('upload_img').clientHeight;
  svg.setAttribute('width', imgWidth);
  svg.setAttribute('height', imgHeight);
  let responses =  res.responses[0].localizedObjectAnnotations
  for (let i = 0; i < responses.length; i++) {
    let position =  responses[i].boundingPoly.normalizedVertices

    let lines = document.createElementNS('http://www.w3.org/2000/svg','path')

    let lines_position = 'M' + position[0].x*imgWidth + ',' + position[0].y*imgHeight +
                        ' L' + position[1].x*imgWidth + ','+ position[1].y*imgHeight +
                        ' L' + position[2].x*imgWidth + ','+ position[2].y*imgHeight +
                        ' L' + position[3].x*imgWidth + ','+ position[3].y*imgHeight +
                        ' Z';
    lines.setAttribute('d', lines_position)
    lines.setAttribute('fill', 'none')
    lines.setAttribute('stroke', 'deeppink')
    lines.setAttribute('stroke-width', '5')
    svg.appendChild(lines)
  }
}

const showChart = (res = 0) => {
  let safeData
  if (typeof(res) === 'object') {
    safeData = [
      res.responses[0].safeSearchAnnotation.adult,
      res.responses[0].safeSearchAnnotation.medical,
      res.responses[0].safeSearchAnnotation.racy,
      res.responses[0].safeSearchAnnotation.spoof,
      res.responses[0].safeSearchAnnotation.violence
    ]
    for (let i = 0; i < safeData.length; i++){
      switch (safeData[i]){
        case 'VERY_UNLIKELY':
          safeData[i] = 1
          break
        case 'UNLIKELY':
          safeData[i] = 2
          break
        case 'POSSIBLE':
          safeData[i] = 3
          break
        case 'LIKELY':
          safeData[i] = 4
          break
        case 'VERY_LIKELY':
          safeData[i] = 5
          break
      }
    };
  } else {
    safeData=[0,0,0,0,0]
  }

  let ctx = document.getElementById('myRadarChart');
  let myRadarChart = new Chart(ctx, {
    type: 'radar',
    data: {
        labels: ['adult', 'medical', 'racy', 'spoof', 'violence'],
        datasets: [{
            data: safeData,
            backgroundColor: 'RGBA(225,95,150, 0.5)',
            borderColor: 'RGBA(225,95,150, 1)',
            borderWidth: 1,
            pointBackgroundColor: 'RGB(46,106,177)'
        }]
    },
    options: {
        scale:{
          pointLabels: {
            fontSize: 20,
            ontColor: "black"
          },
          ticks:{
              suggestedMin: 0,
              suggestedMax: 5,
              stepSize: 1,
              fontSize: 20
          }
        },
        legend: {
          display: false
      }
    }
  });
};

window.onload = function(){
  showChart();
}
