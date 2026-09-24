package ec.edu.upse.redsocial.domain.port.out;

public interface NotificationPushPort {
    void notificarSeguidoresNuevoPost(String autorId, String autorUsername, String postTexto);
}
