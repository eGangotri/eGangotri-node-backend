"use strict";
exports.__esModule = true;
exports.launchUploader = void 0;
var child_process_1 = require("child_process");
var common_1 = require("../common");
function launchUploader(args) {
    console.log("args ".concat(args));
    if (!args) {
        args = "C:\\Users\\Chetan Pandey\\Downloads\\forPrint";
    }
    //    exec(`gradlew loginToArchive --args==` + args, {
    (0, child_process_1.exec)("gradlew bookTitles --args==".concat(args), {
        cwd: "".concat(common_1.WORKING_DIR)
    }, function (error, stdout, stderr) {
        if (error) {
            console.log("error: ".concat(error.message));
            return;
        }
        if (stderr) {
            console.log("stderr: ".concat(stderr));
            return;
        }
        console.log("stdout: ".concat(stdout));
    });
}
exports.launchUploader = launchUploader;
