##Dockerize

Docker:
docker build -t egangotri-node-backend  .
docker run -p 80:80 egangotri-node-backend
View:
http://127.0.0.1:3000/

if it is working then go to step 2
Create a AWS Public ECR
https://us-east-1.console.aws.amazon.com/ecr/repositories/public/369096946191/egangotri-node-backend?region=us-east-1

aws configure

Follow "Push commands for egangotri-node-backend"



## Find out how to not put .env in the files

https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/GettingStarted.CreateApp.html

https://us-east-1.console.aws.amazon.com/elasticbeanstalk/home?region=us-east-1#/create-environment

us-east-1
egangotri.us-east-1.elasticbeanstalk.com

Install EB CLI
https://github.com/aws/aws-elastic-beanstalk-cli-setup

####Zip your Code
npm run build

zip file manually but ignore folders like node_modules etc


