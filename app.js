const API_KEY = "AIzaSyB5S62bfDT-aGKNWfKRrnbIGbh70wJ8Eug";

const UPLOAD_URL =
  'https://script.google.com/macros/s/AKfycbzTyWioDzkQ06ypuRI9ELmTeNXWYX7t_no5Y7N9kYEn8uKrd5yPMZh4MRhveYshK7r4-A/exec';

var cultoList = [];
var currentCultoIndex = 0;

loadCultoList();

function searchPDFs() {
  var folderId = document.getElementById('instrumentSelect').value;
  var query = document.getElementById('searchInput').value;

  var url =
    "https://www.googleapis.com/drive/v3/files?" +
    "q='" + folderId + "' in parents " +
    "and mimeType='application/pdf' " +
    "and name contains '" + query + "'" +
    "&fields=files(id,name)" +
    "&key=" + API_KEY;

  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);
        renderFiles(data.files || []);
      } else {
        alert('Erro ao buscar PDFs');
        console.log(xhr.responseText);
      }
    }
  };

  xhr.open('GET', encodeURI(url), true);
  xhr.send();
}

function renderFiles(files) {
  var results = document.getElementById('results');

  results.innerHTML = '';

  if (files.length === 0) {
    results.innerHTML = '<p>Nenhuma partitura encontrada.</p>';
    return;
  }

  for (var i = 0; i < files.length; i++) {
    var file = files[i];

    var card = document.createElement('div');
    card.className = 'card';

    card.innerHTML =
      '<h3>' + file.name + '</h3>' +
      '<div class="actions">' +
      '<button onclick="openPDF(\'' + file.id + '\')">Abrir</button>' +
      '<button class="secondary" onclick="saveOffline(\'' + file.id + '\')">Offline</button>' +
      '<button class="secondary" onclick="addToCulto(\'' +
      file.id +
      '\', \'' +
      file.name.replace(/'/g, "\\'") +
      '\')">Lista</button>' +
      '</div>';

    results.appendChild(card);
  }
}

function openPDF(fileId) {
  var url =
    'https://drive.google.com/file/d/' +
    fileId +
    '/preview';

  var modal = document.getElementById('pdfModal');
  var viewer = document.getElementById('pdfViewer');

  viewer.src = url;

  modal.classList.add('open');
}

function closePDF() {
  document.getElementById('pdfModal').classList.remove('open');

  document.getElementById('pdfViewer').src = '';
}

function saveOffline(fileId) {
  window.location.href =
    'https://drive.google.com/uc?export=download&id=' +
    fileId;
}

function uploadPDF() {
  var input = document.getElementById('uploadFile');
  var status = document.getElementById('uploadStatus');
  var folderId = document.getElementById('instrumentSelect').value;

  if (!input.files || input.files.length === 0) {
    alert('Escolha um PDF primeiro');
    return;
  }

  var file = input.files[0];

  if (file.type !== 'application/pdf') {
    alert('Envie apenas arquivos PDF');
    return;
  }

  status.innerHTML = 'Enviando...';

  var reader = new FileReader();

  reader.onload = function () {
    var formData = new FormData();

    formData.append('folderId', folderId);
    formData.append('fileName', file.name);
    formData.append('mimeType', file.type);
    formData.append('fileBase64', reader.result);

    fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          status.innerHTML = 'PDF enviado com sucesso!';
          input.value = '';
          searchPDFs();
        } else {
          status.innerHTML = 'Erro: ' + data.error;
        }
      })
      .catch(function (error) {
        console.log(error);
        status.innerHTML = 'Erro ao enviar PDF';
      });
  };

  reader.readAsDataURL(file);
}

function addToCulto(id, name) {
  for (var i = 0; i < cultoList.length; i++) {
    if (cultoList[i].id === id) {
      alert('Essa partitura já está na lista');
      return;
    }
  }

  cultoList.push({
    id: id,
    name: name
  });

  saveCultoList();

  renderCultoList();

  alert('Adicionado à lista de culto');
}

function removeFromCulto(id) {
  var newList = [];

  for (var i = 0; i < cultoList.length; i++) {
    if (cultoList[i].id !== id) {
      newList.push(cultoList[i]);
    }
  }

  cultoList = newList;

  saveCultoList();

  renderCultoList();
}

function saveCultoList() {
  localStorage.setItem(
    'tocai_culto_list',
    JSON.stringify(cultoList)
  );
}

function loadCultoList() {
  var saved = localStorage.getItem('tocai_culto_list');

  if (saved) {
    cultoList = JSON.parse(saved);
  }

  setTimeout(function () {
    renderCultoList();
  }, 100);
}

function renderCultoList() {
  var container = document.getElementById('cultoList');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (cultoList.length === 0) {
    container.innerHTML = '<p>Nenhuma música adicionada.</p>';
    return;
  }

  for (var i = 0; i < cultoList.length; i++) {
    var music = cultoList[i];

    var item = document.createElement('div');
    item.className = 'culto-item';

    item.innerHTML =
      '<strong>' + music.name + '</strong>' +
      '<div class="actions">' +
      '<button onclick="openPDF(\'' + music.id + '\')">Abrir</button>' +
      '<button class="secondary" onclick="saveOffline(\'' + music.id + '\')">Offline</button>' +
      '<button class="secondary" onclick="removeFromCulto(\'' + music.id + '\')">Remover</button>' +
      '</div>';

    container.appendChild(item);
  }
}

function toggleCultoList() {
  var panel = document.getElementById('cultoPanel');

  panel.classList.toggle('hidden');
}

function toggleUploadPanel() {
  var panel = document.getElementById('uploadPanel');

  panel.classList.toggle('hidden');
}

function openCultoPlayer() {
  if (cultoList.length === 0) {
    alert('A lista está vazia');
    return;
  }

  currentCultoIndex = 0;

  document.getElementById('cultoPlayer').classList.add('open');

  showCultoMusic();
}

function showCultoMusic() {
  var music = cultoList[currentCultoIndex];

  var url =
    'https://drive.google.com/file/d/' +
    music.id +
    '/preview';

  document.getElementById('cultoViewer').src = url;

  document.getElementById('cultoCounter').innerHTML =
    (currentCultoIndex + 1) +
    ' / ' +
    cultoList.length +
    ' - ' +
    music.name;
}

function nextCultoMusic() {
  if (currentCultoIndex < cultoList.length - 1) {
    currentCultoIndex++;
    showCultoMusic();
  }
}

function previousCultoMusic() {
  if (currentCultoIndex > 0) {
    currentCultoIndex--;
    showCultoMusic();
  }
}

function closeCultoPlayer() {
  document.getElementById('cultoPlayer').classList.remove('open');

  document.getElementById('cultoViewer').src = '';
}