const path = require("path");
const { xpath } = require("xml-crypto");
const { DOMParser } = require("@xmldom/xmldom");
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

    this.getKeyInfo = function (key, prefix) {
        prefix = prefix || "";
        prefix = prefix ? prefix + ":" : prefix;

        return `<${prefix}X509Data></${prefix}X509Data>`;
    };

    this.getKey = function () {
        return this.key;
    };
}

function fromPemFile(certPath) {
    const pem = path.resolve(__dirname, `../${certPath}`);
    return Certificate.fromPEM(readFileSync(pem));
}

function fromPemString(cert) {
    return Certificate.fromPEM(cert);
}

function getCertificate(options) {
    return options.cert === undefined
        ? fromPemFile(options.certPath)
        : fromPemString(options.cert);
}

function isCertificateDataValid(cert) {
    const { serialName } = cert.subject;
    const { organizationName } = cert.issuer;
    const { validFrom, validTo } = cert;

    if (serialName !== "6503760649" || organizationName !== "Audkenni hf.") {
        return false;
    }

    const timestamp = Date.now();

    if (
        timestamp < new Date(validFrom).getTime() ||
        timestamp > new Date(validTo).getTime()
    ) {
        return false;
    }

    return true;
}

function checkSignature(doc, pem, xml) {
    const signature = xpath(
        doc,
        "/*/*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']"
    )[0];

    const sig = new SignedXml();
    sig.keyInfoProvider = new FileKeyInfo(pem);
    sig.loadSignature(signature);
    const isValid = sig.checkSignature(xml);

    return isValid;
}

function isCertificateValid(certificate, audkenniCert) {
    // Reference: https://www.audkenni.is/adstod/skilriki-kortum/skilrikjakedjur/

    // we only need to verify the authority cert because that is the cert used
    // to sign the message from Island.is
    if (
        audkenniCert.verifySubjectKeyIdentifier() &&
        certificate.verifySubjectKeyIdentifier() &&
        audkenniCert.checkSignature(certificate) === null &&
        certificate.isIssuer(audkenniCert)
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
function validate(xml, signature, audkenniCert) {
    return new Promise((resolve, reject) => {
        const doc = new DOMParser().parseFromString(xml);

        // construct x509 certificate
        const pem = certToPEM(signature);
        const cert = Certificate.fromPEM(new Buffer.from(pem));

        // Verify certificate data, i.e.
        // serialNumber & organization name is Auðkenni etc.
        if (!isCertificateDataValid(cert)) {
            return reject("XML message is not signed by Auðkenni.");
        }

        // Verify that the XML document provided by the request was signed by the
        // certificate provided with the request.
        if (!checkSignature(doc, pem, xml)) {
            return reject("XML signature is invalid.");
        }

        // Verify that the certificate we get from the Island.is request
        // is signed and issued by Traustur Bunadur certificate.
        if (!isCertificateValid(cert, audkenniCert)) {
            return reject(
                "The XML document is not signed by Þjóðskrá Íslands."
            );
        }

        return resolve();
    });
}

module.exports = {
    validateCert: validate,
    getCertificate,
};
