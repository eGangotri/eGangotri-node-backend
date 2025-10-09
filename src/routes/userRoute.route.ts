const express = require("express");
import { User } from "../models/user";
import e, { Request, Response } from "express";
import { _userExists, _validateCredentials, getUsers, validateAdminSuperAdminUserFromRequest } from "../services/userService";
import { LoginUsersDocument } from "../types/listingTypes";
import { stripPassword } from "./utils";
import { SUPERADMIN_ROLE } from "../mirror/FrontEndBackendCommonCodeConsts";
import * as _ from 'lodash';
/**
 * INSOMNIA POST Request Sample
POST http://localhost/user/add 
JSON Body 
{
  "superadmin_user": "XXXX",
  "superadmin_password": "XXXXX",
  "username": "Avneet",
  "password": "123456789",
  "role": "Basic"
}
 */
//Role can be Basic/Admin/Superadmin
export const userRoute = express.Router();

userRoute.post("/add", async (req: Request, resp: Response) => {
  try {
    const _validate = await validateAdminSuperAdminUserFromRequest(req);
    if (_validate[0]) {
      const user = new User(req.body);
      console.log(`userRoute /add ${JSON.stringify(user)}`);

      //Check if User exists
      const userExists = await _userExists(req)
      if (userExists) {
        resp.status(200).send({ error: `User with username ${user.username} already exists` });
      }
      else {
        await user.save();
        resp.status(200).send(stripPassword([user])[0]);
      }
    }
    else {
      resp.status(200).send({ error: _validate[1] });
    }
  } catch (err) {
    console.log("Error", err);
    resp.status(400).send({
      error: `exception thrown: ${err}`
    });
  }
});


/**
 * localhost:80/user/patch/delete
 * {
 * {
  "superadmin_user": "XXXX",
  "superadmin_password": "",
  "username": "YYYYY"
}}
 */
userRoute.delete("/delete", async (req: Request, resp: Response) => {
  try {
    const _validate = await validateAdminSuperAdminUserFromRequest(req);
    console.log(`userRoute:_validate /delete ${"" + _validate}`);

    if (_validate[0]) {
      const users: LoginUsersDocument[] = await getUsers({ username: req.body.username });
      if (users && users.length >= 1) {
        const userRoleMap = users.filter(x=>x.role === SUPERADMIN_ROLE)
        if(_.isEmpty(userRoleMap)){
          console.log(`userRoute /delete ${JSON.stringify(users[0])}`);
          const _delete = await User.deleteMany({ username: req.body.username });
          resp.sendStatus(200).send(_delete?.deletedCount);
        }
        else {
          resp.sendStatus(200).send({ error: "One or More Users requested for deletion is a superadmin.Cannot proceed."});
        }
      }
      else {
        resp.sendStatus(200).send({ error: _validate[1] });
      }
    }
    else {
      resp.sendStatus(200).send({ error: `Something went wrong ${_validate}` });

    }
  } catch (err) {
    console.log("Error", err);
    resp.status(400).send({
      error: err
    });
  }
});

/**
 * localhost:80/user/patch/test
 * {
 * {
  "superadmin_user": "XXXX",
  "superadmin_password": "",
  "role": "Superadmin"
}}
 */
userRoute.patch("/patch/:username", async (req: Request, resp: Response) => {
  try {
    const { username } = req.params;

    const _validate = await validateAdminSuperAdminUserFromRequest(req);
    if (_validate[0]) {
      const users: LoginUsersDocument[] = await getUsers({ username: req.body.username });
      if (users && users.length >= 1) {
        console.log(`userRoute /patch ${JSON.stringify(users[0])}`);
        const _update = await User.findOneAndUpdate({ username: username }, req.body);
        resp.status(200).send(_update);
      }
      else {
        resp.status(200).send({ error: _validate[1] });
      }
    }
  } catch (err) {
    console.log("Error", err);
    resp.status(400).send({
      error: err
    });
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
    console.log(`users ${JSON.stringify(users)}`);

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
    let response = {}
    try {
      response = await _validateCredentials(req);
      resp.status(200).send(response);
    } catch (err: any) {
      console.log("Error", err);
      resp.status(400).send(err);
    }
  }
);
