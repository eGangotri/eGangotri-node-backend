# egangotri-node-backend

###Instructions to Create
#First Time
#npm init

# on a new Machine with code from git
yarn install 
yarn global add express ts-node typescript cors body-parser
yarn global  add  @tsconfig/node16 -D
npm install --location=global --force nodemon
(without --force it was not installing)
###Software No. 1
###Node Backend for eGangotri-react-frontend
###First Time (if using local. diff. instructions for using mongo Atlas)
Install MongoDB
    https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-5.0.5-signed.msi
Install Mongo Shell
    https://downloads.mongodb.com/compass/mongosh-1.1.8-x64.msi
Install Mongo Compass ( MONGODB comes with an option to install MONGO Compass so 
    this can be skipped)
    https://downloads.mongodb.com/compass/mongodb-compass-1.30.1-win32-x64.msi
In MongoDB Compass create Collection 'archive_upload_monitor'

For Prod: Mongo DB is hosted in Mongo Atlas

https://cloud.mongodb.com/v2/5fd0d07d2dddad3b7d4e35d9#clusters

Ref:

    (https://www.mongodb.com/try/download/compass)

    Start Mongo by launching MongoDBCompass with URL
    mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false
    #Run
    nodemon --exec yarn run start
    //if on WSL/Linux etc you may need to use sudo yarn run start
    OR
    nodemon 

    Start egangotri-react-frontend by running the following command
    yarn run start 
    and viewing
    http://localhost:3000/
    
    ###Additional Softwares
    mongoose


    ### Mongo Schema/Collection
    Schema: archive_upload_monitor
    Collection:Items_Queued
    UI: MongoDB Compass

    ### Applications Hosted
    1. Upload Monitor Web App
    2. Command Line executer
    npm run exec

###Softwware No. 2. 
###NMM-Tiff-2-pdf
 * yarn run convert
 * yarn run tally-post-conversion ( with TALLY_FOR_FOLDERS)
 * gradle merge(mega)
 * yarn run move-merged-pdfs
 * yarn run tally-post-conversion ( with TALLY_FOR_PDFS )Checks Numbers of Items in Sync Only
 * gradle tally(mega) ( checks pageCount corresponds to image count)
 * gradle uploadToArchive



## Docker
docker build . -t egangotri/egangotri-node-backend
docker run -d -p 80:80  egangotri/egangotri-node-backend:latest
docker login
docker push  egangotri/egangotri-node-backend
## access docker iamge via
http://localhost:80/