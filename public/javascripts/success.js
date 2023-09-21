const toHome = document.querySelector('#send_button');
toHome.addEventListener('click', () => {
  window.location.href = window.location.origin;
});
