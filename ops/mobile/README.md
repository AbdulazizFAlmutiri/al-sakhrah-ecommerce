# Driver app (Android)

A thin Capacitor wrapper that opens the driver screen (`/driver`) of the live site and adds
**background location tracking** (keeps reporting with the screen off, shown as a notification).

## Get the APK
GitHub → Actions → "Driver app (Android APK)" → latest run → download `al-sakhrah-driver-apk`.
On the tablet: allow "install unknown apps", install, open, sign in, and allow location
"All the time" plus notifications.

## Change the site address
Edit `server.url` in `capacitor.config.json`, push, and reinstall the new APK.
