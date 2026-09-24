package ec.edu.upse.redsocial.resource;

import ec.edu.upse.redsocial.model.Post;
import ec.edu.upse.redsocial.repository.GrafoRepository;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/feed")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FeedResource {

    @Inject
    GrafoRepository grafoRepository;

    @GET
    @Path("/{userId}")
    public Response obtenerFeed(@PathParam("userId") String userId) {
        List<Post> feed = grafoRepository.obtenerFeedCronologico(userId);
        return Response.ok(feed).build();
    }
}
