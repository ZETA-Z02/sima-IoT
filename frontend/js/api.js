async function req(path, opts = {}) {
  const r = await fetch(API_URL + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
  // X-Total-Count requiere Access-Control-Expose-Headers en el backend (CORS)
  const total = parseInt(r.headers.get("X-Total-Count"));
  return { data: json, total: isNaN(total) ? null : total };
}
const qs = (o) =>
  new URLSearchParams(
    Object.entries(o).filter(([, v]) => v !== "" && v != null),
  ).toString();

const api = {
  relacional: (page, limit) => req(`/datos/relacional?${qs({ page, limit })}`),
  filtrar: (f) => req(`/datos/filtrar?${qs(f)}`),
  nodos: (ciudad = "") => req(`/nodos?${qs({ ciudad })}`),
  crearNodo: (body) => req("/nodos", { method: "POST", body }),
  editarNodo: (id, body) => req(`/nodos/${id}`, { method: "PUT", body }),
  usuarios: () => req("/usuarios"),
  crearUsuario: (body) => req("/usuarios", { method: "POST", body }),
  borrarUsuario: (id) => req(`/usuarios/${id}`, { method: "DELETE" }),
};
