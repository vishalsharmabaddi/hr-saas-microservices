# WorkTrack — Dev Startup Guide

## Service start karne ka order

### Step 1 — Docker infra (ek baar chalao)
```bash
docker-compose up -d postgres rabbitmq zookeeper kafka
```

### Step 2 — Config Server (Terminal 1)
```bash
java -jar c:/microservices/config-server/target/config-server-0.0.1-SNAPSHOT.jar
```

### Step 3 — Eureka Server (Terminal 2)
```bash
java -jar c:/microservices/eureka-server/target/eureka-server-0.0.1-SNAPSHOT.jar
```
`Started EurekaServerApplication` dikhe tab aage jao.

### Step 4 — Project Service (Terminal 3)
```bash
cd c:/microservices/project-service && mvn package -DskipTests -q && java -jar target/project-service-0.0.1-SNAPSHOT.jar
```
Agar JAR already bana hua hai (code change nahi kiya):
```bash
java -jar c:/microservices/project-service/target/project-service-0.0.1-SNAPSHOT.jar
```

### Step 5 — Frontend (Terminal 4)
```bash
cd c:/microservices/worktrack-frontend && npm run dev
```
Browser mein kholo: http://localhost:5173

---

## Quick rebuild (agar Java code change kiya)
Terminal 3 mein **Ctrl+C** karo, phir:
```bash
cd c:/microservices/project-service && mvn package -DskipTests -q && java -jar target/project-service-0.0.1-SNAPSHOT.jar
```

## Ports reference
| Service          | Port  |
|-----------------|-------|
| Config Server   | 8888  |
| Eureka          | 8761  |
| Project Service | 8085  |
| Frontend (Vite) | 5173  |
| PostgreSQL      | 5432  |
| RabbitMQ UI     | 15672 |

## Note
- Kafka local dev mein sometimes slow hota hai — wo normal hai, try-catch lagaya hua hai
- `X-Company-Id: 1` hardcoded hai axios mein — production mein JWT token se aayega
- Employee ID `1` hardcoded hai Time Logs mein — production mein auth se aayega
