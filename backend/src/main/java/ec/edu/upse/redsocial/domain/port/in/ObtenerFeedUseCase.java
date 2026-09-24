package ec.edu.upse.redsocial.domain.port.in;

import ec.edu.upse.redsocial.domain.model.Post;
import java.util.List;

public interface ObtenerFeedUseCase {
    List<Post> ejecutar(String userId);
}
