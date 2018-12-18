## Upgrader Usage
In order to perform a software upgarde on the camera, this interface should be used. Please note that there is a convenience function in the `IDeviceManager` for performing the upgrade, but if you want to implement your own handler then this documentation needs to be reviewed.

Each upgrader class (BoxfishUpgrader or HuddlyGoUpgrader) requires some options that should be provided when initializing it:

```javascript
const upgrader = cameraManager.getUpgrader();
const upgradeOptions = {
  file: fs.readSync('/path/to/upgrader/pkg/file'),
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
| UPGRADE_START       | Fired when upgrade is initiated. |
| UPGRADE_COMPLETE    | Fired when upgrade is completed successfully. |
| UPGRADE_FAILED      | Fired when something fails during upgrade. The handler contains the error trace of the upgrade failure. |
| TIMEOUT             | Fired when the camera does not come back up after reboot (reboot is necessary to complete the upgrade sequence.|

The events above can be used as shown below:

```javascript

upgrader.on('UPGRADE_START', () => {
  // Do something.... Inform your system that upgrade has started
});

upgrader.on('UPGRADE_FAILED', (e) => {
  // Upgrade has failed. Print error log to debug the reason
  console.log(e);
});

upgrader.on('UPGRADE_COMPLETE', () => {
  // Hurrayyy! Sucessfully upgraded your Huddly camera
});

upgrader.on('TIMEOUT', () => {
  // Ups! Looks like the camera did not come back up after rebooting during upgrade.
  // This also means that the new software that was loaded into the camera will be discarded.
  // Try to initiate upgrade again.
});

// Finally start the upgrade after having setup all the listeners
upgrader.start();
```
