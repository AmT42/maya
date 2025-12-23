# iOS Setup (Maya v2)

## Prereqs

- Xcode + Command Line Tools
- CocoaPods
- Node.js + npm or yarn

## Install

```
cd mobileApp
npm install
cd ios
pod install
cd ..
```

## Run (Simulator)

```
cd mobileApp
npm run ios
```

## Backend URL

Edit `mobileApp/src/config/apiConfig.js` for your dev host:

- iOS simulator: `http://localhost:8000`
- iOS device: `http://<your-mac-lan-ip>:8000`
