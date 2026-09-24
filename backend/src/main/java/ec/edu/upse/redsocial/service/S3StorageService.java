package ec.edu.upse.redsocial.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.InputStream;
import java.util.UUID;

@ApplicationScoped
public class S3StorageService {

    @Inject
    S3Client s3Client;

    @ConfigProperty(name = "redsocial.s3.bucket", defaultValue = "redsocial-media")
    String bucketName;

    @ConfigProperty(name = "quarkus.s3.endpoint-override", defaultValue = "http://localhost:9000")
    String endpoint;

    public String subirArchivo(InputStream inputStream, long contentLength, String contentType, String extension) {
        String key = "media-" + UUID.randomUUID() + (extension.startsWith(".") ? extension : "." + extension);

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();

        s3Client.putObject(putRequest, RequestBody.fromInputStream(inputStream, contentLength));

        return endpoint + "/" + bucketName + "/" + key;
    }
}
