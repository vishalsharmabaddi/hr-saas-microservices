FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/project-service-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]
