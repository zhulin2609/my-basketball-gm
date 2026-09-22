FROM maven:3.9.11-eclipse-temurin-21 AS backend-build

WORKDIR /workspace

COPY pom.xml ./
RUN mvn --batch-mode dependency:go-offline

COPY src ./src
RUN mvn --batch-mode package -DskipTests

FROM eclipse-temurin:21-jre

RUN apt-get update \
  && apt-get install --no-install-recommends --yes curl \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd --system app \
  && useradd --system --gid app --create-home app

WORKDIR /app

COPY --chown=app:app --from=backend-build /workspace/target/basketball-gm-api-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

USER app

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
