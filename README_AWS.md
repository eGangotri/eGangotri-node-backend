##Dockerize

Docker:
docker build -t egb2  .
docker run -p 3000:4000 egb2
View:
http://127.0.0.1:3000/

if it is working then go to step 2

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


