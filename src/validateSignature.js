const x509 = require("x509");
const path = require("path");
const { xpath } = require("xml-crypto");
const { DOMParser } = require("xmldom");
const { SignedXml } = require("xml-crypto");
const { Certificate } = require("@fidm/x509");
const { readFileSync } = require("fs");

/**
 *
 * A key info provider implementation
 *
 */
function FileKeyInfo(key) {
    this.key = key;

    this.getKeyInfo = function(key, prefix) {
        prefix = prefix || "";
        prefix = prefix ? prefix + ":" : prefix;

        return `<${prefix}X509Data></${prefix}X509Data>`;
    };

    this.getKey = function() {
        return this.key;
    };
}

function checkCert(certString) {
    let cert;

    try {
        cert = x509.parseCert(certString);
    } catch (e) {
        return false;
    }

    if (
        cert.subject.serialNumber !== "6503760649" ||
        cert.issuer.organizationName !== "Audkenni ehf."
    ) {
        return false;
    }

    const dates = {
        notBefore: new Date(cert.notBefore).getTime(),
        notAfter: new Date(cert.notAfter).getTime(),
    };

    const currentTime = Date.now();

    if (!(currentTime > dates.notBefore && currentTime < dates.notAfter)) {
        return false;
    }

    return true;
}

function checkSignature(doc, cert, xml) {
    const signature = xpath(
        doc,
        "/*/*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']"
    )[0];

    const sig = new SignedXml();
    sig.keyInfoProvider = new FileKeyInfo(cert);
    sig.loadSignature(signature);
    const res = sig.checkSignature(xml);

    return {
        isValid: res,
        certErr: sig.validationErrors,
    };
}

function isCertificateValid(certificate) {
    const c = Certificate.fromPEM(new Buffer.from(certificate));

    const certs = Certificate.fromPEMs(
        readFileSync(path.resolve(__dirname, "../cert/Oll_kedjan.pem"))
    );

    // Reference: https://www.audkenni.is/adstod/skilriki-kortum/skilrikjakedjur/
    const AudkennisRot = certs[0];
    const TraustAudkenni = certs[1];
    const TrausturBunadur = certs[2];

    // we only need to verify TrausturBunadur cert because that is the cert used
    // to sign the message from Island.is
    if (
        TrausturBunadur.verifySubjectKeyIdentifier() &&
        c.verifySubjectKeyIdentifier() &&
        TrausturBunadur.checkSignature(c) === null &&
        c.isIssuer(TrausturBunadur)
    ) {
        return true;
    }

    return false;
}

function certToPEM(cert) {
    return `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----`;
}

/*

    Validates x509 certificate validity, checks certificate 
    and validates digital signature of XML.

*/
function validate(xml, signature) {
    const doc = new DOMParser().parseFromString(xml);

    // construct x509 certificate
    const cert = certToPEM(signature);

    // Verify certificate data, i.e.
    // serialNumber & organization name is Auðkenni etc.
    const validCertData = checkCert(cert);

    if (!validCertData) {
        return {
            isValid: false,
        };
    }

    // Verify that the XML file provided by the request was signed by the
    // certificate provided.
    const checkSig = checkSignature(doc, cert, xml);

    if (!checkSig.isValid) {
        return {
            isValid: checkSig.isValid,
            certErr: checkSig.certErr,
        };
    }

    // Verify that the certificate we get from the Island.is request
    // is signed and issued by Traustur Bunadur certificate.
    const isCertValid = isCertificateValid(cert);

    if (!isCertValid) {
        return {
            isValid: false,
            certErr: null,
        };
    }

    return {
        isValid: true,
    };
}

module.exports = {
    validateCert: validate,
};
