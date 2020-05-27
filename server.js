var express = require('express');
var app = express();
app.get('/', (request, response) => {
  response.sendStatus(200);
});
app.listen(process.env.PORT);
