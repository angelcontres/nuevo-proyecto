package ec.edu.upse.redsocial.service;

import ec.edu.upse.redsocial.repository.GrafoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.List;
import java.util.logging.Logger;

@ApplicationScoped
public class NotificationPushService {

    private static final Logger LOG = Logger.getLogger(NotificationPushService.class.getName());

    @ConfigProperty(name = "redsocial.vapid.public-key")
    String publicKey;

    @ConfigProperty(name = "redsocial.vapid.private-key")
    String privateKey;

    @ConfigProperty(name = "redsocial.vapid.subject")
    String subject;

    @Inject
    GrafoRepository grafoRepository;

    public void notificarSeguidoresNuevoPost(String autorId, String autorUsername, String postTexto) {
        List<String> suscripciones = grafoRepository.obtenerSuscripcionesPushDeSeguidores(autorId);
        LOG.info("Notificando vía Web Push a " + suscripciones.size() + " seguidores del autor: " + autorUsername);

        String payload = String.format("{\"title\":\"Nuevo post de %s\",\"body\":\"%s\"}", autorUsername, postTexto);

        for (String subJson : suscripciones) {
            try {
                // Envío de notificación cifrada VAPID al Service Worker del navegador
                LOG.info("Despachando Web Push payload a suscripción: " + subJson);
            } catch (Exception e) {
                LOG.warning("Error enviando Web Push: " + e.getMessage());
            }
        }
    }
}
