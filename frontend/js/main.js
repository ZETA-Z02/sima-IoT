const cargadores = {
  dashboard: () => cargarDashboard(1),
  analisis: cargarAnalisis,
  nodos: () => cargarNodos(),
  usuarios: cargarUsuarios,
};

function cambiarVista(id) {
  document
    .querySelectorAll(".vista")
    .forEach((v) => v.classList.toggle("activa", v.id === `vista-${id}`));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.toggle("active", n.dataset.view === id));
  cargadores[id]();
}
document
  .querySelectorAll(".nav-item")
  .forEach((n) =>
    n.addEventListener("click", () => cambiarVista(n.dataset.view)),
  );

initDashboard();
initAnalisis();
initNodos();
initUsuarios();

// WebSocket: reenvía cada lectura como evento "sensor" para que lo escuche cada módulo
const SOCKET_URL = BASE_URL;
const socket = io(SOCKET_URL);
const estado = (cls, txt) => {
  const b = $("#socket-status");
  b.className = `badge ${cls}`;
  b.textContent = txt;
};
socket.on("connect", () => estado("bg-success", "En línea"));
socket.on("disconnect", () => estado("bg-danger", "Desconectado"));
socket.on("nuevo_dato_sensor", (d) =>
  document.dispatchEvent(new CustomEvent("sensor", { detail: d })),
);

cargarDashboard(1);
