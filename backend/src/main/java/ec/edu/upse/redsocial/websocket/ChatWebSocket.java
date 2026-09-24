package ec.edu.upse.redsocial.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import ec.edu.upse.redsocial.model.MensajeChat;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.websocket.*;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

@ServerEndpoint("/chat/{userId}")
@ApplicationScoped
public class ChatWebSocket {

    private static final Logger LOG = Logger.getLogger(ChatWebSocket.class.getName());
    private static final Map<String, Session> sesionesActivas = new ConcurrentHashMap<>();
    private final ObjectMapper mapper = new ObjectMapper();

    @OnOpen
    public void onOpen(Session session, @PathParam("userId") String userId) {
        sesionesActivas.put(userId, session);
        LOG.info("Sesión WebSocket conectada para usuario: " + userId);
    }

    @OnClose
    public void onClose(Session session, @PathParam("userId") String userId) {
        sesionesActivas.remove(userId);
        LOG.info("Sesión WebSocket desconectada para usuario: " + userId);
    }

    @OnError
    public void onError(Session session, @PathParam("userId") String userId, Throwable throwable) {
        sesionesActivas.remove(userId);
        LOG.warning("Error en WebSocket de usuario " + userId + ": " + throwable.getMessage());
    }

    @OnMessage
    public void onMessage(String mensajeJson, @PathParam("userId") String remitenteId) {
        try {
            MensajeChat mensaje = mapper.readValue(mensajeJson, MensajeChat.class);
            mensaje.setEmisorId(remitenteId);

            Session sesionDestinatario = sesionesActivas.get(mensaje.getDestinatarioId());
            if (sesionDestinatario != null && sesionDestinatario.isOpen()) {
                String payload = mapper.writeValueAsString(mensaje);
                sesionDestinatario.getAsyncRemote().sendText(payload);
                LOG.info("Mensaje enrutado de " + remitenteId + " a " + mensaje.getDestinatarioId());
            } else {
                LOG.info("Destinatario " + mensaje.getDestinatarioId() + " no conectado. Mensaje pendiente.");
            }
        } catch (IOException e) {
            LOG.severe("Error deserializando mensaje de chat: " + e.getMessage());
        }
    }
}
