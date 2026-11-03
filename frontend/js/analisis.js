const charts = {};
let filas = [];
const METRICAS = [
  { id: "c-temp", key: "temperatura", unidad: "°C", color: "#e4572e" },
  { id: "c-hum", key: "humedad", unidad: "%", color: "#1f8a70" },
  { id: "c-pres", key: "presion", unidad: "hPa", color: "#4c5fd5" },
];

function initAnalisis() {
  $("#form-filtros").addEventListener("submit", (e) => {
    e.preventDefault();
    aplicar();
  });
  $("#f-limpiar").addEventListener("click", () => setTimeout(aplicar));
  $("#f-csv").addEventListener("click", descargarCSV);
  document.querySelectorAll("[data-rango]").forEach((b) =>
    b.addEventListener("click", () => {
      const ahora = new Date(),
        ini = new Date(ahora);
      const r = b.dataset.rango;
      if (r === "hoy") ini.setHours(0, 0, 0, 0);
      else if (r === "1h") ini.setHours(ini.getHours() - 1);
      else if (r === "24h") ini.setDate(ini.getDate() - 1);
      else ini.setDate(ini.getDate() - parseInt(r));
      $("#f-desde").value = toLocalInput(ini);
      $("#f-hasta").value = toLocalInput(ahora);
      aplicar();
    }),
  );
}

async function cargarAnalisis() {
  try {
    const { data } = await api.nodos();
    const sel = $("#f-sensor"),
      actual = sel.value;
    sel.innerHTML =
      '<option value="">Todos</option>' +
      data.map((n) => `<option>${esc(n.mac_address)}</option>`).join("");
    sel.value = actual;
  } catch {}
  if (!filas.length) aplicar();
}

const minutos = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

async function aplicar() {
  const desde = $("#f-desde").value,
    hasta = $("#f-hasta").value;
  const f = {
    sensor: $("#f-sensor").value,
    tempMin: $("#f-tempmin").value,
    page: 1,
    limit: LIMIT_ANALISIS,
  };
  // El backend exige ambas fechas a la vez
  if (desde || hasta) {
    f.fechaInicio = desde
      ? new Date(desde).toISOString()
      : new Date(0).toISOString();
    f.fechaFin = hasta
      ? new Date(hasta).toISOString()
      : new Date().toISOString();
  }
  try {
    const { data, total } = await api.filtrar(f);
    let rows = data
      .slice()
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    const hd = $("#f-hdesde").value,
      hh = $("#f-hhasta").value;
    if (hd && hh) {
      const a = minutos(hd),
        b = minutos(hh);
      rows = rows.filter((r) => {
        const d = new Date(r.fecha),
          m = d.getHours() * 60 + d.getMinutes();
        return a <= b ? m >= a && m <= b : m >= a || m <= b; // soporta rangos nocturnos
      });
    }
    filas = rows;
    $("#f-csv").disabled = !rows.length;
    $("#an-aviso").textContent = !rows.length
      ? "No hay lecturas con estos filtros. Prueba ampliar el rango de fechas."
      : `${rows.length} lecturas` +
        (total > LIMIT_ANALISIS
          ? ` (se muestran las primeras ${LIMIT_ANALISIS} de ${total}; acota las fechas para ver el resto)`
          : "");
    dibujar(rows);
  } catch (e) {
    toast("No se pudo consultar: " + e.message, true);
  }
}

function dibujar(rows) {
  const largo =
    rows.length &&
    new Date(rows.at(-1).fecha) - new Date(rows[0].fecha) > 864e5;
  const labels = rows.map((r) =>
    new Date(r.fecha).toLocaleString(
      "es-PE",
      largo
        ? {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }
        : { hour: "2-digit", minute: "2-digit", second: "2-digit" },
    ),
  );
  $("#an-stats").innerHTML = "";
  METRICAS.forEach((m) => {
    const vals = rows.map((r) => r[m.key]).filter((v) => typeof v === "number");
    if (vals.length) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      $("#an-stats").insertAdjacentHTML(
        "beforeend",
        `<div class="col-md-4"><div class="stat" style="--c:${m.color}"><small>${m.key[0].toUpperCase() + m.key.slice(1)}</small>
        <div>Mín <b>${Math.min(...vals).toFixed(1)}</b> · Prom <b>${avg.toFixed(1)}</b> · Máx <b>${Math.max(...vals).toFixed(1)}</b> ${m.unidad}</div></div></div>`,
      );
    }
    charts[m.id]?.destroy();
    charts[m.id] = new Chart($("#" + m.id), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `${m.key} (${m.unidad})`,
            data: rows.map((r) => r[m.key] ?? null),
            borderColor: m.color,
            backgroundColor: m.color + "22",
            fill: true,
            pointRadius: rows.length > 100 ? 0 : 3,
            tension: 0.25,
            spanGaps: true,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { maxTicksLimit: 10 } } },
      },
    });
  });
}

function descargarCSV() {
  const csv =
    "fecha,sensor_id,temperatura,humedad,presion\n" +
    filas
      .map((r) =>
        [
          new Date(r.fecha).toISOString(),
          r.sensor_id,
          r.temperatura ?? "",
          r.humedad ?? "",
          r.presion ?? "",
        ].join(","),
      )
      .join("\n");
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
    download: "lecturas.csv",
  });
  a.click();
  URL.revokeObjectURL(a.href);
}
