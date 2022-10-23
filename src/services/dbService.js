"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.connectToMongo = exports.getListOfItemsQueuedArrangedByProfile = exports.getListOfItemsQueued = exports.addItemstoMongoBulk = exports.addItemsUsheredBulk = exports.addItemsQueuedBulk = void 0;
var itemsQueued_1 = require("../models/itemsQueued");
var itemsUshered_1 = require("../models/itemsUshered");
var common_1 = require("../common");
var connection_1 = require("../db/connection");
var mongoose = require("mongoose");
var _ = require("underscore");
function addItemsQueuedBulk(itemsArray) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, addItemstoMongoBulk(itemsArray, common_1.DOC_TYPE.IQ)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.addItemsQueuedBulk = addItemsQueuedBulk;
function addItemsUsheredBulk(itemsArray) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, addItemstoMongoBulk(itemsArray, common_1.DOC_TYPE.IU)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.addItemsUsheredBulk = addItemsUsheredBulk;
function addItemstoMongoBulk(itemsArray, docType) {
    if (docType === void 0) { docType = common_1.DOC_TYPE.IQ; }
    return __awaiter(this, void 0, void 0, function () {
        var csvForInsertion, mongooseModel, result, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (itemsArray.length < 1) {
                        return [2 /*return*/];
                    }
                    csvForInsertion = itemsArray[0].csvName;
                    console.log("adding ".concat(itemsArray.length, " items for ").concat(csvForInsertion, " to Mongo"));
                    mongooseModel = docType === common_1.DOC_TYPE.IQ ? itemsQueued_1.ItemsQueued : itemsUshered_1.ItemsUshered;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, mongooseModel.insertMany(itemsArray)["catch"](function (err) {
                            console.log("insertMany err (".concat(csvForInsertion, ")  (").concat(typeof itemsArray, ") : ").concat(err));
                        })];
                case 2:
                    result = _a.sent();
                    console.log("addItemstoMongoBulk:result ".concat(JSON.stringify(result)));
                    return [2 /*return*/, result];
                case 3:
                    err_1 = _a.sent();
                    console.log("err((".concat(csvForInsertion, ")) in addItemsUsheredBulk:"), err_1);
                    throw err_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.addItemstoMongoBulk = addItemstoMongoBulk;
function getListOfItemsQueued(limit) {
    return __awaiter(this, void 0, void 0, function () {
        var filter, items;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filter = { createdAt: { $gte: new Date().getDate() - 10 } };
                    return [4 /*yield*/, itemsQueued_1.ItemsQueued.find(filter)
                            .sort({ createdAt: 1 })
                            .limit(limit)];
                case 1:
                    items = _a.sent();
                    console.log("items ".concat(items));
                    return [2 /*return*/, items];
            }
        });
    });
}
exports.getListOfItemsQueued = getListOfItemsQueued;
function getListOfItemsQueuedArrangedByProfile(limit) {
    return __awaiter(this, void 0, void 0, function () {
        var items, groupedItems;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getListOfItemsQueued(limit)];
                case 1:
                    items = _a.sent();
                    groupedItems = _.groupBy(items, function (item) {
                        return item.archiveProfile;
                    });
                    console.log("groupedItems ".concat(JSON.stringify(groupedItems)));
                    return [2 /*return*/, groupedItems];
            }
        });
    });
}
exports.getListOfItemsQueuedArrangedByProfile = getListOfItemsQueuedArrangedByProfile;
function connectToMongo() {
    return __awaiter(this, void 0, void 0, function () {
        var db, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\nAttempting to connect to DB:", connection_1.connection_config.DB_URL);
                    if (!connection_1.connection_config.DB_URL) return [3 /*break*/, 5];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, mongoose.connect(connection_1.connection_config.DB_URL, connection_1.connection_config.options)];
                case 2:
                    _a.sent();
                    db = mongoose.connection;
                    db.on("error", function () {
                        console.log("connection error:");
                    });
                    db.once("open", function () {
                        // we're connected!
                        console.log("we are connected");
                    });
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    console.log("could not connect to mongoose DB\n", err_2);
                    return [3 /*break*/, 4];
                case 4: return [3 /*break*/, 6];
                case 5:
                    console.log("No ".concat(connection_1.connection_config.DB_URL));
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.connectToMongo = connectToMongo;
