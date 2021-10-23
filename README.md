# HOW TO

Build image
```
  docker build -t soli-crypt .
```

Generate your keys:
```
  docker run --rm -v $(pwd)/.out:/tmp/out soli-crypt yarn run generate -s 3 -t 2 -o /tmp/out
```

Encrypt your file:
```
  docker run --rm -v $(pwd)/.in:/tmp/in -v $(pwd)/.out:/tmp/out soli-crypt yarn run encrypt -f /tmp/in/mySecretFile -k /tmp/out/id_rsa.pub -o /tmp/out/mySecretFile.crypted
```

Decrypt your file:
```
  docker run --rm -v $(pwd)/.in:/tmp/in -v $(pwd)/.out:/tmp/out soli-crypt yarn run decrypt -f /tmp/out/mySecretFile.crypted -k /tmp/out/id_rsa -s /tmp/out/share-0.memo -s /tmp/out/share-1.memo -o /tmp/out/mySecretFile
```

# Ressources:
- https://fr.wikipedia.org/wiki/Cryptographie_hybride
- https://learnmeabitcoin.com/technical/mnemonic
