const API_KEY =
  "AIzaSyB5S62bfDT-aGKNWfKRrnbIGbh70wJ8Eug";

var cultoList = [];

loadCultoList();

function searchPDFs() {

  var folderId =

    document.getElementById(
      'instrumentSelect'
    ).value;

  var query =

    document.getElementById(
      'searchInput'
    ).value;

  var url =

    "https://www.googleapis.com/drive/v3/files?" +

    "q='" + folderId + "' in parents " +

    "and mimeType='application/pdf' " +

    "and name contains '" + query + "'" +

    "&fields=files(id,name)" +

    "&key=" + API_KEY;

  var xhr =
    new XMLHttpRequest();

  xhr.onreadystatechange =
    function () {

      if (xhr.readyState === 4) {

        if (xhr.status === 200) {

          var data =
            JSON.parse(
              xhr.responseText
            );

          renderFiles(
            data.files || []
          );

        } else {

          alert(
            'Erro ao buscar PDFs'
          );

          console.log(
            xhr.responseText
          );
        }
      }
    };

  xhr.open(
    'GET',
    encodeURI(url),
    true
  );

  xhr.send();
}

function renderFiles(files) {

  var results =

    document.getElementById(
      'results'
    );

  results.innerHTML = '';

  if (files.length === 0) {

    results.innerHTML =

      '<p>Nenhuma partitura encontrada.</p>';

    return;
  }

  for (
    var i = 0;
    i < files.length;
    i++
  ) {

    var file =
      files[i];

    var card =
      document.createElement(
        'div'
      );

    card.className =
      'card';

    card.innerHTML =

      '<h3>' +

      file.name +

      '</h3>' +

      '<div class="actions">' +

      '<button onclick="openPDF(\'' +

      file.id +

      '\')">Abrir</button>' +

      '<button class="secondary" onclick="saveOffline(\'' +

      file.id +

      '\')">Offline</button>' +

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

  var modal =

    document.getElementById(
      'pdfModal'
    );

  var viewer =

    document.getElementById(
      'pdfViewer'
    );

  viewer.src =

    'https://drive.google.com/file/d/' +

    fileId +

    '/preview';

  modal.style.display =
    'flex';
}

function closePDF() {

  document.getElementById(
    'pdfModal'
  ).style.display = 'none';

  document.getElementById(
    'pdfViewer'
  ).src = '';
}

function saveOffline(fileId) {

  window.location.href =

    'https://drive.google.com/uc?export=download&id=' +

    fileId;
}

function addToCulto(id, name) {

  for (
    var i = 0;
    i < cultoList.length;
    i++
  ) {

    if (
      cultoList[i].id === id
    ) {

      alert(
        'Essa partitura já está na lista'
      );

      return;
    }
  }

  cultoList.push({
    id: id,
    name: name
  });

  saveCultoList();

  renderCultoList();

  alert(
    'Adicionado à lista de culto'
  );
}

function removeFromCulto(id) {

  var newList = [];

  for (
    var i = 0;
    i < cultoList.length;
    i++
  ) {

    if (
      cultoList[i].id !== id
    ) {

      newList.push(
        cultoList[i]
      );
    }
  }

  cultoList = newList;

  saveCultoList();

  renderCultoList();
}

function saveCultoList() {

  localStorage.setItem(

    'tocai_culto_list',

    JSON.stringify(
      cultoList
    )
  );
}

function loadCultoList() {

  var saved =

    localStorage.getItem(
      'tocai_culto_list'
    );

  if (saved) {

    cultoList =
      JSON.parse(saved);
  }

  setTimeout(
    function () {

      renderCultoList();

    },
    100
  );
}

function renderCultoList() {

  var container =

    document.getElementById(
      'cultoList'
    );

  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (
    cultoList.length === 0
  ) {

    container.innerHTML =

      '<p>Nenhuma música adicionada.</p>';

    return;
  }

  for (
    var i = 0;
    i < cultoList.length;
    i++
  ) {

    var music =
      cultoList[i];

    var item =
      document.createElement(
        'div'
      );

    item.className =
      'culto-item';

    item.innerHTML =

      '<strong>' +

      music.name +

      '</strong>' +

      '<div class="actions">' +

      '<button onclick="openPDF(\'' +

      music.id +

      '\')">Abrir</button>' +

      '<button class="secondary" onclick="saveOffline(\'' +

      music.id +

      '\')">Offline</button>' +

      '<button class="secondary" onclick="removeFromCulto(\'' +

      music.id +

      '\')">Remover</button>' +

      '</div>';

    container.appendChild(item);
  }
}

function toggleCultoList() {

  var panel =

    document.getElementById(
      'cultoPanel'
    );

  if (
    panel.className ===
    'hidden panel'
  ) {

    panel.className =
      'panel';

  } else {

    panel.className =
      'hidden panel';
  }
}