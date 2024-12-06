cordova.define('cordova/plugin_list', function(require, exports, module) {
  module.exports = [
    {
      "id": "cordova-plugin-screen-pinning.screenPinning",
      "file": "plugins/cordova-plugin-screen-pinning/www/screenPinning.js",
      "pluginId": "cordova-plugin-screen-pinning",
      "clobbers": [
        "cordova.plugins.screenPinning"
      ]
    }
  ];
  module.exports.metadata = {
    "cordova-plugin-screen-pinning": "1.1.3",
    "cordova-custom-config": "5.1.1"
  };
});