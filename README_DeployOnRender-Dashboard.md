## Dockerize

If you want to run the image for Daily-Work-Report then
in .env
MONGO_DB_NAME="egangotri_upload_db"

## Create Account in Docker Hub followed by Repository (One Time Only)

https://hub.docker.com/r/egangotri/egangotri-node-backend

## install docker locally
Set docker path in PATH

Login to Docker with user: egt@
docker login -u egangotri
enter Personal Access Token (PAT)

## Create DockerFile for eGangotri Dashboard
Save it as Dockerfile

docker build -t egangotri/egangotri-node-backend:dashboard .
Test it by running :
docker run -p 80:80 egangotri/egangotri-node-backend:dashboard
View at
http://127.0.0.1:80/

docker push egangotri/egangotri-node-backend:dashboard

## access docker iamge via
http://localhost:80/
*** you need to be logged in with the correct acct e**trust@gmail.com
otherwise you will keep getting access denied error.


## Deploy on Render
Create a New Web Service.
Share the DockerHub Image URL:
https://hub.docker.com/r/egangotri/egangotri-node-backend/

copy all .env items under the Section:
Environment Variables
Set environment-specific config and secrets (such as API keys), then read those values from your code

Dashboard URL: https://egangotri-node-backend-dashboard.onrender.com

###Test:
Using the render URL above you should see something like below
{"response":"eGangotri-node-backend 2024-06-04T16:24:36.174Z Deployed (egangotri_upload_db)"}

Dashboard
https://dashboard.render.com/

### References
https://geshan.com.np/blog/2021/01/free-nodejs-hosting/
