package ec.edu.upse.redsocial.domain.port.in;

import java.util.Map;

public interface CrearPostUseCase {
    String crearPost(String autorId, String autorUsername, String texto, String mediaUrl);
    void reaccionarPost(String userId, String postId);
    Object obtenerTendencias(String userId);
}
