FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/demo-payment-service-*.jar app.jar
EXPOSE 8090
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
