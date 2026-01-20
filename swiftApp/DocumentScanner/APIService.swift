import Foundation
import UIKit

struct APIService {
    static let baseURL = URL(string: "http://172.20.10.2:8000")!

    static func uploadDocument(image: UIImage, token: String, completion: @escaping (Result<UploadResponse, Error>) -> Void) {
        let url = baseURL.appendingPathComponent("upload")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"

        let boundary = UUID().uuidString
        request.addValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        var body = Data()
        let imageData = image.jpegData(compressionQuality: 0.9) ?? Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"scan.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        URLSession.shared.uploadTask(with: request, from: body) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data else {
                completion(.failure(NSError(domain: "no data", code: 0)))
                return
            }
            do {
                let result = try JSONDecoder().decode(UploadResponse.self, from: data)
                completion(.success(result))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}

struct UploadResponse: Codable {
    let doc_id: String
    let extracted_info: [String: String]
}
