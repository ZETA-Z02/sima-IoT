let listaUsu = [],
  mac = "",
  pageN = 1,
  setPagerN;

function initNodos() {
  setPagerN = crearPager("#pager-nodo", (p) => cargarDetalle(p));
  $("#form-nodo").addEventListener("submit", registrar);
  let t;
  $("#buscar-ciudad").addEventListener("input", (e) => {
    clearTimeout(t);
    t = setTimeout(() => cargarNodos(e.target.value.trim()), 300);
  });
  $("#cards-nodos").addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.ver) abrirDetalle(b.dataset.ver);
    if (b.dataset.toggle) {
      try {
        await api.editarNodo(b.dataset.toggle, {
          estado: b.dataset.estado === "activo" ? "inactivo" : "activo",
        });
        cargarNodos($("#buscar-ciudad").value.trim());
      } catch (err) {
        toast(err.message, true);
      }
    }
  });
  $("#cerrar-detalle").onclick = () => {
    $("#detalle-nodo").classList.add("d-none");
    mac = "";
  };
  $("#nd-filtrar").onclick = () => cargarDetalle(1);
  $("#nd-limpiar").onclick = () => {
    $("#nd-desde").value = $("#nd-hasta").value = "";
    cargarDetalle(1);
  };
  document.addEventListener("sensor", (e) => {
    if (mac && e.detail.sensor_id === mac && pageN === 1) cargarDetalle(1);
  });
}

async function cargarNodos(ciudad = "") {
  try {
    if (!ciudad) {
      listaUsu = (await api.usuarios()).data;
      $("#nodo-usuario").innerHTML =
        '<option value="">Sin asignar</option>' +
        listaUsu
          .map(
            (u) =>
              `<option value="${esc(u._id)}">${esc(`${u.nombre || ""} ${u.apellido || ""}`.trim())} (${esc(u.rol)})</option>`,
          )
          .join("");
    }
    const { data } = await api.nodos(ciudad);
    $("#cards-nodos").innerHTML = data.length
      ? data
          .map((n) => {
            const u = listaUsu.find(
              (x) => String(x._id) === String(n.usuario_id),
            );
            const activo = n.estado === "activo";
            return `<div class="col-md-6 col-xl-4 mb-3"><div class="panel h-100">
        <div class="d-flex justify-content-between align-items-start mb-2"><span class="mac fs-6">${esc(n.mac_address)}</span>
          <span class="badge ${activo ? "bg-success" : "bg-secondary"}">${esc(n.estado || "activo")}</span></div>
        <p class="mb-1 small">Ciudad: <b>${esc(n.ciudad || "No especificada")}</b></p>
        <p class="mb-3 small">Responsable: ${u ? esc(`${u.nombre} ${u.apellido || ""}`) : '<span class="text-muted">Sin asignar</span>'}</p>
        <div class="d-flex gap-2"><button class="btn btn-sm btn-accent flex-grow-1" data-ver="${esc(n.mac_address)}">Ver lecturas</button>
        <button class="btn btn-sm btn-outline-dark" data-toggle="${esc(n._id)}" data-estado="${esc(n.estado)}">${activo ? "Inactivar" : "Activar"}</button></div>
      </div></div>`;
          })
          .join("")
      : `<div class="col-12 text-muted">No hay nodos${ciudad ? " en esa ciudad" : " registrados todavía"}.</div>`;
  } catch (e) {
    toast("Error cargando nodos: " + e.message, true);
  }
}

async function registrar(e) {
  e.preventDefault();
  try {
    await api.crearNodo({
      mac_address: $("#nodo-mac").value.trim(),
      ciudad: $("#nodo-ciudad").value.trim(),
      estado: "activo",
      usuario_id: $("#nodo-usuario").value || null,
    });
    e.target.reset();
    toast("Nodo registrado");
    cargarNodos();
  } catch (err) {
    toast("No se pudo registrar: " + err.message, true);
  }
}

function abrirDetalle(m) {
  mac = m;
  $("#titulo-detalle").textContent = `Lecturas de ${m}`;
  $("#detalle-nodo").classList.remove("d-none");
  $("#detalle-nodo").scrollIntoView({ behavior: "smooth" });
  cargarDetalle(1);
}

async function cargarDetalle(p) {
  pageN = p;
  const d = $("#nd-desde").value,
    h = $("#nd-hasta").value;
  const f = { sensor: mac, page: pageN, limit: LIMIT_NODO };
  if (d || h) {
    f.fechaInicio = d ? new Date(d).toISOString() : new Date(0).toISOString();
    f.fechaFin = h ? new Date(h).toISOString() : new Date().toISOString();
  }
  try {
    const { data, total } = await api.filtrar(f);
    setPagerN(pageN, total ?? data.length, LIMIT_NODO);
    $("#tabla-detalle").innerHTML = data.length
      ? data.map((r) => `<tr>${rowLectura(r)}</tr>`).join("")
      : `<tr><td colspan="4" class="text-center text-muted py-3">Sin lecturas para este filtro.</td></tr>`;
  } catch (e) {
    toast(e.message, true);
  }
}
