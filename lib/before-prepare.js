var fs = require('fs-promise');
var path = require('path');

module.exports = function ($logger, $projectData, hookArgs) {
	var platform = hookArgs.platform.toLowerCase();
	return new Promise(function (resolve, reject) {
			if (platform === 'android') {
				// No actions necessary for Android
				resolve();
			} else if (platform == 'ios') {
                var iosSrc = 'node_modules/nativescript-live-engage/platforms/ios/LPMessagingSDKModels.bundle';
                var iosDest = path.resolve(__dirname, '../../../app/App_Resources/iOS/LPMessagingSDKModels.bundle');
                var copyIos = fs.copy(iosSrc, iosDest);

                copyIos.then(function () {
                        $logger.out('Copied: ' + iosSrc + ' to: ' + iosDest);
                    });

				resolve(copyIos);
			}
	});
};