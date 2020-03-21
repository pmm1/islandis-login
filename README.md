# islandis-login

NPM library which handles login with Electronic ID via Island.is

To get started with Island.is login you'll need to apply: (https://vefur.island.is/innskraningarthjonusta/taeknilegar-upplysingar/)[vefur.island.is/innskraningarthjonusta/um/]

Here's a guide from Island.is on how to implement: (Island.is guide)[https://vefur.island.is/innskraningarthjonusta/taeknilegar-upplysingar/]

Technical guide

### Usage

```js
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

### License

MIT
