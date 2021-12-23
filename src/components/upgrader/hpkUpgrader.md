## Upgrader Usage
In order to perform a software upgarde on the camera, this interface should be used. Please note that there is a convenience function in the `IDeviceManager` for performing the upgrade, but if you want to implement your own handler then this documentation needs to be reviewed.

Each upgrader class (BoxfishUpgrader, HuddlyGoUpgrader, AceUPgrader) requires some options that should be provided when initializing it:

```javascript
const upgrader = cameraManager.getUpgrader();
const upgradeOptions = {
  file: fs.readSync('/path/to/firmware/image'),
  bootTimeout: 60 // Default is 60 seconds
  verboseStatusLog: true // Default is true
}; // See the `IUpgraderOpts` for explanation of each option

// Initialize upgrader
upgrader.init(upgraderOptions);
```

After you have initialized the upgrader, then you can proceed with starting the upgrade process.
```javascript
// Start the upgrade process
upgrader.start();
```

During the upgrade process, the upgrader class will emit the following events:

| Event        | Description    |
| ------------- |:-------------|
| `UPGRADE_START`       | Fired when upgrade is initiated. |
| `UPGRADE_COMPLETE`    | Fired when upgrade is completed successfully. |
| `UPGRADE_FAILED`      | Fired when something fails during upgrade. The handler contains the error trace of the upgrade failure. |
| `TIMEOUT`             | Fired when the camera does not come back up after reboot (reboot is necessary to complete the upgrade sequence.|
| `UPGRADE_PROGRESS`    | Fired when constantly during the upgrade process providing with information on how far the upgrade process is from completion.|

The events above can be used as shown below:
```javascript

const onUpgradeStartHandler = () => {
  // Do something.... Inform your system that upgrade has started
  upgrader.removeListener('UPGRADE_PROGRESS', onUpgradeProgressHandler);
}

const onUpgradeFailedHandler = (e) => {
  // Upgrade has failed. Print error log to debug the reason
  console.error(e);
  upgrader.removeListener('UPGRADE_PROGRESS', onUpgradeProgressHandler);
}

const onUpgradeCompleteHandler = () => {
  // Hurrayyy! Sucessfully upgraded your Huddly camera
  upgrader.removeListener('UPGRADE_PROGRESS', onUpgradeProgressHandler);
}

const onUpgradeTimeoutHandler = () => {
  // Ups! Looks like the camera did not come back up after rebooting during upgrade.
  // This also means that the new software that was loaded into the camera will be discarded.
  // Try to initiate upgrade again.
  upgrader.removeListener('UPGRADE_PROGRESS', onUpgradeProgressHandler);
}

const onUpgradeProgressHandler = (progress) => {
  // The progress object contains the following information:
  /*
   * status: A string representation of how far the upgrade progress has come (ex. Uploading firmware on the device)
   * progress: A numerical value representing the percentage of upgrade completion (ex 30)
   */
  console.log(`Upgrade Progress: ${progress.progress} %`)
}

upgrader.once('UPGRADE_START', onUpgradeStartHandler);
upgrader.once('UPGRADE_FAILED', onUpgradeFailedHandler);
upgrader.once('UPGRADE_COMPLETE', onUpgradeCompleteHandler);
upgrader.once('TIMEOUT', onUpgradeTimeoutHandler);
upgrader.on('UPGRADE_PROGRESS', onUpgradeProgressHandler);

// Finally start the upgrade after having setup all the listeners
upgrader.start();
```
