FROM node:14.17.0
WORKDIR /usr/src/app
COPY . .
RUN npm run build
RUN npm install -g nodemon gulp iconify
CMD ["npm", "start"]
