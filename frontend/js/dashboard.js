let pageD = 1,
  chart,
  setPagerD;

function initDashboard() {
  setPagerD = crearPager("#pager-dash", cargarDashboard);
  chart = new Chart($("#chart-live"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Temperatura °C",
          data: [],
          borderColor: "#e4572e",
          yAxisID: "y",
          tension: 0.3,
        },
        {
          label: "Humedad %",
          data: [],
          borderColor: "#1f8a70",
          yAxisID: "y1",
          tension: 0.3,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      animation: false,
      scales: {
        y: { position: "left" },
        y1: { position: "right", grid: { drawOnChartArea: false } },
      },
    },
  });
  document.addEventListener("sensor", (e) => nuevoDato(e.detail));
}

function kpis(d) {
  if (d.temperatura != null)
    $("#dash-temp").textContent = val(d.temperatura, "°C");
  if (d.humedad != null) $("#dash-hum").textContent = val(d.humedad, "%");
  if (d.presion != null) $("#dash-pres").textContent = val(d.presion, "hPa");
}

function nuevoDato(d) {
  kpis(d);
  chart.data.labels.push(
    new Date(d.fecha || Date.now()).toLocaleTimeString("es-PE"),
  );
  chart.data.datasets[0].data.push(d.temperatura ?? null);
  chart.data.datasets[1].data.push(d.humedad ?? null);
  if (chart.data.labels.length > 40) {
    chart.data.labels.shift();
    chart.data.datasets.forEach((s) => s.data.shift());
  }
  chart.update();
  if (pageD !== 1) return;
  const tbody = $("#tabla-dashboard");
  const tr = document.createElement("tr");
  tr.className = "fila-nueva";
  tr.innerHTML = rowLectura(
    { ...d, fecha: d.fecha || Date.now() },
    `<td><span class="mac">${esc(d.sensor_id)}</span></td><td class="text-muted">En vivo</td>`,
  );
  tbody.prepend(tr);
  if (tbody.children.length > LIMIT_DASHBOARD) tbody.lastChild.remove();
}

async function cargarDashboard(p = 1) {
  pageD = p;
  try {
    const { data, total } = await api.relacional(pageD, LIMIT_DASHBOARD);
    setPagerD(pageD, total ?? data.length, LIMIT_DASHBOARD);
    if (pageD === 1 && data[0]) kpis(data[0]);
    $("#tabla-dashboard").innerHTML = data.length
      ? data
          .map((d) => {
            const c = d.datos_origen?.ciudad
              ? esc(d.datos_origen.ciudad)
              : '<span class="text-muted">Sin asignar</span>';
            return `<tr>${rowLectura(d, `<td><span class="mac">${esc(d.sensor_id)}</span></td><td>${c}</td>`)}</tr>`;
          })
          .join("")
      : `<tr><td colspan="6" class="text-center text-muted py-3">Aún no hay lecturas.</td></tr>`;
  } catch (e) {
    $("#tabla-dashboard").innerHTML =
      `<tr><td colspan="6" class="text-danger py-3">No se pudo cargar: ${esc(e.message)}</td></tr>`;
  }
}
