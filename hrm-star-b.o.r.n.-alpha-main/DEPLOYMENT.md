# Deployment Guide

## Production Deployment

Complete guide for deploying HRM STAR B.O.R.N. + Atlantean Intelligence to production.

## Option 1: Google Cloud Run (Recommended)

### Prerequisites

- Google Cloud Project
- `gcloud` CLI installed
- Docker configured
- Gemini API key

### Deployment Steps

1. **Authenticate with Google Cloud:**

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

2. **Build and Push Docker Images:**

```bash
# Build Atlantean backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/atlantean-backend -f Dockerfile.atlantean .

# Build Frontend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/hrm-frontend -f Dockerfile.frontend .
```

3. **Deploy Atlantean Backend to Cloud Run:**

```bash
gcloud run deploy atlantean-backend \
  --image gcr.io/YOUR_PROJECT_ID/atlantean-backend \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars "GEMINI_API_KEY=YOUR_GEMINI_KEY,REDIS_HOST=YOUR_REDIS_HOST" \
  --allow-unauthenticated
```

4. **Deploy Frontend to Cloud Run:**

```bash
gcloud run deploy hrm-frontend \
  --image gcr.io/YOUR_PROJECT_ID/hrm-frontend \
  --platform managed \
  --region us-central1 \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars "ATLANTEAN_BACKEND_URL=https://atlantean-backend-URL.run.app,VITE_GEMINI_API_KEY=YOUR_GEMINI_KEY" \
  --allow-unauthenticated
```

5. **Set up Cloud Memorystore (Redis):**

```bash
gcloud redis instances create hrm-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=7.0
```

6. **Update Backend with Redis Host:**

```bash
gcloud run deploy atlantean-backend \
  --update-env-vars "REDIS_HOST=YOUR_MEMORYSTORE_HOST"
```

## Option 2: Docker Compose on VPS

### Prerequisites

- VPS with Docker & Docker Compose
- 2GB+ RAM
- Gemini API key
- Domain name (optional)

### Deployment Steps

1. **SSH into VPS:**

```bash
ssh user@your-vps-ip
```

2. **Clone Repository:**

```bash
git clone <repo-url>
cd hrm-star-b.o.r.n.-alpha
```

3. **Create Production .env:**

```bash
cat > .env.production << EOF
GEMINI_API_KEY=your-key
REDIS_HOST=redis
ATLANTEAN_BACKEND_URL=http://atlantean-backend:5001
EOF
```

4. **Deploy with Docker Compose:**

```bash
docker-compose -f docker-compose.yml up -d
```

5. **Set up Nginx Reverse Proxy:**

```bash
# Install Nginx
sudo apt-get install nginx

# Create config
sudo tee /etc/nginx/sites-available/default > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
    }

    location /api/atlantean/ {
        proxy_pass http://localhost:5001;
    }
}
EOF

# Enable site and restart
sudo systemctl restart nginx
```

6. **Set up SSL with Let's Encrypt:**

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Option 3: Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (GKE, EKS, AKS, or local minikube)
- `kubectl` configured
- Helm (optional)

### Deployment Steps

1. **Create Namespace:**

```bash
kubectl create namespace hrm
```

2. **Create Secrets:**

```bash
kubectl create secret generic gemini-keys \
  -n hrm \
  --from-literal=GEMINI_API_KEY=your-key
```

3. **Create Redis Deployment:**

```bash
kubectl create deployment redis -n hrm \
  --image=redis:7-alpine \
  --replicas=1

kubectl expose deployment redis -n hrm \
  --port=6379 \
  --target-port=6379
```

4. **Deploy Atlantean Backend:**

Create `atlantean-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: atlantean-backend
  namespace: hrm
spec:
  replicas: 2
  selector:
    matchLabels:
      app: atlantean-backend
  template:
    metadata:
      labels:
        app: atlantean-backend
    spec:
      containers:
      - name: atlantean
        image: gcr.io/YOUR_PROJECT/atlantean-backend
        ports:
        - containerPort: 5001
        env:
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: gemini-keys
              key: GEMINI_API_KEY
        - name: REDIS_HOST
          value: redis
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: atlantean-backend
  namespace: hrm
spec:
  type: ClusterIP
  selector:
    app: atlantean-backend
  ports:
  - port: 5001
    targetPort: 5001
```

Apply:

```bash
kubectl apply -f atlantean-deployment.yaml
```

5. **Deploy Frontend:**

Create `frontend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hrm-frontend
  namespace: hrm
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hrm-frontend
  template:
    metadata:
      labels:
        app: hrm-frontend
    spec:
      containers:
      - name: frontend
        image: gcr.io/YOUR_PROJECT/hrm-frontend
        ports:
        - containerPort: 3000
        env:
        - name: ATLANTEAN_BACKEND_URL
          value: http://atlantean-backend:5001
        - name: VITE_GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: gemini-keys
              key: GEMINI_API_KEY
---
apiVersion: v1
kind: Service
metadata:
  name: hrm-frontend
  namespace: hrm
spec:
  type: LoadBalancer
  selector:
    app: hrm-frontend
  ports:
  - port: 80
    targetPort: 3000
```

Apply:

```bash
kubectl apply -f frontend-deployment.yaml
```

6. **Check Deployment:**

```bash
kubectl get pods -n hrm
kubectl logs -n hrm deployment/atlantean-backend
```

## 🔒 Security Best Practices

### Environment Variables

Never commit sensitive data:

```bash
# .gitignore
.env.local
.env.production
*.key
*.pem
```

Use secrets management:

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name hrm/gemini-key \
  --secret-string "YOUR_KEY"

# Google Secret Manager
gcloud secrets create gemini-key --data-file=- <<< "YOUR_KEY"
```

### API Keys

1. Use separate keys for each environment
2. Rotate keys regularly
3. Monitor API usage
4. Implement rate limiting

### CORS Configuration

Update server.ts for production:

```typescript
const corsOptions = {
  origin: ['https://your-domain.com'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

### HTTPS/TLS

All traffic should be encrypted:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

## 📊 Monitoring & Observability

### Logging

```bash
# Docker
docker logs -f atlantean-backend
docker logs -f hrm-frontend

# Kubernetes
kubectl logs -f deployment/atlantean-backend -n hrm

# Cloud Run
gcloud logging read "resource.labels.service_name=atlantean-backend" \
  --limit 50 --format json
```

### Metrics

Set up monitoring with:

- **Prometheus**: Collect metrics
- **Grafana**: Visualize metrics
- **DataDog**: Full observability
- **Google Cloud Monitoring**: Cloud native

### Health Checks

```bash
# Atlantean
curl https://your-domain.com/api/atlantean/health

# Express
curl https://your-domain.com/health
```

Configure health checks in deployment:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 5001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 5001
  initialDelaySeconds: 5
  periodSeconds: 5
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build and Push
        run: |
          docker build -t gcr.io/${{ secrets.GCP_PROJECT }}/atlantean-backend -f Dockerfile.atlantean .
          docker push gcr.io/${{ secrets.GCP_PROJECT }}/atlantean-backend
      
      - name: Deploy to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v0
        with:
          service: atlantean-backend
          image: gcr.io/${{ secrets.GCP_PROJECT }}/atlantean-backend
          region: us-central1
          secrets: |
            GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }}
```

## 🆘 Troubleshooting Production Issues

### High Memory Usage

```bash
# Check memory in Python
python -c "import torch; print(torch.cuda.memory_allocated())"

# Reduce model size or implement caching
```

### Slow Responses

```bash
# Enable caching
# Add Redis caching layer
# Implement query optimization
```

### Database Connection Issues

```bash
# Test connection
curl redis://redis-host:6379

# Check connection pool
# Increase pool size if needed
```

## 📈 Scaling

### Horizontal Scaling

```yaml
# Increase replicas
spec:
  replicas: 5
```

### Vertical Scaling

```yaml
# Increase resources
resources:
  limits:
    cpu: "2000m"
    memory: "2Gi"
```

### Load Balancing

```bash
# Enable sticky sessions if needed
# Track session state in Redis
```

## 📞 Support

- Check logs: `docker logs container_name`
- Review status: `/health` endpoints
- Monitor metrics: Cloud console or monitoring tools
- Check API quotas: Google AI Studio

---

For more information, see [README.md](./README.md) and [ATLANTEAN_INTEGRATION.md](./ATLANTEAN_INTEGRATION.md)
