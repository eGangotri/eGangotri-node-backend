const express = require("express");
import { User } from "../models/user";
import { Request, Response } from "express";
import { getUsers } from "../services/userService";
import { LoginUsersDocument } from "../services/types";
import { stripPassword, validateSuperAdminUserFromRequest } from "./utils";

/**
 * INSOMNIA POST Request Sample
POST http://localhost/user/add 
JSON Body 
{
  "username": "Avneet",
  "password": "123456789",
  "role": "Basic"
}
 */
//Role can be Basic/Admin/Superadmin
export const userRoute = express.Router();

userRoute.post("/add", async (req: Request, resp: Response) => {
  try {
    const _validate = await validateSuperAdminUserFromRequest(req);
    if (_validate[0]) {
      const user = new User(req.body);
      console.log(`userRoute /add ${JSON.stringify(user)}`);
      await user.save();
      resp.status(200).send(user);
    }
    else {
      resp.status(200).send({ error: _validate[1] });
    }


  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

/**
 * 	This "response": [
    {
      "_id": "643eb3f6c2530d1d4c923838",
      "username": "Aman",
      "password": "123456789",
      "role": "basic",
      "createdAt": "2023-04-18T15:15:02.677Z",
      "updatedAt": "2023-04-18T15:15:02.677Z",
      "__v": 0
    }
    is trimmed using stripPassword(users)
 */
userRoute.get("/list", async (req: Request, resp: Response) => {
  try {
    console.log(`req?.query ${JSON.stringify(req?.query)}`);
    const users: LoginUsersDocument[] = await getUsers(req?.query);
    resp.status(200).send({
      response: stripPassword(users),
    });
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

//POST http://localhost/user/checkValidCredentials 
/**
 * {
      "username": "Aman",
      "password": "123456789"
    }
 */

userRoute.post(
  "/checkValidCredentials",
  async (req: Request, resp: Response) => {
    try {
      console.log(`checkValidCredentials:req?.body ${JSON.stringify(req?.body)}`);
      const users: LoginUsersDocument[] = await getUsers(req?.body);
      console.log(`checkValidCredentials:${JSON.stringify(users)}`);

      resp.status(200).send({
        response: users?.length !== 0,
      });
    } catch (err: any) {
      console.log("Error", err);
      resp.status(400).send(err);
    }
  }
);
