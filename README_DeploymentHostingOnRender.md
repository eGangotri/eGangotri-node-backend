## Dockerize

If you want to run the image for Daily-Work-Report then
in .env
make 
MONGO_DB_NAME="egangotridb"
and instead of dashboard use dwr as the tag.
eg****trust@Gmail.com is the Docker Hub Acct.

Otherwise use tag "dashboard" 
and 
MONGO_DB_NAME="egangotri_upload_db"

## Create Account in Docker Hub followed by Repository

https://hub.docker.com/r/egangotri/egangotri-node-backend

## install docker locally
Set docker path in PATH

Login to Docker
docker login -u "egangotri" -p "XXXXX" https://docker.io

## Create DockerFile
Save it as Dockerfile

docker build -t egangotri/egangotri-node-backend:dashboard .
Test it by running :
docker run -p 80:80 egangotri/egangotri-node-backend:dashboard
View at
http://127.0.0.1:80/

docker push egangotri/egangotri-node-backend:dashboard



## Deploy on Render
Create a New Web Service.
Share the DockerHub Image URL:
https://hub.docker.com/r/egangotri/egangotri-node-backend/


OLD URL:
https://egangotri-node-backend.onrender.com
NEW URL: 
https://egangotri-node-backend-d4c7.onrender.com
*** uses github profile. for react-daily-work-report. using diff. database

Below is for react-dashboard frontend and uses the upload_db database
p*****78@gmail.com
URL:
https://egangotri-node-backend-dashboard.onrender.com/



Dashboard
https://dashboard.render.com/web/srv-cjt1pjibgj9c739dc9o0/deploys/dep-cjt1pk2bgj9c739dccig



### References
https://geshan.com.np/blog/2021/01/free-nodejs-hosting/
