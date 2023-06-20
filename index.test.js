const IslandISLogin = require("./index");
const user = require("./fixtures/user.json");
const { token, audience } = require("./fixtures/common.json");

const getLoginWithPemFile = () => {
    return new IslandISLogin({
        audienceUrl: audience,
        verifyDates: false,
    });
};

const getLoginWithPemString = () => {
    return new IslandISLogin({
        audienceUrl: audience,
        verifyDates: false,
        certificate: `
-----BEGIN CERTIFICATE-----
MIIFfDCCA2SgAwIBAgICAyQwDQYJKoZIhvcNAQELBQAwazELMAkGA1UEBhMCSVMx
EzARBgNVBAUTCjU1MDE2OTI4MjkxGjAYBgNVBAoTEUZqYXJtYWxhcmFkdW5leXRp
MRYwFAYDVQQLEw1Sb3RhcnNraWxyaWtpMRMwEQYDVQQDEwpJc2xhbmRzcm90MB4X
DTE3MTExNjEzMjgzM1oXDTMyMTExNjEzMjgzM1owfjELMAkGA1UEBhMCSVMxEzAR
BgNVBAUTCjUyMTAwMDI3OTAxFTATBgNVBAoTDEF1ZGtlbm5pIGhmLjEnMCUGA1UE
CxMeVXRnZWZhbmRpIGZ1bGxnaWxkcmEgc2tpbHJpa2phMRowGAYDVQQDExFGdWxs
Z2lsdCBhdWRrZW5uaTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMyn
5tktN9C5QTrErtjS5YM+0k29pTy5a8TYl56Ma70OJT6aO17z5NsPjwSnTswlEZ34
+zjzZm5MVxi8/fQpbDZlE/4N4YZlYBD1rm8AZB3mJUyPVNYQpTirnWPAIXUjYD0B
25K7NU6V7MTibr5Z0VRgljvSbaKut4Y2ld3bx6Kmzc4pHKLU2hjbK+BSrPTbKuLH
8Xae9WP6O2Zxd2d3elDUmh+0uhFexf3DuBNxvp4ildmISdDG2x538i+jBOUyv9GX
wwbPGadt2FIdI15xgC0Y4L/AC8snfjEMcwH0xuaqdmAA/iOSWiprgTLQUmcnQQyT
6lpM21Ai/EaqDvT1AWkCAwEAAaOCARUwggERMBIGA1UdEwEB/wQIMAYBAf8CAQAw
agYDVR0gBGMwYTBfBgdggmABAQEBMFQwLQYIKwYBBQUHAgIwIRofSW50ZXJtZWRp
YXRlIENlcnRpZmljYXRlIFBvbGljeTAjBggrBgEFBQcCARYXaHR0cDovL2NwLmlz
bGFuZHNyb3QuaXMwDgYDVR0PAQH/BAQDAgEGMB8GA1UdIwQYMBaAFGV8Ul8MuWrF
0jBaAr2g+4BAsh66MD8GA1UdHwQ4MDYwNKAyoDCGLmh0dHA6Ly9jcmwuaXNsYW5k
c3JvdC5pcy9pc2xhbmRzcm90L2xhdGVzdC5jcmwwHQYDVR0OBBYEFMIpPob/hsTa
NR9ppqT/AYM8SjOpMA0GCSqGSIb3DQEBCwUAA4ICAQBOBaAGxLPntnC3fVeHeQsD
13AT2a3+Ry9R3AFP063Cwnc4+SYlCt+LSPa2wTCcDXAjvPgaxjRrTuTF1sCfj1uu
8GVMeo7e6suYggf2PLxsKWjaGOJhUtZnNC1rh2mt4TVYTR2D0AHYju0nNjzZlXU3
1Ea//HDCQkV9+sSINTTrFL0Y5kB05WyVBXLHSTl/bKY8ULik2JImofrF+nI7GifH
CMLFkCOkAUDsI3Fd0Fh7v3NguxpOM4sov2jowMZzxqkS9B8B0qRO41h6spuLvsNS
tnFZHIbTrMaINUm9X6C49lr0fpRri4UNQa2prMgNsK9dwsYurlMga1WpO6fwkzU3
mLYjitUxV9iYJ1VWj2jhJt0ofDsB4xLCVu8n0gekde09P5EdWzLvXD03PLtkEiGt
HElpluMFYaFjHhofYhai3u5eLVFTcNkEcyZO470EZTZ123dP3JQpSBKFjH7Z5CSS
wgvFB/zOOdnEDS49Iidetk5y2D8Pg2NB4qGJcmkit9Zjv2cOj9b5gKu7XMzkja9v
MahgfOrAKZJS7nrxr6NNR4rTMw8Rb9nvkS2sGk9ZGnbMLM+j84LDpT0rFMLNkegD
FVob63pewil6mH43mVOLq6tyYMiU7mgzYcui1rGnhtLiSqpI6L1UaQ2IqT4PJGdX
PIeO6oWVJpZaF7hWABD7sw==
-----END CERTIFICATE-----
`,
    });
};

test("verify from pem file returns user", async () => {
    const login = getLoginWithPemFile();
    const data = await login
        .verify(token)
        .then((user) => {
            return user;
        })
        .catch((err) => {
            console.log("Error verifying token");
            console.log(err);
            return err;
        });

    expect(data).toStrictEqual(user);
});

test("verify from pem string returns user", async () => {
    const login = getLoginWithPemString();
    const data = await login
        .verify(token)
        .then((user) => {
            return user;
        })
        .catch((err) => {
            console.log("Error verifying token");
            console.log(err);
            return err;
        });

    expect(data).toStrictEqual(user);
});
