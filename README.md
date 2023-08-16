# Note on fork:

This repository is a fork off of islandis-login. It's purpose is to address the issue with validation of
certificates, see: https://github.com/mojoweb/islandis-login/pull/6.

To use this package, rather than the original, please replace your usage of islandis-login with `@island.is/login`

```sh
yarn add @island.is/login
```

# islandis-login

Library to make life easier for you => **Handle the Island.is Login.**

To get started with Island.is Identification and Authentication Services (IAS) you'll need to apply: [https://island.is/innskraningarthjonusta](https://island.is/innskraningarthjonusta).

Once you've registered your company you can use this library to handle all the **boring stuff** for you.

### How it works

In your application to Island.is IAS you'll be required to provide a callback URI to which a token will be POSTed on user login attempts (login attempts initiated via _innskraning.island.is/?id=yourcompany.is_).

The token the Ísland.is IAS returns to the service provider, for decoding by the service provider, is a digitally signed SAML 2 token encoded in Base 64 and UTF-8.

The SAML message returned by IAS will be digitally signed with a certificate issued by Auðkenni ehf. (Traustur bunadur). Furthermore, the message will have been transformed with xml-exc-c14n (**Sh\*t! XML... boring right?**), prior to being digested with SHA256 and signed with a 2048-bit RSA key.

This library helps with validating and verifying the SAML token and the provided signature.

## Usage

Use the constructor function to pass in the `audienceUrl`. The `audienceUrl` should be the hostname of the server the IAS request is sent to.

There is one public function provided => **`.verify()`**. Pass the token you receive from Island.is into this function and the library will make the magic happen.

**IslandIsLogin** validates the signature according to the [technical specifications](https://island.is/innskraningarthjonusta/taeknilegar-upplysingar-taeknimenn) provided by the Ísland.is IAS.

### Example usage

To install the module using npm:

```shell
$ npm i --save islandis-login
```

In Node.js, using the bundled Audkenni certificate:

```js
const IslandISLogin = require("islandis-login");

const token =
    "[token you received to your callbackURI from Island.is login attempt]";

const loginIS = new IslandISLogin({
    audienceUrl: "api.vefur.is", // should be the hostname of the domain you registered with Island to which the request is sent. Used for validation purposes.
});
```

Or by passing a relative path to the Audkenni cert:

```js
const IslandISLogin = require("islandis-login");

const token =
    "[token you received to your callbackURI from Island.is login attempt]";

const loginIS = new IslandISLogin({
    audienceUrl: "api.vefur.is",
    certPath: "cert/SomeOtherCert.pem",
});
```

Or pass the cert as string:

```js
const IslandISLogin = require("islandis-login");

const token =
    "[token you received to your callbackURI from Island.is login attempt]";

const cert = `
-----BEGIN CERTIFICATE-----
MIIFfDCCA2SgAwIBAgICAyQwDQYJKoZIhvcNAQELBQAwazELMAkGA1UEBhMCSVMx
...
-----END CERTIFICATE-----
`;

const loginIS = new IslandISLogin({
    audienceUrl: "api.vefur.is",
    cert,
});
```

Now verify the incoming token:

```js
loginIS
    .verify(token)
    .then((user) => {
        // Token is valid, return user object
        console.log("User object ");
        console.log(user);
    })
    .catch((err) => {
        // Error verifying signature or token is invalid.
        console.log("Error verifying token");
        console.log(err);
    });
```

#### This is what the user object looks like:

```json
{
    "user": {
        "kennitala": "2309932389",
        "mobile": "6210193",
        "fullname": "Patrekur Maron Magnússon",
        "ip": "69.153.265.128",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.69 (KHTML, like Gecko) Chrome/69.0.3511.69 Safari/537.69",
        "destinationSSN": "5207170800",
        "authId": "",
        "authenticationMethod": "Íslykill"
    },
    "extra": {
        "destination": "https://api.vefur.is/innskraning",
        "audienceUrl": "api.vefur.is",
        "dates": { "notBefore": 1584812651351, "notOnOrAfter": 1584812981351 }
    }
}
```

**A note on the fields provided:**

The `mobile` value is not always present, it depends on if "Rafræn Skilríki" or "Íslykill" is used or not and other factors. The phonenumber is only delivered sometimes by Island.is so we can't count on it being present even if we force the user to use "Rafræn skilríki".

`authenticationMethod` value will be _"Íslykill"_ if IceKey is used during login and _"Rafræn símaskilríki"_ if e-Authentication using SIM card (Rafræn skilríki) was used.

You can force the user to use "Rafræn skilríki" by adding &qaa=4 to the login link e.g. https://innskraning.island.is/?id=advania.is&qaa=4.

`authId` can be provided by adding it to the original login link, e.g. https://innskraning.island.is/?id=advania.is&authId=11111111-1111-1111-1111-111111111111.

The `authId` will persist throughout the whole process,`authId` must be a valid GUID. This `authId` can e.g. be used to make sure that the login attempt was made by you.

**For maximum security you should compare the value in the `userAgent` field to the value the user has client side to make sure that the request originated from the same user.**

This is all covered in more detail in the implementation guide: [https://island.is/innskraningarthjonusta/taeknilegar-upplysingar-taeknimenn](https://island.is/innskraningarthjonusta/taeknilegar-upplysingar-taeknimenn).

#### Errors

List of potential errors that you might encounter calling **`.verify()`**:

```json
{
    "id": "INVALID-TOKEN-XML",
    "reason": "Invalid login token - cannot parse XML from Island.is."
}
```

```json
{
    "id": "CERTIFICATE-INVALID",
    "reason": "[Certificate-Error-Object]"
}
```

```json
{
    "id": "AUDIENCEURL-MISSING",
    "reason": "You must provide an 'audienceUrl' in the options when calling the constructor function."
}
```

```json
{
    "id": "LOGIN-REQUEST-EXPIRED",
    "reason": "Login request has expired."
}
```

```json
{
    "id": "AUDIENCEURL-NOT-MATCHING",
    "reason": "The AudienceUrl you provide must match data from Island.is."
}
```

## Tests

See the [fixtures](./fixtures/) example files.

You need a valid token returned from island.is that deserializes to a user object.

## Projects utilizing the library

[Myntkaup.is](https://myntkaup.is/) - Myntkaup is Iceland's best way to buy and sell Bitcoin. 🚀

[Your Project here] - Do you have a project that should be here? Just ping us!

## Made with ☕ + 🍺 by

This library was made by the team at [Mojo.is](https://www.mojo.is/) - You can hire us if you need top notch software development services.

Pull requests are welcomed and encouraged! 🙌

## Contributers

The following individuals had a hand in making this library:

[pmm1](https://github.com/pmm1)

[atlipall](https://github.com/atlipall)

[sebastienne](https://github.com/sebastienne)

## License

MIT
