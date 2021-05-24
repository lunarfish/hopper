FROM node:12.18.1
WORKDIR /usr/src/app
COPY . .
RUN npm run build
RUN npm install -g nodemon gulp
CMD ["npm", "start"]
