const socket = window.io();

const REGEXP_URI = /^(\w+)\/(\w+)$/;

function initSocket({ listElement }) {
  socket.on('collect:start', data => {
    console.info('collect:start', data);
    const { uri, id, status } = data;

    let itemElement = document.getElementById(id);
    if (itemElement) {
      const linkElement = itemElement.querySelector('.link');
      linkElement.setAttribute('href', '#');
      return;
    }

    itemElement = document.createElement('li');
    itemElement.id = id;
    itemElement.className = 'list-group-item';
    itemElement.innerHTML = `
      <a href= "#" data-href="/repos/${uri}" class="link" title="View starline">${uri}</a>
      <span class="badge">${status}%</span>
    `;

    listElement.appendChild(itemElement);
  });

  socket.on('collect:status', data => {
    console.log('collect:status', data);
    const { id, status } = data;
    const itemElement = document.getElementById(id);
    const badgeElement = itemElement.querySelector('.badge');
    badgeElement.innerHTML = `${status}%`;
  });

  socket.on('collect:success', data => {
    console.info('collect:success', data);
    const { id, stars } = data;

    const itemElement = document.getElementById(id);
    itemElement.classList.add('list-group-item-success');

    const badgeElement = itemElement.querySelector('.badge');
    badgeElement.innerHTML = `${stars.count} ⭐`;

    const linkElement = itemElement.querySelector('.link');
    linkElement.setAttribute('href', linkElement.getAttribute('data-href'));
  });

  socket.on('collect:error', data => {
    console.error('collect:error', data);
    const { id } = data;
    const itemElement = document.getElementById(id);
    itemElement.classList.add('list-group-item-danger');
    const badgeElement = itemElement.querySelector('.badge');
    badgeElement.innerHTML = 'error';
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
      socket.emit('collect:request', { uri });
      inputElement.value = '';
      errorMessageElement.classList.add('hidden');
    } else {
      errorMessageElement.classList.remove('hidden');
    }
  });
}

init();
