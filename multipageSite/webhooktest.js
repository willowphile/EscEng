const util = require('util');
const encoder = new util.TextEncoder();
const crypto = require('crypto'); 
console.log(crypto.subtle);

let payload;
let secret;
let sigHex;

async function verifySignature(secret, sigHex, payload) {
  payload = {"app":{"id":-323232,"name":"Alisyn_TS_Demo","platform":"web"},"accountId":"Bungie::Salemites","subscription":{"id":5745181794369536,"name":"Alisyn_TS_Demo"},"userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36","event":"npsDisplayed","properties":{"guideId":"kfty_Y3x4H4oCgDe8EKhIwBRx9A","guideProperties":{"createdAt":1714142612804,"createdByUser":{"username":"alisyn.collins@pendo.io"},"id":"kfty_Y3x4H4oCgDe8EKhIwBRx9A","lastUpdatedAt":1725561933024,"lastUpdatedByUser":{"username":"alisyn.collins@pendo.io"},"name":"copy of Main NPS Survey","steps":[{"id":"MlTT-rXSxUt8m006Vl8vFnvY51E","lastUpdatedAt":1714508063236,"resetAt":0,"type":""},{"id":"JA3Ss2lFXYGwfngUiDxSCaGMiI0","lastUpdatedAt":1714508063151,"resetAt":0,"type":""}]},"guideStepId":"MlTT-rXSxUt8m006Vl8vFnvY51E","language":"en-US"},"timestamp":1730143699,"visitorId":"AgathaHarkness","uniqueId":"2271cf4780d6840716b9161798dfa0efe92b45df"};
  secret = 'f-QI7SIGXq-JXK?h&A1N55b';
  sigHex = 'e493a7a52fd1c1d1682fd117d5e957a45684275839ea8865de695cc9a29f5385';

  let algorithm = { name: "HMAC", hash: { name: 'SHA-256' } };
  let keyBytes = encoder.encode(secret);

  //console.log(secret);
  //console.log(keyBytes);


  let extractable = false;
  let key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    algorithm,
    extractable,
    ["sign", "verify"],
  );

  let sigBytes = hexToBytes(sigHex);
  let dataBytes = encoder.encode(payload);
  let equal = await crypto.subtle.verify(
    algorithm.name,
    key,
    sigBytes,
    dataBytes,
  );
  console.log(equal);
  return equal;

}

function hexToBytes(hex) {
  let len = hex.length / 2;
  let bytes = new Uint8Array(len);

  let index = 0;
  for (let i = 0; i < hex.length; i += 2) {
    let c = hex.slice(i, i + 2);
    let b = parseInt(c, 16);
    bytes[index] = b;
    index += 1;
  }
  console.log(bytes);
  return bytes;
}

verifySignature();
console.log(crypto.subtle);