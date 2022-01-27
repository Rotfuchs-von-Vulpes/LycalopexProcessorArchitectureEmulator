const el = document.getElementById('error');

export default function displayAnError(error) {
  el.innerHTML = `<p style="color: red">${error}</p>`;
}