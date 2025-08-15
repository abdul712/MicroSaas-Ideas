#!/bin/bash

# FraudShield Deployment Script
# Deploy FraudShield to production environment with full monitoring

set -e

# Configuration
NAMESPACE="fraudshield"
DOCKER_REGISTRY="your-registry.com"
IMAGE_TAG="${IMAGE_TAG:-2.1.0}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed"
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed"
        exit 1
    fi
    
    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    # Build fraud detection service
    log_info "Building fraud-detection service..."
    docker build -t ${DOCKER_REGISTRY}/fraudshield/fraud-api:${IMAGE_TAG} ./services/fraud-detection/
    
    # Build ML service
    log_info "Building ML service..."
    docker build -t ${DOCKER_REGISTRY}/fraudshield/ml-service:${IMAGE_TAG} ./services/ml-service/
    
    # Build frontend (if exists)
    if [ -d "./frontend" ]; then
        log_info "Building frontend..."
        docker build -t ${DOCKER_REGISTRY}/fraudshield/frontend:${IMAGE_TAG} ./frontend/
    fi
    
    log_success "Docker images built successfully"
}

# Push Docker images
push_images() {
    log_info "Pushing Docker images to registry..."
    
    docker push ${DOCKER_REGISTRY}/fraudshield/fraud-api:${IMAGE_TAG}
    docker push ${DOCKER_REGISTRY}/fraudshield/ml-service:${IMAGE_TAG}
    
    if [ -d "./frontend" ]; then
        docker push ${DOCKER_REGISTRY}/fraudshield/frontend:${IMAGE_TAG}
    fi
    
    log_success "Docker images pushed successfully"
}

# Create namespace
create_namespace() {
    log_info "Creating namespace..."
    
    kubectl apply -f k8s/namespace.yaml
    
    log_success "Namespace created"
}

# Deploy secrets and config
deploy_secrets() {
    log_info "Deploying secrets and configuration..."
    
    # Check if secrets file exists
    if [ ! -f "k8s/secrets.yaml" ]; then
        log_error "secrets.yaml not found. Please create it from secrets.example.yaml"
        exit 1
    fi
    
    kubectl apply -f k8s/secrets.yaml
    
    log_success "Secrets and configuration deployed"
}

# Deploy infrastructure services
deploy_infrastructure() {
    log_info "Deploying infrastructure services..."
    
    # Deploy PostgreSQL
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo update
    
    helm upgrade --install postgres bitnami/postgresql \
        --namespace ${NAMESPACE} \
        --set auth.username=fraudshield \
        --set auth.password=$(kubectl get secret fraudshield-secrets -n ${NAMESPACE} -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d) \
        --set auth.database=fraudshield \
        --set primary.persistence.size=100Gi \
        --set primary.resources.requests.memory=1Gi \
        --set primary.resources.requests.cpu=500m \
        --set metrics.enabled=true
    
    # Deploy Redis
    helm upgrade --install redis bitnami/redis \
        --namespace ${NAMESPACE} \
        --set auth.password=$(kubectl get secret fraudshield-secrets -n ${NAMESPACE} -o jsonpath='{.data.REDIS_PASSWORD}' | base64 -d) \
        --set master.persistence.size=20Gi \
        --set replica.replicaCount=2 \
        --set metrics.enabled=true
    
    # Deploy InfluxDB
    helm upgrade --install influxdb influxdata/influxdb2 \
        --namespace ${NAMESPACE} \
        --set persistence.size=50Gi \
        --set resources.requests.memory=1Gi \
        --set resources.requests.cpu=500m
    
    # Deploy Kafka
    helm upgrade --install kafka bitnami/kafka \
        --namespace ${NAMESPACE} \
        --set persistence.size=50Gi \
        --set replicaCount=3 \
        --set metrics.kafka.enabled=true \
        --set metrics.jmx.enabled=true
    
    log_success "Infrastructure services deployed"
}

# Deploy monitoring stack
deploy_monitoring() {
    log_info "Deploying monitoring stack..."
    
    # Add Prometheus helm repo
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo update
    
    # Deploy Prometheus
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
        --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
        --set prometheus.prometheusSpec.retention=30d \
        --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=100Gi \
        --set grafana.adminPassword=$(kubectl get secret fraudshield-secrets -n ${NAMESPACE} -o jsonpath='{.data.GRAFANA_PASSWORD}' | base64 -d) \
        --set grafana.persistence.enabled=true \
        --set grafana.persistence.size=10Gi
    
    # Deploy ELK Stack
    helm upgrade --install elasticsearch elastic/elasticsearch \
        --namespace logging \
        --create-namespace \
        --set persistence.enabled=true \
        --set volumeClaimTemplate.resources.requests.storage=50Gi \
        --set replicas=3
    
    helm upgrade --install kibana elastic/kibana \
        --namespace logging \
        --set service.type=ClusterIP
    
    helm upgrade --install filebeat elastic/filebeat \
        --namespace logging
    
    log_success "Monitoring stack deployed"
}

# Deploy application services
deploy_application() {
    log_info "Deploying application services..."
    
    # Update image tags in deployment files
    sed -i "s|fraudshield/fraud-api:.*|${DOCKER_REGISTRY}/fraudshield/fraud-api:${IMAGE_TAG}|g" k8s/deployments/fraud-api-deployment.yaml
    sed -i "s|fraudshield/ml-service:.*|${DOCKER_REGISTRY}/fraudshield/ml-service:${IMAGE_TAG}|g" k8s/deployments/ml-service-deployment.yaml
    
    # Deploy applications
    kubectl apply -f k8s/deployments/
    kubectl apply -f k8s/services/
    
    # Deploy ingress
    if [ -f "k8s/ingress.yaml" ]; then
        kubectl apply -f k8s/ingress.yaml
    fi
    
    log_success "Application services deployed"
}

# Wait for deployments
wait_for_deployments() {
    log_info "Waiting for deployments to be ready..."
    
    kubectl wait --for=condition=available deployment/fraud-api -n ${NAMESPACE} --timeout=600s
    kubectl wait --for=condition=available deployment/ml-service -n ${NAMESPACE} --timeout=600s
    
    log_success "All deployments are ready"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check pod status
    kubectl get pods -n ${NAMESPACE}
    
    # Check service endpoints
    log_info "Checking service health..."
    
    # Port forward to check health endpoints
    kubectl port-forward svc/fraud-api-service 8000:8000 -n ${NAMESPACE} &
    PORT_FORWARD_PID=$!
    
    sleep 5
    
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_success "Fraud API service is healthy"
    else
        log_error "Fraud API service health check failed"
    fi
    
    kill $PORT_FORWARD_PID
    
    log_success "Deployment verification completed"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Wait for PostgreSQL to be ready
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql -n ${NAMESPACE} --timeout=300s
    
    # Run migrations using a job
    cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: fraud-db-migration-$(date +%s)
  namespace: ${NAMESPACE}
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: migration
        image: ${DOCKER_REGISTRY}/fraudshield/fraud-api:${IMAGE_TAG}
        command: ["python", "-m", "alembic", "upgrade", "head"]
        envFrom:
        - secretRef:
            name: fraudshield-secrets
        - configMapRef:
            name: fraudshield-config
      backoffLimit: 3
EOF
    
    log_success "Database migrations completed"
}

# Main deployment function
deploy() {
    log_info "Starting FraudShield deployment..."
    
    check_prerequisites
    
    if [ "$1" = "--build" ]; then
        build_images
        push_images
    fi
    
    create_namespace
    deploy_secrets
    deploy_infrastructure
    deploy_monitoring
    run_migrations
    deploy_application
    wait_for_deployments
    verify_deployment
    
    log_success "FraudShield deployment completed successfully!"
    
    # Display access information
    echo ""
    log_info "Access Information:"
    echo "Fraud API: kubectl port-forward svc/fraud-api-service 8000:8000 -n ${NAMESPACE}"
    echo "ML Service: kubectl port-forward svc/ml-service 8001:8001 -n ${NAMESPACE}"
    echo "Grafana: kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring"
    echo "Prometheus: kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n monitoring"
    echo "Kibana: kubectl port-forward svc/kibana-kibana 5601:5601 -n logging"
}

# Cleanup function
cleanup() {
    log_warning "Cleaning up FraudShield deployment..."
    
    kubectl delete namespace ${NAMESPACE} --ignore-not-found=true
    kubectl delete namespace monitoring --ignore-not-found=true
    kubectl delete namespace logging --ignore-not-found=true
    
    log_success "Cleanup completed"
}

# Status function
status() {
    log_info "FraudShield deployment status:"
    
    echo ""
    log_info "Pods:"
    kubectl get pods -n ${NAMESPACE}
    
    echo ""
    log_info "Services:"
    kubectl get services -n ${NAMESPACE}
    
    echo ""
    log_info "Ingress:"
    kubectl get ingress -n ${NAMESPACE}
    
    echo ""
    log_info "PVCs:"
    kubectl get pvc -n ${NAMESPACE}
}

# Main script logic
case "$1" in
    "deploy")
        deploy $2
        ;;
    "cleanup")
        cleanup
        ;;
    "status")
        status
        ;;
    "build")
        check_prerequisites
        build_images
        ;;
    "push")
        check_prerequisites
        push_images
        ;;
    *)
        echo "Usage: $0 {deploy|cleanup|status|build|push}"
        echo ""
        echo "Commands:"
        echo "  deploy [--build]  Deploy FraudShield (optionally build images first)"
        echo "  cleanup           Remove FraudShield deployment"
        echo "  status            Show deployment status"
        echo "  build             Build Docker images"
        echo "  push              Push Docker images to registry"
        echo ""
        echo "Environment variables:"
        echo "  IMAGE_TAG         Docker image tag (default: 2.1.0)"
        echo "  ENVIRONMENT       Deployment environment (default: production)"
        echo "  DOCKER_REGISTRY   Docker registry URL"
        exit 1
        ;;
esac