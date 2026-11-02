const { MongoClient, ObjectId } = require("mongodb");

class NodoSensorModel {
  constructor() {
    this.client = new MongoClient(process.env.MONGO_URL);
    this.db = this.client.db(process.env.DATABASE);
    this.collection = this.db.collection("nodos_sensores");
  }

  async connect() {
    await this.client.connect();
  }

  // CREATE
  async insertNodo(data) {
    let usuario_id = null;
    if (data.usuario_id && data.usuario_id !== "") {
      usuario_id = ObjectId.isValid(data.usuario_id)
        ? new ObjectId(data.usuario_id)
        : data.usuario_id;
    }

    const documento = {
      mac_address: data.mac_address, // Ej: "ESP32_01"
      ciudad: data.ciudad,
      estado: data.estado || "activo", // activo, inactivo, mantenimiento
      usuario_id: usuario_id,
      fecha_registro: new Date(),
    };
    return await this.collection.insertOne(documento);
  }

  // READ & BÚSQUEDA POR PALABRA (Ej. regex para buscar por ciudad)
  async getNodos(query = {}) {
    return await this.collection.find(query).sort({ _id: -1 }).toArray();
  }

  // UPDATE
  async updateNodo(id, dataActualizada) {
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    return await this.collection.updateOne(
      filter,
      { $set: dataActualizada }, // $set solo actualiza los campos enviados
    );
  }

  // DELETE (Se recomienda borrado lógico para no perder historial)
  async deleteNodo(id) {
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    // Borrado lógico cambiando el estado
    return await this.collection.updateOne(
      filter,
      { $set: { estado: "inactivo" } },
    );
  }
}

module.exports = NodoSensorModel;
