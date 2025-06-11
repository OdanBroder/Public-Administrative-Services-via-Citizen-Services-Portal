import QRCode from "qrcode";
import BirthRegistration
 from "../models/BirthRegistration";
export const getApplicantQrSignature = async (req,res) => {
  const { id } = req.params; // application id
  
  // Replace here 
  const birthReg = await BirthRegistration.findOne({where: { id }});
  const path = birthReg ? birthReg.file_path : null;
  if (!path) {
    return res.status(404).send("Application file path not found");
  }
  
  const sigPath = path.join(birthReg.file_path, 'sig', 'signature.bin');
  const messagePath = path.join(birthReg.file_path, 'message', 'message.txt');
  
  // In a real application, you would retrieve the signature and message based on the ID
  // Placeholder for user signature and message
  let signature = await fs.promises.readFile(sigPath);
  let message = await fs.promises.readFile(messagePath);

  /* {"NGUYEN THANH AN cho phep truy cap||signature (duoc ky boi NGUYEN THNAH AN)||"url: hien thi thong tin application" }" */
  // In a real application, you would retrieve signature and message based on the ID
  // For example, from a database or another service.
  // if (!signature || !message) {
  //   return res.status(404).send("User signature not found");
  // }

  const combinedString = Buffer.from(`${signature}##${message}`).toString("base64");

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

  // Placeholder for issuer signature and message
  let signature = `issuer_signature_data_${id}`;
  let message = `This is a message from issuer ${id}`;
  const issuerPath = path.join(birthReg.file_path, 'sig', 'issuer_signature.bin');

  // In a real application, you would retrieve signature and message based on the ID
  // For example, from a database or another service.
  // if (!signature || !message) {
  //   return res.status(404).send("Issuer signature not found");
  // }

  const combinedString = Buffer.from(`${signature}##${message}`).toString("base64");

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