const select = require("xml-crypto").xpath;
const dom = require("xmldom").DOMParser;
const SignedXml = require("xml-crypto").SignedXml;
const x509 = require("x509");
const { Certificate } = require("@fidm/x509");
const { readFileSync } = require("fs");
const path = require("path");

/**
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

    if (cert.subject.serialNumber !== "6503760649") {
        return false;
    }

    if (cert.issuer.organizationName !== "Audkenni ehf.") {
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
    const signature = select(
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
    const c = Certificate.fromPEM(new Buffer.from(certToPEM(certificate)));

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
    if (cert == null) {
        return "";
    } else if (
        cert.indexOf("BEGIN CERTIFICATE") === -1 &&
        cert.indexOf("END CERTIFICATE") === -1
    ) {
        cert = "-----BEGIN CERTIFICATE-----\n" + cert;
        cert = cert + "\n-----END CERTIFICATE-----\n";
        return cert;
    } else {
        return cert;
    }
}

/*

    Validates x509 certificate validity, checks certificate 
    and validates digital signature of xml

    returns Boolean - true if cert is valid false otherwise.

*/
function validate(xml, cert) {
    const doc = new dom().parseFromString(xml);

    // Verify certificate data, i.e.
    // serialNumber & organization name is Auðkenni etc.
    const validCertData = checkCert(cert);

    if (!validCertData) {
        return {
            isValid: false,
        };
    }

    // Verify signature
    const checkSig = checkSignature(doc, cert, xml);

    if (!checkSig.isValid) {
        return {
            isValid: checkSig.isValid,
            certErr: checkSig.certErr,
        };
    }

    // Verify that certificate we get from the Island.is request
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
