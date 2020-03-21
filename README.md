# islandis-login

Node library which handles login via Island.is

To get started with Island.is Identification and Authentication Services (IAS) you'll need to apply: [vefur.island.is/innskraningarthjonusta/um/](https://vefur.island.is/innskraningarthjonusta/um/)

Once you've registered your company you can use this library to handle all the _boring stuff for you_.

In your application to Island.is IAS you'll be required to provide a callback URI to which a token will be POSTed on user login attempts (login attempts initiated via innskraning.island.is/?id=yourcompany.is).

The token the Ísland.is IAS returns to the service provider, for decoding by the service provider, is a digitally signed SAML 2 token encoded in Base 64 and UTF-8.

The SAML message returned by IAS will be digitally signed with a certificate issued by Auðkenni ehf. (Traustur bunadur). Furthermore, the message will have been transformed with xml-exc-c14n (Fu\*k! XML... boring right?), prior to being digested with SHA256 and signed with a 2048-bit RSA key.

This library helps with validating and verifying the SAML token and the provided signature.

### Usage

Use the constructor to pass in the kennitala of the company you are implementing the IAS for.

There is one public function provided --> `.verify()`. Pass the token you receive from Island.is into this function and we'll take care of the rest.

IslandIsLogin validates the signature according to the [technical specifications](https://vefur.island.is/innskraningarthjonusta/taeknilegar-upplysingar/) provided by the Ísland.is identification and authentication services.

#### Example usage

```js
const IslandISLogin = require("islandis-login");

const loginIS = new IslandISLogin({
    kennitala: "5207170800", // should be the kennitala of a company registered with Island.is
});

loginIS
    .verify(token)
    .then(user => {
        // Token is valid
        console.log("User object ");
        console.log(user);
    })
    .catch(err => {
        // Error verifying signature or token is invalid.
        console.log("Error verifying token");
        console.log(err);
    });
```

This is how the user object looks like:

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

_A note on the fields provided:_

`mobile` is not always present, it depends on if "Rafræn Skilríki" or "Íslykill" is used or not and other factors. The phonenumber is only sometimes delivered by Island.is so we can't count on it being present even if we force the user to use "Rafræn skilríki".

`authenticationMethod` will be "Íslykill" if IceKey is used during login and "Rafræn Skilríki" if

You can force the user to use "Rafræn skilríki" by adding &qaa=4 to the link e.g. https://innskraning.island.is/?id=advania.is&qaa=4

`authId` can be provided by adding it to the original sign-in link, e.g. https://innskraning.island.is/?id=advania.is&authId=11111111-1111-1111-1111-111111111111

authId must be a valid GUID.

This is all covered in more detail the implementation guide: [vefur.island.is/innskraningarthjonusta/taeknilegar-upplysingar/](https://vefur.island.is/innskraningarthjonusta/taeknilegar-upplysingar/)

## Projects utilizing the library

[Myntkaup.is](https://myntkaup.is/) - Myntkaup is Iceland's best way to buy and sell Bitcoin

## Made by

This library was made by the team at [Mojo.is](https://www.mojo.is/)

Pull requests are welcome and encouraged!

## License

MIT
