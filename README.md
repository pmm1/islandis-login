# islandis-login

Library to make life easier for you --> **Handle the Island.is Login.**

To get started with Island.is Identification and Authentication Services (IAS) you'll need to apply: [vefur.island.is/innskraningarthjonusta/um/](https://vefur.island.is/innskraningarthjonusta/um/)

Once you've registered your company you can use this library to handle all the **boring stuff** for you.

### How it works

In your application to Island.is IAS you'll be required to provide a callback URI to which a token will be POSTed on user login attempts (login attempts initiated via _innskraning.island.is/?id=yourcompany.is_).

The token the Ísland.is IAS returns to the service provider, for decoding by the service provider, is a digitally signed SAML 2 token encoded in Base 64 and UTF-8.

The SAML message returned by IAS will be digitally signed with a certificate issued by Auðkenni ehf. (Traustur bunadur). Furthermore, the message will have been transformed with xml-exc-c14n (**Sh\*t! XML... boring right?**), prior to being digested with SHA256 and signed with a 2048-bit RSA key.

This library helps with validating and verifying the SAML token and the provided signature.

## Usage

Use the constructor function to pass in the kennitala of the company you are implementing the IAS for.

There is one public function provided --> `.verify()`. Pass the token you receive from Island.is into this function and we'll take care of the rest.

IslandIsLogin validates the signature according to the [technical specifications](https://vefur.island.is/innskraningarthjonusta/taeknilegar-upplysingar/) provided by the Ísland.is IAS.

### Example usage

To install the module using npm:

```shell
$ npm i --save islandis-login
```

In Node.js:

```js
const IslandISLogin = require("islandis-login");

const token =
    "[token you received to your callbackURI from Island.is login attempt]";

const loginIS = new IslandISLogin({
    kennitala: "5207170800", // should be the kennitala of a company registered with Island.is
});

loginIS
    .verify(token)
    .then(user => {
        // Token is valid, return user object
        console.log("User object ");
        console.log(user);
    })
    .catch(err => {
        // Error verifying signature or token is invalid.
        console.log("Error verifying token");
        console.log(err);
    });
```

#### This is what the user object looks like:

```json
{
    "kennitala": "2309932389",
    "mobile": "6210193",
    "fullname": "Patrekur Maron Magnússon",
    "ip": "87.153.265.128",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3687.132 Safari/537.36",
    "destinationSSN": "5207170800",
    "date": { "notBefore": 1584743557574, "notOnOrAfter": 1584743887574 },
    "authId": "",
    "authenticationMethod": "Íslykill"
}
```

**A note on the fields provided:**

`mobile` is not always present, it depends on if "Rafræn Skilríki" or "Íslykill" is used or not and other factors. The phonenumber is only sometimes delivered by Island.is so we can't count on it being present even if we force the user to use "Rafræn skilríki".

`authenticationMethod` will be "Íslykill" if IceKey is used during login and "Rafræn Skilríki" if "Rafræn Skilríki" were used.

You can force the user to use "Rafræn skilríki" by adding &qaa=4 to the login link e.g. https://innskraning.island.is/?id=advania.is&qaa=4

`authId` can be provided by adding it to the original login link, e.g. https://innskraning.island.is/?id=advania.is&authId=11111111-1111-1111-1111-111111111111

The `authId` will persist through the whole process,`authId` must be a valid GUID. This `authId` can e.g. be used to make sure that the login attempt was made by you.

You should compare the value in the `userAgent` field to the value the user has client side to make sure that the request originated from the same user.

This is all covered in more detail the implementation guide: [vefur.island.is/innskraningarthjonusta/taeknilegar-upplysingar/](https://vefur.island.is/innskraningarthjonusta/taeknilegar-upplysingar/)

#### Errors

List of potential errors that you might encounter:

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
    "id": "COMPANY-SSN-NOT-MATCHING",
    "reason": "Company kennitala provided must match data from Island.is."
}
```

```json
{
    "id": "LOGIN-REQUEST-EXPIRED",
    "reason": "Login request has expired."
}
```

## Projects utilizing the library

[Myntkaup.is](https://myntkaup.is/) - Myntkaup is Iceland's best way to buy and sell Bitcoin. 🚀

## Made with ☕ + 🍺 by

This library was made by the team at [Mojo.is](https://www.mojo.is/) - Hire us if you need top notch software development services.

Pull requests are welcomed and encouraged! 🙌

## License

MIT
