import express from "express";
import path from "node:path";
import {fileURLToPath} from 'node:url';
import "dotenv/config";
import { result } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT ?? 3002;
const app = express();

app.use(express.static(path.join(__dirname, '../front/dist')));

app.get('/api', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.send(result);
});
result.data.forEach((v) => console.log(v));

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`)
})
