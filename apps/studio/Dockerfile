FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Build the studio for production
RUN npm run build

EXPOSE 3333

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]
