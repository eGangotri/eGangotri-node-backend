# egangotri-node-backend

###Instructions to Create
#npm init
#npm i express tsc ts-node typescript cors body-parser

###Software No. 1
###Node Backend for eGangotri-react-frontend
    Start Mongo by launching MongoDBCompass with URL
    mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false
    #Run
    nodemon --exec npm run start
    OR
    nodemon 

    Start egangotri-react-frontend by running the following command
    npm run start 
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


