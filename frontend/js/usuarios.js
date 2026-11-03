const COLOR = { ingeniero: "bg-primary", administrador: "bg-danger" };

function initUsuarios() {
  $("#form-usuario").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api.crearUsuario({
        nombre: $("#usu-nombre").value.trim(),
        apellido: $("#usu-apellido").value.trim(),
        email: $("#usu-email").value.trim(),
        rol: $("#usu-rol").value,
      });
      e.target.reset();
      toast("Usuario creado");
      cargarUsuarios();
    } catch (err) {
      toast("No se pudo crear: " + err.message, true);
    }
  });
  $("#tabla-usuarios").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-del]");
    if (!b || !confirm("¿Eliminar este usuario?")) return;
    try {
      await api.borrarUsuario(b.dataset.del);
      toast("Usuario eliminado");
      cargarUsuarios();
    } catch (err) {
      toast(err.message, true);
    }
  });
}

async function cargarUsuarios() {
  try {
    const { data } = await api.usuarios();
    $("#tabla-usuarios").innerHTML = data.length
      ? data
          .map(
            (u) => `<tr>
      <td class="fw-semibold">${esc(`${u.nombre || ""} ${u.apellido || ""}`.trim() || "Sin nombre")}</td><td>${esc(u.email)}</td>
      <td><span class="badge ${COLOR[u.rol] || "bg-secondary"}">${esc(u.rol || "investigador")}</span></td>
      <td>${u.fecha_registro ? fecha(u.fecha_registro) : '<span class="text-muted">No registrada</span>'}</td>
      <td class="text-end"><button class="btn btn-sm btn-outline-danger" data-del="${esc(u._id)}">Eliminar</button></td></tr>`,
          )
          .join("")
      : `<tr><td colspan="5" class="text-center text-muted py-3">Todavía no hay usuarios. Crea el primero arriba.</td></tr>`;
  } catch (e) {
    toast("Error cargando usuarios: " + e.message, true);
  }
}
