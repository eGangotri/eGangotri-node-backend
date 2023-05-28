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
###First Time (if using local. Different instructions for using mongo Atlas)
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

    Start Mongo by launching MongoDBCompass with URL for Local
    mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false
    
    for server:
    consult pwd.json for the specific values

    mongodb+srv://<username>:<password>@<cluster0>.<xxxxx>.mongodb.net/?authMechanism=DEFAULT
    
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


Deployment on GCP
Install Gcloud cLI
https://cloud.google.com/sdk/docs/install


#ERRORS
#1. If you are getting 
Attempting to connect to DB: mongodb+srv:// ......
Error: listen EACCES: permission denied 0.0.0.0:80

then dont use WSL Terminal, switch to BASH Terminal

#2. could not connect to mongoose DB
 Error: querySrv EREFUSED _mongodb._tcp.cluster0.yqcrz.mongodb.net
    at QueryReqWrap.onresolve [as oncomplete] (node:internal/dns/callback_resolver:47:19) {
  errno: undefined,
  code: 'EREFUSED',
  syscall: 'querySrv',
  hostname: '_mongodb._tcp.cluster0.yqcrz.mongodb.net'

In Access List add your IP Adddress at:

https://cloud.mongodb.com/v2/5fd0d07d2dddad3b7d4e35d9#/security/network/accessList

##2
Error: error:0308010C:digital envelope routines::unsupported
    at new Hash (node:internal/crypto/hash:71:19)
    at Object.createHash (node:crypto:140:10)
    at module.exports (C:\ws\eGangotri-node-backend\node_modules\webpack\lib\util\createHash.js:135:53)
    at NormalModule._initBuildHash (C:\ws\eGangotri-node-backend\node_modules\webpack\lib\NormalModule.js:417:16)
    at C:\ws\eGangotri-node-backend\node_modules\webpack\lib\NormalModule.js:452:10
    at C:\ws\eGangotri-node-backend\node_modules\webpack\lib\NormalModule.js:323:13
    at C:\ws\eGangotri-node-backend\node_modules\loader-runner\lib\LoaderRunner.js:367:11
    at C:\ws\eGangotri-node-backend\node_modules\loader-runner\lib\LoaderRunner.js:233:18
    at context.callback (C:\ws\eGangotri-node-backend\node_modules\loader-runner\lib\LoaderRunner.js:111:13)
    at C:\ws\eGangotri-node-backend\node_modules\babel-loader\lib\index.js:44:103 {
  opensslErrorStack: [ 'error:03000086:digital envelope routines::initialization error' ],
  library: 'digital envelope routines',
  reason: 'unsupported',
  code: 'ERR_OSSL_EVP_UNSUPPORTED'
}

export NODE_OPTIONS=--openssl-legacy-provider
