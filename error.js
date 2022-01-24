const el = document.getElementById('error');

export function displayAnError(error) {
  el.innerHTML = `<p style="color: red">${error}</p>`;
}