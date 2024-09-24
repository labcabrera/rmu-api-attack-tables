#!/bin/bash

docker stop rmu-api-attack-tables

docker rm rmu-api-attack-tables

docker rmi labcabrera/rmu-api-attack-tables:latest

docker build -t labcabrera/rmu-api-attack-tables:latest .

docker run -d -p 3005:3005 --network rmu-network --name rmu-api-attack-tables -h rmu-api-attack-tables -e MONGO_URI='mongodb://rmu-mongo:27017/rmu-core' -e PORT='3005' labcabrera/rmu-api-attack-tables:latest

docker logs -f rmu-api-attack-tables
