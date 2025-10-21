FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3333

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
