import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export const geminiConfigurado = () => Boolean(env.gemini.apiKey);

// Llama a la API de Gemini (generateContent) y devuelve el JSON que respondió el modelo.
// Se usa fetch directamente en lugar de un SDK para no añadir dependencias.
//   sistema: instrucciones fijas; mensajes: [{ role: 'user' | 'model', parts: [{ text }] }]; esquema: JSON Schema de la salida.
export async function generarJSON({ sistema, mensajes, esquema, temperatura = 0.3, maxTokens = 2048 }) {
  if (!geminiConfigurado()) throw new HttpError(503, 'El asistente aún no está configurado.');

  const generationConfig = {
    temperature: temperatura,
    maxOutputTokens: maxTokens,
    responseMimeType: 'application/json',
    responseJsonSchema: esquema,
  };
  if (env.gemini.pensamiento) generationConfig.thinkingConfig = { thinkingLevel: env.gemini.pensamiento };

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), env.gemini.tiempoMaxMs);
  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}/${encodeURIComponent(env.gemini.modelo)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.gemini.apiKey },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: sistema }] }, contents: mensajes, generationConfig }),
      signal: controlador.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw new HttpError(504, 'El asistente tardó demasiado en responder. Inténtalo de nuevo.');
    console.error('Gemini: error de red:', err.message);
    throw new HttpError(503, 'El asistente no está disponible por ahora.');
  } finally {
    clearTimeout(temporizador);
  }

  if (!respuesta.ok) {
    const detalle = await respuesta.json().catch(() => null);
    // Nunca se registra la clave. 400/401/403/404 suelen indicar clave o modelo mal configurados.
    console.error(`Gemini respondió ${respuesta.status} (modelo ${env.gemini.modelo}):`, detalle?.error?.message ?? '');
    if (respuesta.status === 429) throw new HttpError(429, 'El asistente está recibiendo muchas consultas. Inténtalo en un momento.');
    throw new HttpError(503, 'El asistente no está disponible por ahora.');
  }

  const datos = await respuesta.json().catch(() => null);
  const candidato = datos?.candidates?.[0];
  const texto = (candidato?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? '').join('');
  if (!texto) {
    console.error('Gemini no devolvió texto. finishReason:', candidato?.finishReason, '| bloqueo:', datos?.promptFeedback?.blockReason);
    throw new HttpError(503, 'No pude generar una respuesta para eso. Prueba con otra pregunta.');
  }

  try {
    return JSON.parse(texto);
  } catch {
    console.error('Gemini devolvió un JSON inválido. finishReason:', candidato?.finishReason);
    throw new HttpError(503, 'El asistente dio una respuesta que no pude entender. Inténtalo de nuevo.');
  }
}
