const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fecha = (d) => (d ? new Date(d).toLocaleString("es-PE") : "N/A");
const val = (v, u) => (v != null ? `${v} ${u}` : "–");
// fecha + (celdas extra) + temperatura, humedad, presión
const rowLectura = (d, extra = "") =>
  `<td>${fecha(d.fecha)}</td>${extra}<td>${val(d.temperatura, "°C")}</td><td>${val(d.humedad, "%")}</td><td>${val(d.presion, "hPa")}</td>`;

function toast(msg, error = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast-msg show" + (error ? " err" : "");
  setTimeout(() => (t.className = "toast-msg"), 2800);
}

// Formato para <input type="datetime-local"> en hora local
const toLocalInput = (d) =>
  new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

// Paginador reutilizable
function crearPager(sel, onChange) {
  const el = $(sel);
  el.innerHTML = `<button class="btn btn-sm btn-outline-dark">« Anterior</button><span class="small text-secondary"></span><button class="btn btn-sm btn-outline-dark">Siguiente »</button>`;
  const [prev, info, next] = el.children;
  let state = { page: 1, pages: 1 };
  prev.onclick = () => state.page > 1 && onChange(state.page - 1);
  next.onclick = () => state.page < state.pages && onChange(state.page + 1);
  return (page, total, limit) => {
    state = { page, pages: Math.max(1, Math.ceil(total / limit)) };
    info.textContent = `Página ${page} de ${state.pages} (${total} lecturas)`;
    prev.disabled = page <= 1;
    next.disabled = page >= state.pages;
  };
}
