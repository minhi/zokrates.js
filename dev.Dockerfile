# Actual application (for testing purposes)
FROM zokrates/zokrates:0.6.3 as builder
# FIX: update node version to 14
FROM node:12

RUN mkdir /app
WORKDIR /app

COPY --from=builder /home/zokrates/.zokrates/bin/zokrates /app/zokrates
COPY --from=builder /home/zokrates/.zokrates/stdlib /app/stdlib

COPY package.json ./

RUN npm install
RUN npm install jest --g
