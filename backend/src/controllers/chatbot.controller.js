import * as chatbotService from '../services/chatbot.service.js';

export async function conversar(req, res) {
  res.json(await chatbotService.responder(req.body.mensaje, req.body.historial));
}

export async function recomendados(_req, res) {
  res.json(await chatbotService.recomendados());
}
