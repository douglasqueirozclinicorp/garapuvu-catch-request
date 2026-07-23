// Botões "copiar" e aviso nos bookmarklets da página de captura.
document.querySelectorAll('.copy').forEach(function (b) {
  b.addEventListener('click', function () {
    var el = document.getElementById(b.dataset.t);
    navigator.clipboard.writeText(el.innerText).then(function () {
      var o = b.textContent;
      b.textContent = 'Copiado!';
      setTimeout(function () {
        b.textContent = o;
      }, 1500);
    });
  });
});

document.querySelectorAll('.bm').forEach(function (a) {
  a.addEventListener('click', function (e) {
    e.preventDefault();
    alert('Nao clique aqui - ARRASTE este botao para a barra de favoritos (Ctrl+Shift+B).');
  });
});
