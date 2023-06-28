import express from "express";
import createError from "http-errors";
import { createConnection } from "mysql2/promise";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
// import { result } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT ?? 3002;
const app = express();
// db table name
const tabName = "data";

const connection = await createConnection({
  host: process.env.HOST,
  user: process.env.USER_DB,
  password: process.env.PASSWORD_DB,
  database: process.env.NAME_DB,
  timezone: process.env.TIMEZONE_DB,
});

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);


/** CORS setting with OPTIONS pre-flight handling */
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, accept, access-control-allow-origin');

  if ('OPTIONS' == req.method) res.sendStatus(200);
  else next();
});

/**
 * POST some models, one runtime
 */
// app.get("/models", (req, res) => {
//   res.set("Access-Control-Allow-Origin", "*");
//   res.send(result);
// });
// /**
//  * POST all models, one runtime
//  */
// app.get("/runtime", (req, res) => {
//   res.set("Access-Control-Allow-Origin", "*");
//   res.send(result);
// });
/**
 * POST one models, one forecast time --> all runtime
 */
app.post("/forecast_time", async (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  const { model, forecast_time } = req.body;

  const sqlFirst = `SELECT
      runtime
    FROM
      ${tabName}
    WHERE
      (forecast_time = '${forecast_time}' AND model='${model}')
    ORDER BY
      forecast_time`;

  /**
   * Function query data mysql.
   * @param model Weather model name.
   * @param runTime API runtime.
   * @returns Data object.
   */
  const query = async (str) => {
    connection.ping(function (err) {
      if (err) throw err;
      console.log("Server responded to ping");
    });

    const [rows] = await connection.execute(sqlFirst).catch((error) => {
      throw error;
    });
    if (rows.length === 0) console.log("Empty rows! Check query params!");

    return {
      data: rows ?? [],
    };
  };

  const result = await query(sqlFirst);

  /**
   * Second query base on result from first query.
   */
  let queryStr = "";
  result.data.forEach(v => queryStr += `${v.runtime}, `);
  queryStr = queryStr.slice(0, -2);


  await connection.end();

  try {
    // const result = await query();
    res.json(sqlFirst);
  } catch (err) {
    console.error(`Error while query forecast_time`, err.message);
    next(err);
  }
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});


// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
