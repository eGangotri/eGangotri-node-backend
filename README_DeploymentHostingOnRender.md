## Dockerize

## Create Account in Docker Hub followed by Repository

https://hub.docker.com/r/egangotri/egangotri-node-backend

## install docker locally
Set docker path in PATH

Login to Docker
docker login -u "egangotri" -p "XXXXX" https://docker.io

## Create DockerFile
Save it as Dockerfile

docker build -t egangotri/egangotri-node-backend:latest .
Test it by running :
docker run -p 80:80 egangotri/egangotri-node-backend:latest
View at
http://127.0.0.1:80/

docker push egangotri/egangotri-node-backend:latest

## Deploy on Render
Create a New Web Service.
Share the DockerHub Image URL:
https://hub.docker.com/r/egangotri/egangotri-node-backend/


OLD URL:
https://egangotri-node-backend.onrender.com
NEW URL: 
https://egangotri-node-backend-d4c7.onrender.com

Dashboard
https://dashboard.render.com/web/srv-cjt1pjibgj9c739dc9o0/deploys/dep-cjt1pk2bgj9c739dccig



### References
https://geshan.com.np/blog/2021/01/free-nodejs-hosting/
