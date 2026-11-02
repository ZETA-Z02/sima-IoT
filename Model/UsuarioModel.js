const { MongoClient, ObjectId } = require("mongodb");

class UsuarioModel {
  constructor() {
    this.client = new MongoClient(process.env.MONGO_URL);
    this.db = this.client.db(process.env.DATABASE);
    this.collection = this.db.collection("usuarios");
  }

  async connect() {
    await this.client.connect();
  }

  // CREATE
  async insertUsuario(data) {
    const documento = {
      nombre: data.nombre,
      apellido: data.apellido || "",
      email: data.email,
      rol: data.rol || "investigador",
      fecha_registro: new Date(),
    };
    return await this.collection.insertOne(documento);
  }

  // READ
  async getUsuarios(query = {}) {
    return await this.collection.find(query).sort({ _id: -1 }).toArray();
  }

  // UPDATE
  async updateUsuario(id, dataActualizada) {
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    return await this.collection.updateOne(
      filter,
      { $set: dataActualizada },
    );
  }

  // DELETE
  async deleteUsuario(id) {
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    return await this.collection.deleteOne(filter);
  }
}

module.exports = UsuarioModel;
