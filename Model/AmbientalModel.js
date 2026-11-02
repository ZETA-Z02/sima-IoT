const { MongoClient } = require("mongodb");

class AmbientalModel {
  constructor() {
    this.client = new MongoClient(process.env.MONGO_URL);
    this.db = this.client.db(process.env.DATABASE);
    this.collection = this.db.collection("ambientalData");
  }

  async connect() {
    await this.client.connect();
  }

  estructuraAmbiental(data) {
    return {
      sensor_id: data.sensor_id, // Este será el enlace con la colección nodos_sensores
      topico: data.topico || data.topic,
      temperatura: data.temperatura,
      humedad: data.humedad,
      presion: data.presion,
      fecha: data.fecha ? new Date(data.fecha) : new Date(),
    };
  }

  // PAGINACIÓN APLICADA: skip y limit dinámicos
  async getAmbiental(page = 1, limit = 20) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 20);
    const skip = (pageNum - 1) * limitNum;
    return await this.collection
      .find({})
      .sort({ fecha: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();
  }

  async insertAmbiental(data) {
    const document = this.estructuraAmbiental(data);
    await this.collection.insertOne(document);
  }

  // BÚSQUEDA CONDICIONAL CON PAGINACIÓN (sensor, fechas, temperatura, etc.)
  async findAmbiental(query = {}, page = null, limit = null) {
    let cursor = this.collection.find(query).sort({ fecha: -1 });
    if (page !== null && limit !== null) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, parseInt(limit) || 10);
      const skip = (pageNum - 1) * limitNum;
      cursor = cursor.skip(skip).limit(limitNum);
    }
    return await cursor.toArray();
  }

  // TOTAL DE DOCUMENTOS SEGÚN FILTRO (Para cálculo de total de páginas)
  async countAmbiental(query = {}) {
    return await this.collection.countDocuments(query);
  }

  // BÚSQUEDA MIXTA Y RELACIÓN (Cumple con "¿Cómo se relacionan las tablas en NoSQL?")
  // Une las lecturas con el origen de la ciudad consultando la tabla nodos_sensores
  async getLecturasConOrigen(query = {}, page = 1, limit = 20) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 20);
    const skip = (pageNum - 1) * limitNum;
    return await this.collection
      .aggregate([
        { $match: query }, // Filtra primero (Ej. por fecha o humedad)
        {
          $lookup: {
            from: "nodos_sensores", // Colección a unir
            localField: "sensor_id", // Llave local
            foreignField: "mac_address", // Llave foránea
            as: "datos_origen", // Nombre del nuevo objeto anidado
          },
        },
        {
          $unwind: { path: "$datos_origen", preserveNullAndEmptyArrays: true },
        },
        { $sort: { fecha: -1 } },
        { $skip: skip },
        { $limit: limitNum },
      ])
      .toArray();
  }
}

module.exports = AmbientalModel;
