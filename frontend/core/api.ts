import { APIResponce } from "./types";

/**
 * Универсальный загрузчик данных
 * @param url - эндпоинт (например, '/referee/all')
 * @param method - HTTP метод
 * @param data - тело запроса для POST/PUT
 * @param headers - дополнительные заголовки
 */
async function request(
  url: string,
  method: "get" | "post" | "put" | "delete" = "get",
  data?: any,
  headers?: HeadersInit
): Promise<APIResponce> {
  const baseUrl = "http://26.179.77.199:8000"; //"http://26.179.77.199:8000" "http://127.0.0.1:8000"
  const fullUrl = `${baseUrl}${url}`;

  // Настройки запроса
  const config: RequestInit = {
    method: method.toUpperCase(),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  // Если это не GET запрос и есть данные, добавляем их в body
  if (method !== "get" && data) {
    config.body = JSON.stringify(data);
  }

  // Для кросс-доменных запросов, если используешь куки/сессии
  config.credentials = "include";

  console.log(`[API Request]: ${config.method} ${fullUrl}`);

  try {
    const response = await fetch(fullUrl, config);
    
    // Пытаемся распарсить JSON
    const result: APIResponce = await response.json();
    return result;

  } catch (e) {
    console.error("[API Error]:", e);
    
    // Возвращаем объект в твоем формате, чтобы компоненты не падали
    return {
      status: "error",
      error: "CONNECTION_LOST"
    };
  }
}

export default request;