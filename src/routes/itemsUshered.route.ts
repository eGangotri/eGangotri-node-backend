const express = require("express");
const { ItemsUshered }  = require("../models/itemsUshered");


/**
 * INSOMNIA POST Request Sample
POST http://127.0.0.1/itemsQueued/add 
JSON Body 
 {
	"uploadCycleId": "2",
	"title": "2",
	"localPath": "2",
	"archiveProfile": "2",
	"datetimeUploadStarted": "12/12/2002 12:12:21",
	"csvName": "2",
	"uploadLink":"333"
}
 */
// export const itemsUsheredRoute = express.Router()

// itemsUsheredRoute.post('/add', async (req:any, resp:any) => {
//     try {
//         console.log("req.body")
//         const iq = new ItemsUshered(req.body);
//         await iq.save();
//         resp.status(200).send(iq);
//     }
//     catch (err: any) {
//         console.log('Error', err);
//         resp.status(400).send(err);
//     }
// })


