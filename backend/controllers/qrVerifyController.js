// import QRCode from "qrcode";
import BirthRegistration from "../models/BirthRegistration.js";
import Citizen from "../models/Citizen.js";
import FilePath from "../models/FilePath.js";
import tpmService from "../utils/crypto/tpmController.js";
import path from "path";
import Mldsa_wrapper from "../utils/crypto/MLDSAWrapper.js";
import crypto from "crypto";
// import Jimp from "jimp";
// import QrCode from "qrcode-reader";
import Sigs from "../models/Sigs.js";
import fs from "fs";


export const fetchSignatureFromUUID = async (req, res) => {
  const { uuid } = req.params; // UUID of the signature
  try {
    const sig = await Sigs.findOne({ where: { UUID: uuid } });
    const birthReg = await BirthRegistration.findOne({ where: { id: sig.birth_registration_id } });
    const applicant = await Citizen.findOne({ where: { id: birthReg.applicant_id } });
    const userFilePath = await FilePath.findOne({ where: { user_id: applicant.id } });
    if (!sig || !birthReg || !applicant || !userFilePath) {
      return res.status(404).json({
        success: false,
        message: "Signature, birth registration, applicant, or user file path not found"
      });
    }
    // const certPath = path.join(userFilePath.certificate, 'user_cert.pem');
    const caCertPath = await FilePath.findOne({ where: { user_id: 5 } });
    const caCert = caCertPath.certificate;
    const signature = await fs.promises.readFile(sig.path, 'utf8');
    const caCertContent = await fs.promises.readFile(caCert, 'utf8');
    const certContent = await fs.promises.readFile(userFilePath.certificate, 'utf8');
    const resData = {
      signature: signature,
      cert: certContent,
      caCert: caCertContent,
      applicantName: applicant.hoVaTen,
      birthRegId: birthReg.id,
      sigType: sig.type
    };
    return res.json({
      success: true,
      ...resData
    })
  } catch (error) {
    console.error("Error fetching signature:", error);
    res.status(500).send("Internal server error");
  }
}