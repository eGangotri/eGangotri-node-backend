cyclic package limit is 240 MB
So in 
package.json remove
    "googleapis": "^121.0.0",


git rm -r --cached cliBased

in .gitignore
/src/cliBased

git add .
git commit/push

Go to cyclic and deploy
add env variables:
https://app.cyclic.sh/#/app/egangotri-egangotri-node-backend/vars




##Dockerize
Create DockerFile
Docker:
docker build -t egangotri-node-backend  .
docker run -p 80:80 egangotri-node-backend
View:
http://127.0.0.1:3000/

if it is working then go to step 2
Create an IAM User with Permissions
https://us-east-1.console.aws.amazon.com/iamv2/home?region=us-east-1#/users/create
egangotri-iam-1


###Create IAM USer
with 3 permissions:
AmazonEC2ContainerRegistryFullAccess	AWS managed	Directly
AmazonECS_FullAccess	AWS managed	Directly
AmazonElasticContainerRegistryPublicFullAccess

//arn:aws:iam::369096946191:user/egangotri-iam-1
https://369096946191.signin.aws.amazon.com/console
egangotri-iam-1


aws configure (using credenntials from IAM in AWS Console.)
stored in ~/.aws/credentials
 aws configure list

###Create a AWS Public ECR
aws ecr-public create-repository --repository-name egangotri-node-backend2 --region us-east-1

Check in AWS Console:
https://us-east-1.console.aws.amazon.com/ecr/repositories/public/369096946191/egangotri-node-backend?region=us-east-1


Follow "4 Push commands for egangotri-node-backend2" in AWS Console
In case of 
C:\ws\eGangotri-node-backend>aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws/p2n2r4q0
Error saving credentials: error storing credentials - err: exit status 1, out: `The stub received bad data.`

docker logout
delete ~/.docker/config.json

and remove

C:\Program Files\Docker\Docker\resources\bin\docker-credential-desktop.exe
C:\Program Files\Docker\Docker\resources\bin\docker-credential-wincred.exe

https://stackoverflow.com/questions/60807697/docker-login-error-storing-credentials-the-stub-received-bad-data

Push Command 2:
docker build -t egangotri-node-backend2 .

Push Command 3:
docker tag egangotri-node-backend2:latest public.ecr.aws/p2n2r4q0/egangotri-node-backend2:latest

Push Command 4:
docker push public.ecr.aws/p2n2r4q0/egangotri-node-backend2:latest

https://www.freecodecamp.org/news/build-and-push-docker-images-to-aws-ecr/


create ECS
Create Clsuters


##### Alternate for EBS. which we never managed to get.

https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/GettingStarted.CreateApp.html

https://us-east-1.console.aws.amazon.com/elasticbeanstalk/home?region=us-east-1#/create-environment

us-east-1
egangotri.us-east-1.elasticbeanstalk.com

Install EB CLI
https://github.com/aws/aws-elastic-beanstalk-cli-setup

####Zip your Code
npm run build

zip file manually but ignore folders like node_modules etc


