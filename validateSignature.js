const select = require("xml-crypto").xpath;
const dom = require("xmldom").DOMParser;
const SignedXml = require("xml-crypto").SignedXml;
const x509 = require("x509");

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

function checkCert(key) {
    const cert = x509.parseCert(key);

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

/*

    Validates x509 certificate validity, checks certificate 
    and validates digital signature of xml

    returns Boolean - true if cert is valid false otherwise.

*/
function validate(xml, key) {
    const doc = new dom().parseFromString(xml);

    const validCert = checkCert(key);

    if (!validCert) {
        return false;
    }

    const signature = select(
        doc,
        "/*/*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']"
    )[0];

    const sig = new SignedXml();
    sig.keyInfoProvider = new FileKeyInfo(key);
    sig.loadSignature(signature);
    const res = sig.checkSignature(xml);

    if (!res) {
        return {
            isValid: res,
            certErr: sig.validationErrors,
        };
    }

    return {
        isValid: res,
    };
}

module.exports = {
    validateCert: validate,
};
