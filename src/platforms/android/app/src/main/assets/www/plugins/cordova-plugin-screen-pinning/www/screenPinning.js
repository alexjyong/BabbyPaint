cordova.define("cordova-plugin-screen-pinning.screenPinning", function(require, exports, module) {
/**
 * ScreenPinning Cordova plugin
 */

var exec = require('cordova/exec');

var ScreenPinning = {

    /**
     * enterPinnedMode()
     */
    enterPinnedMode: function(successCallback, errorCallback) {
        exec(successCallback, errorCallback, "ScreenPinning", "enterPinnedMode", []);
    },

    /**
     * exitPinnedMode()
     */
    exitPinnedMode: function(successCallback, errorCallback) {
        exec(successCallback, errorCallback, "ScreenPinning", "exitPinnedMode", []);
    }

};

module.exports = ScreenPinning; 

});
