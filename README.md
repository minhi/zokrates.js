# zokrates.js

This is a Node.js wrapper around [ZoKrates](https://github.com/Zokrates).
Originally developed at [@eyblockchain/zokrates.js](https://github.com/EYBlockchain/zokrates.js).

## Instructions

This library is meant to be used through Docker containers running a Linux OS. In the Dockerfile
that will be running this library, you need to include the ZoKrates library as a builder, as such:

```Dockerfile
  FROM zokrates/zokrates:0.4.11 as builder
```

In the same Dockerfile, you then need to copy over the ZoKrates executable as well.

```Dockerfile
  COPY --from=builder /home/zokrates/zokrates /app/zokrates
  COPY --from=builder /home/zokrates/.zokrates* /app/stdlib
```

From then, you can import and use zokrates.js as any other standard Node library.
