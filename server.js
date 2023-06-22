import express from "express";
import path from "node:path";
import {fileURLToPath} from 'node:url';
import "dotenv/config";
import { result } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT ?? 3002;
const app = express();

const one = () => {
  return "one";
};

one();

app.use(express.static(path.join(__dirname, '../front/dist')));

app.get('/api', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.send(result);
});
result.data.forEach((v) => console.log(v));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`)
})
