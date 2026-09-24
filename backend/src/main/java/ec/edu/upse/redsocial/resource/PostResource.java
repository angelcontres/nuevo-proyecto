package ec.edu.upse.redsocial.resource;

import ec.edu.upse.redsocial.repository.GrafoRepository;
import ec.edu.upse.redsocial.service.NotificationPushService;
import ec.edu.upse.redsocial.service.S3StorageService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;
import java.util.UUID;

@Path("/api/posts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PostResource {

    @Inject
    GrafoRepository grafoRepository;

    @Inject
    S3StorageService s3StorageService;

    @Inject
    NotificationPushService notificationPushService;

    @POST
    public Response crearPost(Map<String, String> request) {
        String autorId = request.get("autorId");
        String texto = request.get("texto");
        String mediaUrl = request.get("mediaUrl");
        String autorUsername = request.getOrDefault("autorUsername", "usuario");

        String postId = UUID.randomUUID().toString();
        grafoRepository.crearPost(autorId, postId, texto, mediaUrl);

        // Despacho asíncrono de notificación Web Push a los seguidores (US-08)
        notificationPushService.notificarSeguidoresNuevoPost(autorId, autorUsername, texto);

        return Response.status(Response.Status.CREATED)
                .entity(Map.of("id", postId, "mensaje", "Publicación creada con éxito"))
                .build();
    }

    @POST
    @Path("/{postId}/like")
    public Response reaccionarPost(@PathParam("postId") String postId, Map<String, String> body) {
        String userId = body.get("userId");
        grafoRepository.alternarLike(userId, postId);
        return Response.ok(Map.of("mensaje", "Reacción registrada")).build();
    }

    @GET
    @Path("/tendencias/{userId}")
    public Response obtenerTendencias(@PathParam("userId") String userId) {
        return Response.ok(grafoRepository.obtenerTendenciasRedExtendida(userId)).build();
    }
}
