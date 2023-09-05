https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/GettingStarted.CreateApp.html

https://us-east-1.console.aws.amazon.com/elasticbeanstalk/home?region=us-east-1#/create-environment

us-east-1
egangotri.us-east-1.elasticbeanstalk.com

Install EB CLI
https://github.com/aws/aws-elastic-beanstalk-cli-setup

####Zip your Code
npm run build

zip file manually but ignore folders like node_modules etc


Docker:
docker build -t my-node-app .
docker run -p 80:80 my-node-app
