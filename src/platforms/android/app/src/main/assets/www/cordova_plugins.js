cordova.define('cordova/plugin_list', function(require, exports, module) {
  module.exports = [
    {
      "id": "cordova-plugin-screen-pinning.screenPinning",
      "file": "plugins/cordova-plugin-screen-pinning/www/screenPinning.js",
      "pluginId": "cordova-plugin-screen-pinning",
      "clobbers": [
        "cordova.plugins.screenPinning"
      ]
    },
    {
      "id": "cordova-plugin-x-toast.Toast",
      "file": "plugins/cordova-plugin-x-toast/www/Toast.js",
      "pluginId": "cordova-plugin-x-toast",
      "clobbers": [
        "window.plugins.toast"
      ]
    }
  ];
  module.exports.metadata = {
    "cordova-plugin-screen-pinning": "1.1.3",
    "cordova-plugin-x-toast": "2.7.3",
    "cordova-custom-config": "5.1.1"
  };
});