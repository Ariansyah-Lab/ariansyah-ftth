FROM node:22-bookworm

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci

COPY . .

RUN pip3 install --break-system-packages openpyxl

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
