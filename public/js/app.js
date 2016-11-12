/* eslint-disable no-console */
/* global document io */

const REGEXP_URI = /^([\w-.]+)\/([\w-.]+)$/;
const REGEXP_SLUGIFY = /\//;

function slugify(uri) {
  return uri.replace(REGEXP_SLUGIFY, '-');
}

function createItemIfNeeded({ listElement, uri }) {
  const id = slugify(uri);
  let itemElement = document.getElementById(id);

  if (itemElement) {
    itemElement.setAttribute('href', '#');

    itemElement.classList.remove('list-group-item-success');
    itemElement.classList.remove('list-group-item-danger');
    itemElement.classList.remove('active');

    return { itemElement, badgeElement: itemElement.querySelector('.badge') };
  }

  itemElement = document.createElement('a');
  itemElement.id = id;
  itemElement.className = 'link list-group-item';
  itemElement.href = `/repos/${uri}`;
  itemElement.setAttribute('data-href', itemElement.href);
  itemElement.title = `View ${uri} starline`;
  itemElement.innerHTML = `
    <span class="uri">${uri}</span>
    <span class="badge">? ⭐</span>
  `;

  listElement.appendChild(itemElement);

  return { itemElement, badgeElement: itemElement.querySelector('.badge') };
}

function bindSocketEvents({ listElement }) {
  const socket = io();

  socket.on('collect:start', ({ uri }) => {
    console.info('collect:start', uri);

    const { itemElement, badgeElement } = createItemIfNeeded({ listElement, uri });

    itemElement.classList.add('active');
    badgeElement.innerHTML = `? ⭐`;
  });

  socket.on('collect:status', ({ uri, progress, total }) => {
    console.log('collect:status', uri, progress, total);

    const { itemElement, badgeElement } = createItemIfNeeded({ listElement, uri });

    itemElement.classList.add('active');
    badgeElement.innerHTML = `${progress}/${total} ⭐`;
  });

  socket.on('collect:success', ({ uri, starsCount }) => {
    console.info('collect:success', uri, starsCount);

    const { itemElement, badgeElement } = createItemIfNeeded({ listElement, uri });

    itemElement.classList.add('list-group-item-success');
    itemElement.setAttribute('href', itemElement.getAttribute('data-href'));
    badgeElement.innerHTML = `${starsCount} ⭐`;
  });

  socket.on('collect:error', ({ uri, error }) => {
    console.error('collect:error', uri, error);

    const { itemElement, badgeElement } = createItemIfNeeded({ listElement, uri });

    itemElement.classList.add('list-group-item-danger');
    badgeElement.innerHTML = 'error!';
  });

  return socket;
}

function bootstrap() {
  const formElement = document.getElementById('form');
  const inputElement = document.getElementById('input');
  const listElement = document.getElementById('list');
  const errorMessageElement = document.getElementById('error');

  const socket = bindSocketEvents({ listElement });

  formElement.addEventListener('submit', event => {
    event.preventDefault();

    const uri = inputElement.value.trim();

    if (REGEXP_URI.test(uri)) {
      console.info('Submitting request for "%s"...', uri);

      inputElement.value = '';
      errorMessageElement.classList.add('hidden');

      socket.emit('collect:request', { uri });
    } else {
      errorMessageElement.classList.remove('hidden');
    }
  });
}

bootstrap();
