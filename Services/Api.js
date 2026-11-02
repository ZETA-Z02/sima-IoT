const express = require("express");

// Recibimos un objeto con los tres modelos instanciados
function apiRouter({ ambiental, nodos, usuarios }) {
  const router = express.Router();

  // ==========================================
  // 1. LECTURAS AMBIENTALES (Paginación y Filtros)
  // ==========================================

  router.get("/datos", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const [datos, total] = await Promise.all([
        ambiental.getAmbiental(page, limit),
        ambiental.countAmbiental({})
      ]);
      res.set("X-Total-Count", total.toString());
      res.json(datos);
    } catch (error) {
      res.status(500).json({ error: "Error interno: " + error.message });
    }
  });

  router.get("/datos/filtrar", async (req, res) => {
    try {
      const { sensor, tempMin, fechaInicio, fechaFin, page, limit } = req.query;
      let condiciones = [];

      if (sensor) condiciones.push({ sensor_id: sensor });
      if (tempMin)
        condiciones.push({ temperatura: { $gt: parseFloat(tempMin) } });
      if (fechaInicio && fechaFin) {
        condiciones.push({
          fecha: {
            $gte: new Date(fechaInicio),
            $lte: new Date(fechaFin),
          },
        });
      }

      const query = condiciones.length > 0 ? { $and: condiciones } : {};
      const pageNum = page !== undefined ? parseInt(page) : null;
      const limitNum = limit !== undefined ? parseInt(limit) : null;

      const [datos, total] = await Promise.all([
        ambiental.findAmbiental(query, pageNum, limitNum),
        ambiental.countAmbiental(query)
      ]);

      res.set("X-Total-Count", total.toString());
      res.json(datos);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error filtrando datos: " + error.message });
    }
  });

  router.get("/datos/relacional", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const [datos, total] = await Promise.all([
        ambiental.getLecturasConOrigen({}, page, limit),
        ambiental.countAmbiental({})
      ]);
      res.set("X-Total-Count", total.toString());
      res.json(datos);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error en cruce relacional: " + error.message });
    }
  });

  // ==========================================
  // 2. CRUD DE DISPOSITIVOS (Nodos Sensores)
  // ==========================================

  router.post("/nodos", async (req, res) => {
    try {
      const result = await nodos.insertNodo(req.body);
      res.status(201).json({ mensaje: "Nodo creado", id: result.insertedId });
    } catch (error) {
      res.status(500).json({ error: "Error creando nodo: " + error.message });
    }
  });

  router.get("/nodos", async (req, res) => {
    try {
      const { ciudad } = req.query;
      let query = {};
      if (ciudad) {
        query.ciudad = { $regex: new RegExp(ciudad, "i") };
      }
      const listaNodos = await nodos.getNodos(query);
      res.json(listaNodos);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error obteniendo nodos: " + error.message });
    }
  });

  router.put("/nodos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await nodos.updateNodo(id, req.body);
      res.json({ mensaje: "Nodo actualizado correctamente" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error actualizando nodo: " + error.message });
    }
  });

  router.delete("/nodos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await nodos.deleteNodo(id);
      res.json({ mensaje: "Nodo dado de baja (inactivo)" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error eliminando nodo: " + error.message });
    }
  });

  // ==========================================
  // 3. CRUD DE USUARIOS (NUEVO)
  // ==========================================

  // CREATE: POST /api/usuarios
  router.post("/usuarios", async (req, res) => {
    try {
      const result = await usuarios.insertUsuario(req.body);
      res
        .status(201)
        .json({ mensaje: "Usuario creado", id: result.insertedId });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error creando usuario: " + error.message });
    }
  });

  // READ: GET /api/usuarios
  router.get("/usuarios", async (req, res) => {
    try {
      const listaUsuarios = await usuarios.getUsuarios();
      res.json(listaUsuarios);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error obteniendo usuarios: " + error.message });
    }
  });

  // UPDATE: PUT /api/usuarios/:id
  router.put("/usuarios/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await usuarios.updateUsuario(id, req.body);
      res.json({ mensaje: "Usuario actualizado correctamente" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error actualizando usuario: " + error.message });
    }
  });

  // DELETE: DELETE /api/usuarios/:id
  router.delete("/usuarios/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await usuarios.deleteUsuario(id);
      res.json({ mensaje: "Usuario eliminado" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error eliminando usuario: " + error.message });
    }
  });

  return router;
}

module.exports = apiRouter;
