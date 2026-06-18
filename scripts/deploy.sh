#!/bin/bash

# Bill Sphere Deployment Script

echo "Checking for .env file..."
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Please update the .env file with your actual secrets and domains before continuing."
    exit 1
fi

echo "Building Docker images..."
docker-compose build

echo "Starting services in detached mode..."
docker-compose up -d

echo "Bill Sphere Production Environment Started!"
echo "Use 'docker-compose logs -f' to view logs."
