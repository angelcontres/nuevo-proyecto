package ec.edu.upse.redsocial.resource;

import ec.edu.upse.redsocial.model.Usuario;
import ec.edu.upse.redsocial.repository.GrafoRepository;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@Path("/api/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserGraphResource {

    @Inject
    GrafoRepository grafoRepository;

    @POST
    public Response registrarUsuario(Usuario usuario) {
        grafoRepository.guardarUsuario(usuario);
        return Response.status(Response.Status.CREATED).entity(usuario).build();
    }

    @POST
    @Path("/{seguidorId}/follow/{seguidoId}")
    public Response seguirUsuario(@PathParam("seguidorId") String seguidorId, @PathParam("seguidoId") String seguidoId) {
        grafoRepository.seguirUsuario(seguidorId, seguidoId);
        return Response.ok(Map.of("mensaje", "Usuario seguido exitosamente")).build();
    }

    @DELETE
    @Path("/{seguidorId}/follow/{seguidoId}")
    public Response dejarDeSeguir(@PathParam("seguidorId") String seguidorId, @PathParam("seguidoId") String seguidoId) {
        grafoRepository.dejarDeSeguir(seguidorId, seguidoId);
        return Response.ok(Map.of("mensaje", "Has dejado de seguir al usuario")).build();
    }

    @GET
    @Path("/{userId}/sugerencias")
    public Response obtenerSugerencias(@PathParam("userId") String userId) {
        return Response.ok(grafoRepository.obtenerSugerenciasUsuarios(userId)).build();
    }

    @GET
    @Path("/comunes")
    public Response obtenerSeguidoresEnComun(@QueryParam("userA") String userA, @QueryParam("userB") String userB) {
        return Response.ok(grafoRepository.obtenerSeguidoresEnComun(userA, userB)).build();
    }

    @GET
    @Path("/camino-corto")
    public Response obtenerCaminoMasCorto(@QueryParam("origen") String origen, @QueryParam("destino") String destino) {
        return Response.ok(grafoRepository.obtenerCaminoMasCorto(origen, destino)).build();
    }
}
