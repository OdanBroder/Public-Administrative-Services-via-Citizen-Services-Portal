import QRCode from "qrcode";
import BirthRegistration from "../models/BirthRegistration";
import Citizen from "../models/Citizen";
import FilePath from "../models/FilePath";
import tpmService from "../utils/crypto/tpmController";
import path from "path";
import Mldsa_wrapper from "../utils/crypto/MLDSAWrapper";
import crypto from "crypto";
import Jimp from "jimp";
import QrCode from "qrcode-reader";
import { readFile, stat } from "fs";
export const getApplicantQrSignature = async (req,res) => {
  const { id } = req.params; // application id
  
  const userId = req.user.userId; // Assuming userId is available in the request object
  if(userId !== id){
    return res
  }
  const applicant = await Citizen.findOne({ where: { id: userId } });
  const userFilePath = FilePath.findOne({ where: { userId } });
  // Replace here 
  const birthReg = await BirthRegistration.findOne({where: { id }});
  const path = birthReg ? birthReg.file_path : null;
  if (!path || !userFilePath || !applicant) {
    return res.status(404).send("Application file path not found");
  }
  
  const sigPath = path.join(birthReg.file_path, 'sig', 'signature.bin');
  const messagePath = path.join(birthReg.file_path, 'message', 'message.txt');
  const privateKey = await tpmService.decryptWithRootKey(
      await fs.promises.readFile(userFilePath.private_key, 'utf8')
    );

  // In a real application, you would retrieve the signature and message based on the ID
  // Placeholder for user signature and message
  const message = `${applicant.hoVaTen} cho phép kiểm tra`;
  const gonnaSignMessage = JSON.stringify({message: message, id: id, userId: userId});
  const randomPath = crypto.randomBytes(16).toString("hex");
  const signing_result = await Mldsa_wrapper.sign(privateKey, message, `/tmp/${randomPath}.sig`);
  if (!signing_result) {
    return res.status(500).send("Signing procedure failed");
  }

  const signature = await fs.promises.readFile(`/tmp/${randomPath}.sig`);
  const signatureB64 = Buffer.from(signature).toString("base64");

  const combinedString = `applicant#${gonnaSignMessage}##${signatureB64}##`;

  try {
    const qrCodeImage = await QRCode.toBuffer(combinedString);
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": qrCodeImage.length,
    });
    res.end(qrCodeImage);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating QR code");
  }
};

export const getIssuerQrSignature = async (req,res) => {
  const { id } = req.params;
  
  const userId = req.user.userId; // Assuming userId is available in the request object
  if(userId !== id){
    return res
  }
  const applicant = await Citizen.findOne({ where: { id: userId } });
  const userFilePath = FilePath.findOne({ where: { userId } });
  // Replace here 
  const birthReg = await BirthRegistration.findOne({where: { id }});
  const path = birthReg ? birthReg.file_path : null;
  if (!path || !userFilePath || !applicant) {
    return res.status(404).send("Application file path not found");
  }

  
  // Placeholder for issuer signature and message
  let messageToSign = await fs.promises.readFile(`${birthReg.file_path}/sig/issuer_message.txt`, 'utf8');
  const issuerPath = path.join(birthReg.file_path, 'sig', 'issuer_signature.bin');
  const issuerSignature = await fs.promises.readFile(issuerPath);
  const issuerSignatureB64 = Buffer.from(issuerSignature).toString("base64");  

  // In a real application, you would retrieve signature and message based on the ID
  // For example, from a database or another service.
  // if (!signature || !message) {
  //   return res.status(404).send("Issuer signature not found");
  // }
  const message = JSON.stringify({message: messageToSign, id: id, userId: userId});
  const combinedString = Buffer.from(`issuer${message}##${issuerSignatureB64}`).toString("base64");

  try {
    const qrCodeImage = await QRCode.toBuffer(combinedString);
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": qrCodeImage.length,
    });
    res.end(qrCodeImage);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating QR code");
  }
}

export const verifyQrSignature = async (req, res) => {
  try {
    const { qrCodeImageBase64 } = req.body;
    if (!qrCodeImageBase64) {
      return res.status(400).send("QR code image data is required.");
    }

    // Decode the base64 image data to a BufferArray
    const decodedBuffer = Buffer.from(qrCodeImageBase64, "base64");

    const image = await Jimp.read(imageBuffer);
    
    // Create QR code reader instance
    const qr = new QrCode();
    
    // Decode QR code from image
    const decodedData = await new Promise((resolve, reject) => {
      qr.callback = function (err, value) {
        if (err) {
          reject(err);
        } else {
          resolve(value.result);
        }
      };
      qr.decode(image.bitmap);
    });

    // Call the placeholder verify function
    const parts = decodedData.split("##");
    const signatureType = parts[0];
    const message = parts[1];
    const signature = Buffer.from(parts[2], "base64");  
    if(signatureType === "issuer"){
      const info = JSON.parse(message);
      const applicationId = info.id;
      const signerId = info.userId;
      const recvMessage = info.message;
      const bcaFilePath = FilePath.findOne({ where: { userId: signerId } });  
      const certPath = path.join(bcaFilePath.file_path, 'cert', 'signed_cert.pem');
      const signaturePath = `/tmp/${crypto.randomBytes(16).toString("hex")}.sig`;
      await fs.promises.writeFile(signaturePath, signature);
      const verifyResult = await Mldsa_wrapper.verifyWithCertificate(recvMessage, certPath,signaturePath );
      if(!verifyResult){
        return res.status(400).send("Signature verification failed.");
      }
      await fs.promises.unlink(signaturePath); // Clean up the temporary signature file

      return res.status(200).json({
        status: "success",
        message: "Issuer signature verified successfully. You can proceed with the application.",
      })
    }
    else if(signatureType === "applicant"){
      const info = JSON.parse(message);
      const applicationId = info.id;
      const signerId = info.userId;
      const recvMessage = info.message;
      const userFilePath = FilePath.findOne({ where: { signerId } });
      const certPath = path.join(userFilePath.file_path, 'cert', 'signed_cert.pem');
      const signaturePath = `/tmp/${crypto.randomBytes(16).toString("hex")}.sig`;
      await fs.promises.writeFile(signaturePath, signature);
      const verifyResult = await Mldsa_wrapper.verifyWithCertificate(recvMessage,certPath,signaturePath);
      if(!verifyResult){
        return res.status(400).send("Signature verification failed.");
      }
      await fs.promises.unlink(signaturePath); // Clean up the temporary signature file
      return res.status(200).json({
        message: "Applicant signature verified successfully. You can proceed with the application.",
        status: "success",
      })
    } else {
      return res.status(400).send("Invalid QR code data format.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing QR code verification.");
  }
  finally{
    // cleanup temporary files if needed
    
  }
}