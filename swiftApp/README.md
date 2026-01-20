# Swift iOS Document Scanner

This folder contains a basic SwiftUI application showing how to scan a document with live border detection using **VisionKit** and upload it to the existing FastAPI backend.

## Features

- Uses `VNDocumentCameraViewController` for automatic document edge detection and cropping.
- Displays the captured image in the UI.
- Example API service for uploading the scanned image to `/upload`.

## Getting Started

1. Open Xcode and create a new *App* project named `DocumentScanner` using Swift and SwiftUI.
2. Replace the generated source files with the contents in `swiftApp/DocumentScanner`.
3. Update `APIService.baseURL` to point to your backend.
4. Build and run on an iOS device (VisionKit requires a real device).

This is a minimal example and does not implement the full authentication flow from the React Native app. You can extend `APIService` to call the `/login` and `/register` endpoints similarly.
