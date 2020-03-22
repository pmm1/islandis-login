const { parseString } = require("xml2js");
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

    IslandISLogin.prototype.verify = token => {
        const xml = new Buffer.from(token, "base64").toString("utf8");

        return new Promise((resolve, reject) => {
            // parse XML
            parseString(xml, (err, json) => {
                if (err) {
                    return reject({
                        id: "INVALID-TOKEN-XML",
                        reason:
                            "Invalid login token - cannot parse XML from Island.is.",
                    });
                }

                const x509signature =
                    json.Response.Signature[0].KeyInfo[0].X509Data[0]
                        .X509Certificate[0];

                // validate signature of document.
                const { isValid, certErr } = validateCert(xml, x509signature);

                if (!isValid) {
                    return reject({
                        id: "CERTIFICATE-INVALID",
                        reason: certErr,
                    });
                }

                // Array of attributes about the user
                const attribs =
                    json.Response.Assertion[0].AttributeStatement[0].Attribute;

                const conditions = json.Response.Assertion[0].Conditions[0];

                const audienceUrl =
                    conditions.AudienceRestriction[0].Audience[0];

                const destination = json.Response.$.Destination;

                const userOb = {
                    kennitala: "",
                    mobile: "",
                    fullname: "",
                    ip: "",
                    userAgent: "",
                    destinationSSN: "",
                    date: {
                        notBefore: new Date(conditions.$.NotBefore).getTime(),
                        notOnOrAfter: new Date(
                            conditions.$.NotOnOrAfter
                        ).getTime(),
                    },
                    authId: "",
                    authenticationMethod: "",
                    audienceUrl: audienceUrl,
                };

                // Gather neccessary data from SAML request from island.is.
                for (let i = 0; i < attribs.length; i++) {
                    const item = attribs[i];

                    if (item.$.Name === "UserSSN") {
                        userOb.kennitala = item.AttributeValue[0]._;
                        continue;
                    }

                    if (item.$.Name === "Mobile") {
                        userOb.mobile = item.AttributeValue[0]._.replace(
                            "-",
                            ""
                        );
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

                // Used to test locally with a token that has expired.
                // verifyDates should always be true in Production!
                if (this.options.verifyDates) {
                    // Verify that the login request is not too old.
                    const timestamp = Date.now();

                    if (
                        !(
                            timestamp < userOb.date.notOnOrAfter &&
                            timestamp > userOb.date.notBefore
                        )
                    ) {
                        return reject({
                            id: "LOGIN-REQUEST-EXPIRED",
                            reason: "Login request has expired.",
                        });
                    }
                }

                // All checks passed - Return User
                resolve({
                    user: userOb,
                    extra: {
                        destination: destination,
                        audienceUrl: audienceUrl,
                    },
                });
            });
        });
    };
};

module.exports = IslandISLogin;
