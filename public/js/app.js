const socket = io();

const REGEXP_URI = /^(\w+)\/(\w+)$/;

function slugify(uri) {
  return uri.replace(/\//, '-');
}

function createItemIfNeeded({ listElement, uri }) {
  const id = slugify(uri);

  let itemElement = document.getElementById(id);
  if (itemElement) {
    const linkElement = itemElement.querySelector('.link');
    linkElement.setAttribute('href', '#');
    return itemElement;
  }

  itemElement = document.createElement('li');
  itemElement.id = id;
  itemElement.className = 'list-group-item';
  itemElement.innerHTML = `
    <a href= "#" data-href="/repos/${uri}" class="link" title="View starline">${uri}</a>
    <span class="badge">0%</span>
  `;

  listElement.appendChild(itemElement);

  return itemElement;
}

function initSocket({ listElement }) {
  socket.on('collect:start', ({ uri }) => {
    console.info('collect:start', uri);
    const itemElement = createItemIfNeeded({ listElement, uri });
    itemElement.classList.remove('list-group-item-success');
    itemElement.classList.remove('list-group-item-danger');
  });

  socket.on('collect:status', ({ uri, progress }) => {
    console.log('collect:status', uri, progress);
    const itemElement = createItemIfNeeded({ listElement, uri });

    const badgeElement = itemElement.querySelector('.badge');
    badgeElement.innerHTML = `${progress}%`;
  });

  socket.on('collect:success', ({ uri, stars }) => {
    console.info('collect:success', uri, stars);
    const itemElement = createItemIfNeeded({ listElement, uri });
    itemElement.classList.add('list-group-item-success');

    const badgeElement = itemElement.querySelector('.badge');
    badgeElement.innerHTML = `${stars.count} ⭐`;

    const linkElement = itemElement.querySelector('.link');
    linkElement.setAttribute('href', linkElement.getAttribute('data-href'));
  });

  socket.on('collect:error', ({ uri, error }) => {
    console.error('collect:error', uri, error);
    const itemElement = createItemIfNeeded({ listElement, uri });
    itemElement.classList.add('list-group-item-danger');

    const badgeElement = itemElement.querySelector('.badge');
    badgeElement.innerHTML = error;
  });
}

function init() {
  const formElement = document.getElementById('form');
  const inputElement = document.getElementById('input');
  const listElement = document.getElementById('list');
  const errorMessageElement = document.getElementById('error');

  initSocket({ listElement });

  formElement.addEventListener('submit', event => {
    event.preventDefault();

    const uri = inputElement.value.trim();

    if (REGEXP_URI.test(uri)) {
      console.log('Submitting request for "%s"...', uri);
      inputElement.value = '';
      errorMessageElement.classList.add('hidden');
      socket.emit('collect:request', { uri });
    } else {
      errorMessageElement.classList.remove('hidden');
    }
  });
}

init();
