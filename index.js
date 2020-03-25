const { parseStringPromise } = require("xml2js");
const { validateCert } = require("./src/validateSignature.js");

const IslandISLogin = function() {
    const defaults = {
        verifyDates: true,
        audienceUrl: null,
    };

    // Create options by extending defaults with the passed in arguments
    if (arguments[0] && typeof arguments[0] === "object") {
        this.options = extendDefaults(defaults, arguments[0]);
    } else {
        this.options = defaults;
    }

    IslandISLogin.prototype.verify = token => {
        const xml = getXmlFromToken(token);

        return new Promise((resolve, reject) => {
            // Parse XML to JSON
            parseStringPromise(xml)
                .then(async json => {
                    const x509signature =
                        json.Response.Signature[0].KeyInfo[0].X509Data[0]
                            .X509Certificate[0];

                    // Validate signature of XML document from Island.is, verify that the
                    // XML document was signed by Island.is and verify certificate issuer.
                    try {
                        await validateCert(xml, x509signature);
                    } catch (e) {
                        return reject({
                            id: "CERTIFICATE-INVALID",
                            reason: e,
                        });
                    }

                    const audienceUrl =
                        json.Response.Assertion[0].Conditions[0]
                            .AudienceRestriction[0].Audience[0];

                    if (!this.options.audienceUrl) {
                        return reject({
                            id: "AUDIENCEURL-MISSING",
                            reason:
                                "You must provide an 'audienceUrl' in the options when calling the constructor function.",
                        });
                    }

                    // Check that the message is intented for the provided audienceUrl.
                    // This is done to protect against a malicious actor using a token
                    // intented for another service that also uses the island.is login.
                    if (this.options.audienceUrl !== audienceUrl) {
                        return reject({
                            id: "AUDIENCEURL-NOT-MATCHING",
                            reason:
                                "The AudienceUrl you provide must match data from Island.is.",
                        });
                    }

                    const dates = {
                        notBefore: new Date(
                            json.Response.Assertion[0].Conditions[0].$.NotBefore
                        ).getTime(),
                        notOnOrAfter: new Date(
                            json.Response.Assertion[0].Conditions[0].$.NotOnOrAfter
                        ).getTime(),
                    };

                    // Used to test locally with a token that has expired.
                    // verifyDates should always be true in Production!
                    if (this.options.verifyDates) {
                        // Verify that the login request is not too old.
                        const timestamp = Date.now();

                        if (
                            !(
                                timestamp < dates.notOnOrAfter &&
                                timestamp > dates.notBefore
                            )
                        ) {
                            return reject({
                                id: "LOGIN-REQUEST-EXPIRED",
                                reason: "Login request has expired.",
                            });
                        }
                    }

                    // Array of attributes about the user
                    const attribs =
                        json.Response.Assertion[0].AttributeStatement[0]
                            .Attribute;

                    // Get user data from attribs array
                    const userOb = gatherUserData(attribs);
                    const destination = json.Response.$.Destination;

                    // All checks passed - return Data
                    return resolve({
                        user: userOb,
                        extra: {
                            destination: destination,
                            audienceUrl: audienceUrl,
                            dates: dates,
                        },
                    });
                })
                .catch(err => {
                    return reject({
                        id: "INVALID-TOKEN-XML",
                        reason:
                            "Invalid login token - cannot parse XML from Island.is.",
                    });
                });
        });
    };

    function gatherUserData(attribs) {
        const userOb = {
            kennitala: "",
            mobile: "",
            fullname: "",
            ip: "",
            userAgent: "",
            destinationSSN: "",
            authId: "",
            authenticationMethod: "",
        };

        // Gather neccessary data from SAML request from island.is.
        for (let i = 0; i < attribs.length; i++) {
            const item = attribs[i];

            if (item.$.Name === "UserSSN") {
                userOb.kennitala = item.AttributeValue[0]._;
                continue;
            }

            if (item.$.Name === "Mobile") {
                userOb.mobile = item.AttributeValue[0]._.replace("-", "");
                continue;
            }

            if (item.$.Name === "Name") {
                userOb.fullname = item.AttributeValue[0]._;
                continue;
            }

            if (item.$.Name === "IPAddress") {
                userOb.ip = item.AttributeValue[0]._;
                continue;
            }

            if (item.$.Name === "UserAgent") {
                userOb.userAgent = item.AttributeValue[0]._;
                continue;
            }

            if (item.$.Name === "AuthID") {
                userOb.authId = item.AttributeValue[0]._;
                continue;
            }

            if (item.$.Name === "Authentication") {
                userOb.authenticationMethod = item.AttributeValue[0]._;
                continue;
            }

            if (item.$.Name === "DestinationSSN") {
                userOb.destinationSSN = item.AttributeValue[0]._;
                continue;
            }
        }

        return userOb;
    }

    // Utility method to extend defaults with user options
    function extendDefaults(source, properties) {
        let property;
        for (property in properties) {
            if (properties.hasOwnProperty(property)) {
                source[property] = properties[property];
            }
        }
        return source;
    }

    function getXmlFromToken(token) {
        return new Buffer.from(token, "base64").toString("utf8");
    }
};

module.exports = IslandISLogin;
