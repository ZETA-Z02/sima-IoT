// Ajusta estos valores al desplegar
const BACKEND_HOST = "localhost";
const BACKEND_PORT = "3000"; // "" para 80/443
const USE_HTTPS = false;
const proto = USE_HTTPS ? "https" : "http";
const BASE_URL = `${proto}://${BACKEND_HOST}${BACKEND_PORT ? ":" + BACKEND_PORT : ""}`;
const API_URL = `${BASE_URL}/api`;
const LIMIT_DASHBOARD = 15;
const LIMIT_NODO = 10;
const LIMIT_ANALISIS = 1000; // máx. lecturas por consulta de gráficos
