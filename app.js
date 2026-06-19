const API_KEY = "AIzaSyB5S62bfDT-aGKNWfKRrnbIGbh70wJ8Eug";

const UPLOAD_URL =
  'https://script.google.com/macros/s/AKfycbzTyWioDzkQ06ypuRI9ELmTeNXWYX7t_no5Y7N9kYEn8uKrd5yPMZh4MRhveYshK7r4-A/exec';

var instruments = [
  { name: 'Bateria', id: '1rzBliOlp0dZ5pJxqhG-c3SgJaQE7OdS7' },
  { name: 'Baixo', id: '1N71fnDx_W30RFT-lQs3RNKoMcjmE61Y_' },
  { name: 'Basson', id: '1jwo1MhjGV7rnA8U-7tlb1wyA3eHo4tBG' },
  { name: 'Clarinete', id: '13VCpSJAEqEOw5i5OGhXFceLFBVpsziYF' },
  { name: 'Cordas', id: '1ZY0Wp8uhFEKawQZ30Kezql9MN9ceLavz' },
  { name: 'Fagote', id: '1XyxqpM9rfdMpNwcnh7LH04ISrHC-vkB2' },
  { name: 'Flauta', id: '1U7VU0Xmhmk0F2tuoZMNZRmJ0K5uxb-vg' },
  { name: 'Flugel', id: '1Sn9F7uUqCzi3RAtcQloakhYv9OoiV0an' },
  { name: 'Horn', id: '1Glc2uShEsHPElWHRHuRnG15hci542USp' },
  { name: 'Oboé', id: '1qjgqnO0-3KQZLdiISywGIUMZVyYtHjEV' },
  { name: 'Saxofone', id: '1N7iV-hi5XnZmgYXZExx3Bw-dqjWX_Qji' },
  { name: 'Trombone', id: '1-W7n5LrIZwXyfA8UaKDnegIkl2AyZOXb' },
  { name: 'Trompa', id: '1Ovadf_hZuBiRU2z1j_l8213YOIL3pDgd' },
  { name: 'Trompete', id: '1r5ptZPob16SjwmUY8sf6OLLAeul8szIc' },
  { name: 'Viola', id: '1WglM_Y4iG_EvcKfyWf1tNCBiWYwF9ErW' },
  { name: 'Violino', id: '1lXlFlQcF7QjWT6X2tZDSTL-AdeWcJ1x6' },
  { name: 'Violoncelo', id: '1-8VhVQH46CNg2VmO1tNbDFJfos1QDNFN' },
  { name: 'Voz e Piano', id: '1MOrKKM1RKnyUHJIbpTnDvRuJJwTUMS3p' }
];

var cultoList = [];
var currentCultoIndex = 0;
var pdfControlsTimeout = null;
var cultoControlsTimeout = null;
var selectedInstrumentId = '';
var selectedInstrumentName = '';

initApp();

function initApp() {
  populateInstrumentSelect();
  setupSearchEnter();
  loadCultoList();

  var savedInstrument = localStorage.getItem('tocai_selected_instrument');
  var savedInstrumentName = localStorage.getItem('tocai_selected_instrument_name');

  if (savedInstrument) {
    selectedInstrumentId = savedInstrument;
    selectedInstrumentName = savedInstrumentName || getInstrumentName(savedInstrument);
    enterApp();
  } else {
    showWelcome();
  }
}

function populateInstrumentSelect() {
  var select = document.getElementById('welcomeInstrumentSelect');

  if (!select) {
    return;
  }

  for (var i = 0; i < instruments.length; i++) {
    var option = document.createElement('option');
    option.value = instruments[i].id;
    option.textContent = instruments[i].name;
    select.appendChild(option);
  }
}

function getInstrumentName(id) {
  for (var i = 0; i < instruments.length; i++) {
    if (instruments[i].id === id) {
      return instruments[i].name;
    }
  }

  return 'Instrumento';
}

function showWelcome() {
  document.getElementById('welcomeScreen').classList.remove('hidden');
  document.getElementById('appScreen').classList.add('hidden');
}

function saveInstrumentAndEnter() {
  var select = document.getElementById('welcomeInstrumentSelect');

  if (!select.value) {
    alert('Selecione seu instrumento');
    return;
  }

  selectedInstrumentId = select.value;
  selectedInstrumentName = getInstrumentName(selectedInstrumentId);

  localStorage.setItem('tocai_selected_instrument', selectedInstrumentId);
  localStorage.setItem('tocai_selected_instrument_name', selectedInstrumentName);

  enterApp();
}

function enterApp() {
  document.getElementById('welcomeScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');

  var label = document.getElementById('selectedInstrumentLabel');

  if (label) {
    label.innerHTML = 'Instrumento: ' + selectedInstrumentName;
  }
}

function changeInstrument() {
  closeMenu();

  localStorage.removeItem('tocai_selected_instrument');
  localStorage.removeItem('tocai_selected_instrument_name');

  selectedInstrumentId = '';
  selectedInstrumentName = '';

  document.getElementById('results').innerHTML = '';

  showWelcome();
}

function setupSearchEnter() {
  setTimeout(function () {
    var input = document.getElementById('searchInput');

    if (!input) {
      return;
    }

    input.onkeydown = function (event) {
      event = event || window.event;

      var key = event.key || event.keyCode;

      if (key === 'Enter' || key === 13) {
        if (event.preventDefault) {
          event.preventDefault();
        }

        searchPDFs();
      }
    };
  }, 100);
}

function searchPDFs() {
  if (!selectedInstrumentId) {
    alert('Selecione seu instrumento primeiro');
    return;
  }

  var query = document.getElementById('searchInput').value;

  var url =
    "https://www.googleapis.com/drive/v3/files?" +
    "q='" + selectedInstrumentId + "' in parents " +
    "and mimeType='application/pdf' " +
    "and name contains '" + query + "'" +
    "&fields=files(id,name)" +
    "&key=" + API_KEY;

  var results = document.getElementById('results');
  results.innerHTML = '<p class="muted">Buscando...</p>';

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
    results.innerHTML = '<p class="muted">Nenhuma partitura encontrada.</p>';
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
  showPDFControls();
}

function closePDF() {
  var modal = document.getElementById('pdfModal');

  modal.classList.remove('open');
  modal.classList.remove('show-controls');

  document.getElementById('pdfViewer').src = '';

  clearTimeout(pdfControlsTimeout);
}

function showPDFControls() {
  var modal = document.getElementById('pdfModal');

  modal.classList.add('show-controls');

  clearTimeout(pdfControlsTimeout);

  pdfControlsTimeout = setTimeout(function () {
    modal.classList.remove('show-controls');
  }, 3000);
}

function togglePDFControls() {
  var modal = document.getElementById('pdfModal');

  if (modal.classList.contains('show-controls')) {
    modal.classList.remove('show-controls');
    clearTimeout(pdfControlsTimeout);
  } else {
    showPDFControls();
  }
}

function saveOffline(fileId) {
  window.location.href =
    'https://drive.google.com/uc?export=download&id=' +
    fileId;
}

function uploadPDF() {
  var input = document.getElementById('uploadFile');
  var status = document.getElementById('uploadStatus');

  if (!selectedInstrumentId) {
    alert('Selecione seu instrumento primeiro');
    return;
  }

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

    formData.append('folderId', selectedInstrumentId);
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

  renderCultoList();
}

function loadCultoList() {
  cultoList = [];

  localStorage.removeItem(
    'tocai_culto_list'
  );

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
    container.innerHTML = '<p class="muted">Nenhuma música adicionada.</p>';
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

function clearCultoList() {
  if (!confirm('Deseja limpar toda a lista de culto?')) {
    return;
  }

  cultoList = [];
  renderCultoList();
}

function openMenu() {
  document.getElementById('sideMenu').classList.add('open');
  document.getElementById('sideMenuOverlay').classList.add('open');
}

function closeMenu() {
  document.getElementById('sideMenu').classList.remove('open');
  document.getElementById('sideMenuOverlay').classList.remove('open');
}

function showCultoPage() {
  closeMenu();
  document.getElementById('cultoPage').classList.remove('hidden');
  renderCultoList();
}

function showUploadPage() {
  closeMenu();
  document.getElementById('uploadPage').classList.remove('hidden');

  var status = document.getElementById('uploadStatus');

  if (status) {
    status.innerHTML = '';
  }
}

function closePagePanels() {
  document.getElementById('cultoPage').classList.add('hidden');
  document.getElementById('uploadPage').classList.add('hidden');
}

function openCultoPlayer() {
  if (cultoList.length === 0) {
    alert('A lista está vazia');
    return;
  }

  currentCultoIndex = 0;

  document.getElementById('cultoPlayer').classList.add('open');

  showCultoMusic();
  showCultoControls();
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

function showCultoControls() {
  var player = document.getElementById('cultoPlayer');

  player.classList.add('show-controls');

  clearTimeout(cultoControlsTimeout);

  cultoControlsTimeout = setTimeout(function () {
    player.classList.remove('show-controls');
  }, 3000);
}

function toggleCultoControls() {
  var player = document.getElementById('cultoPlayer');

  if (player.classList.contains('show-controls')) {
    player.classList.remove('show-controls');
    clearTimeout(cultoControlsTimeout);
  } else {
    showCultoControls();
  }
}

function nextCultoMusic() {
  if (currentCultoIndex < cultoList.length - 1) {
    currentCultoIndex++;
    showCultoMusic();
    showCultoControls();
  }
}

function previousCultoMusic() {
  if (currentCultoIndex > 0) {
    currentCultoIndex--;
    showCultoMusic();
    showCultoControls();
  }
}

function closeCultoPlayer() {
  var player = document.getElementById('cultoPlayer');

  player.classList.remove('open');
  player.classList.remove('show-controls');

  document.getElementById('cultoViewer').src = '';

  clearTimeout(cultoControlsTimeout);
}

window.addEventListener(
  'beforeunload',
  function () {

    localStorage.removeItem(
      'tocai_culto_list'
    );

  }
);
