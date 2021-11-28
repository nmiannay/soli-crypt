# Soli-crypt

Encrypt your files and securely share decryption key.

It generate a `RSA sha256` key pairs protected by a **random passphrase**.
Passphrase is then split in **x** shares using `shamir` algorithm to allows you to share it between many people without let them able to decode it alone.
Then it allows you to encrypt file with `aes-256-gcm` algorithm by using a **random session key cyphered with your RSA key for every file**.
To decipher your file you will need to gather the minimum configured passphrase shares.

## Usage

### Generate keys

Generate all keys and share files:
```
yarn run generate -o .out/keys
```
This command will generate all theses files:
- id_rsa: An RSA private keys protected by a randomly generated passphrase (Even if is this file protected by a passphrase, avoid to share it). It will allows you to decrypt your file
- id_rsa.pub: The associated RSA public key. It will allows you to encrypt your documents without the need of all other files. You can share it with others to encrypt file that only you be able to decrypt
- share-x.memo: A set of unique and distinct shares of the private key passphrase. It will allows you to share the passphrase to different people without let them able to decode it alone.

Encrypt `mySecretFile` file:
```
yarn run encrypt -k .out/keys/id_rsa.pub mySecretFile
```

Decrypt `mySecretFile.crypted` file:
```
yarn run decrypt -k .out/keys/id_rsa \
  -s /mount/keys/share-0.memo \
  -s /mount/keys/share-1.memo \
  -s /mount/keys/share-2.memo \
  -s /mount/keys/share-3.memo \
  -s /mount/keys/share-4.memo \
  -s /mount/keys/share-5.memo \
  mySecretFile.crypted
```

For help and list of available options you can use --help flag on every command
```
yarn run generate --help
```

## Use a config file

To avoid to repeat yourself and always pass same arguments (eg: public-keys, output folder...), you can use a JSON configuration file.
Your config file should define `"encrypt"` and `"decrypt"` keys for respectively define parameters for encrypt and decrypt command 
Check [sample config file](config.sample.json) for syntax

```
yarn run encrypt -c config.json .in/mySecretFile 
```

## Usage with docker

Build docker image
```
docker build -t soli-crypt .
```

Then run your container with same commands as you would with node (don't forget to mount volume to share your keys and get back modified files)
Example:

```
// Generate keys in local .out/keys folder:
docker run --rm -v $(pwd)/.out/keys:/mount/keys \
  soli-crypt generate -s 3 -t 2 -o /mount/keys

//Encrypt your file:
docker run -i --rm -v $(pwd)/.out:/mount \
  soli-crypt encrypt -k /mount/keys/id_rsa.pub -o /mount/out/mySecretFile.crypted < mySecretFile

//Decrypt your file:
docker run -i --rm -v $(pwd)/.out:/mount \
  soli-crypt decrypt -k /mount/keys/id_rsa -s /mount/keys/share-0.memo -s /mount/keys/share-1.memo -o /mount/out/mySecretFile < mySecretFile.crypted 
```

> Use docker option `-i` if you want to use stdin, use docker option `-t` if you want to use mounted input file in your container

## Purpose

I wanted to cypher sensitive files, but avoid as much as possible the risk of losing the private key.
I was also looking for the possibility to store securely, decentralized way and easily the decryption key outside of any computer.
Share file are encoded by a bip39 inspired algorithm to be more easily saved or wrote on paper like bitcoin seed phrases even if they are big.

## Ressources:
- https://fr.wikipedia.org/wiki/Cryptographie_hybride
- https://learnmeabitcoin.com/technical/mnemonic
