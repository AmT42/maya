import SwiftUI

struct ContentView: View {
    @State private var showScanner = false
    @State private var scannedImage: UIImage?

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                if let image = scannedImage {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 300)
                } else {
                    Text("Tap Scan to capture a document")
                        .foregroundColor(.gray)
                }

                Button("Scan") {
                    showScanner = true
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()
            .navigationTitle("Document Scanner")
            .sheet(isPresented: $showScanner) {
                ScannerView(image: $scannedImage)
            }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
