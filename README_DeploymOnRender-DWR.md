## Dockerize

If you want to run the image for Daily-Work-Report then
in .env
make 
MONGO_DB_NAME="egangotridb"

## Create Account in Docker Hub followed by Repository (One Time Only)

https://hub.docker.com/r/egangotri/egangotri-node-backend

## install docker locally
Set docker path in PATH

Login to Docker with user: egt@
docker login -u egangotri
enter Personal Access Token (PAT)


## Create DockerFile for eGangotri DWR
Save it as Dockerfile

docker build -t egangotri/egangotri-node-backend:dwr .
    Test it by running :
    docker run -p 80:80 egangotri/egangotri-node-backend:dwr
    View at
    http://127.0.0.1:80/

docker push egangotri/egangotri-node-backend:dwr

## access docker iamge via
http://localhost:80/
*** you need to be logged in with the correct acct e**trust@gmail.com
otherwise you will keep getting access denied error.

Check On

https://hub.docker.com/r/egangotri/egangotri-node-backend/

## Deploy on Render
Go to https://dashboard.render.com/
Fires Time Only.
Create a New Web Service.
Share the DockerHub Image URL:
https://hub.docker.com/r/egangotri/egangotri-node-backend/

#Deploy Latest Reference
egangotri-node-backend:dwr
Under Manual Deploy. 

Choose Deploy Latest Reference
https://dashboard.render.com/web/srv-cpfisrrtg9os73bf6ph0/deploys/dep-cs38tl56l47c73ec2ojg

copy all .env items under the Section:
Environment Variables
Set environment-specific config and secrets (such as API keys), then read those values from your code



###Test:
Using the render URL below 
DWR URL: https://egangotri-node-backend-dwr.onrender.com/

you should see something like below
{"response":"eGangotri-node-backend 2024-10-09T14:13:06.206Z Deployed (egangotridb)"}

### References
https://geshan.com.np/blog/2021/01/free-nodejs-hosting/


