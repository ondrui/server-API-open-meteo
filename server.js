const express = require("express");
const mysql = require("mysql2/promise");
const multer = require("multer");
require("dotenv").config();

const port = process.env.PORT ?? 3002;
const app = express();
const upload = multer();

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
// db table name
const tabName = "data";

/** CORS setting with OPTIONS pre-flight handling */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, accept, access-control-allow-origin"
  );

  if ("OPTIONS" == req.method) res.sendStatus(200);
  else next();
});

/**
 * POST one models, one forecast time --> all runtime
 */
app.post("/forecast_time", upload.none(), async (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");

  const connection = await mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER_DB,
    password: process.env.PASSWORD_DB,
    database: process.env.NAME_DB,
    timezone: process.env.TIMEZONE_DB,
  });

  connection.ping(function (err) {
    if (err) throw err;
    console.log("Server responded to ping");
  });

  if (!req.body || !req.body.model || !req.body.forecast_time)
    return res.sendStatus(400);
  const { model, forecast_time } = req.body;

  // Убираем разделитель Т из строки и проверяем сколько знаков
  // в строке время.
  str = forecast_time.split("T")[1];
  str = str.length < 6 ? str + ":00" : str;
  formatedTime = [forecast_time.split("T")[0], str].join(" ");
  try {
    const query = async (str) => {
      const [rows] = await connection.execute(str).catch((error) => {
        console.log(error);
      });
      if (rows.length === 0) {
        console.log("Empty rows! Check query params!");
        res.sendStatus(400);
      }
      // await connection.end();
      return rows;
    };
    /**
     * First query gets list runtime.
     */
    const sqlFirst = `SELECT
      runtime
    FROM
      ${tabName}
    WHERE
      (forecast_time = '${formatedTime}' AND model='${model}')
    ORDER BY
      forecast_time`;

    const listRuntime = await query(sqlFirst);

    /**
     * Second query base on result from first query.
     */
    let queryStr = "";
    listRuntime.forEach((v) => {
      const str =
        typeof v.runtime === "string"
          ? `"${v.runtime}", `
          : `"${v.runtime.toISOString()}", `;
      queryStr += str;
    });
    queryStr = queryStr.slice(0, -2);

    const sqlSecond = `
    SELECT
      runtime,
      forecast_time,
      ROUND(temperature_2m, 2) AS temp,
      model
    FROM
      ${tabName}
    WHERE
      runtime IN (${queryStr}) AND model='${model}'
    ORDER BY
      forecast_time`;

    const result = await query(sqlSecond);

    // await connection.end();

    res.json(result);
  } catch (err) {
    console.error(`Error while query forecast_time`, err.message);
    // Passes errors into the error handler
    next(err);
  }
});

/**
 * GET some models, one runtime
 */
app.get("/models", async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  const connection = await mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER_DB,
    password: process.env.PASSWORD_DB,
    database: process.env.NAME_DB,
    timezone: process.env.TIMEZONE_DB,
  });

  connection.ping(function (err) {
    if (err) throw err;
    console.log("Server responded to ping");
  });
  try {
    /**
     * Function query data mysql.
     * @param model Weather model name.
     * @param runTime API runtime.
     * @returns Data object.
     */
    const query = async () => {
      let str = "";
      const dataFromFront = [
        { model: "hmn", runTime: "2023-07-02 06:00:02" },
        { model: "best_match", runTime: "2023-07-02 06:00:02" },
        { model: "ecmwf_ifs04", runTime: "2023-07-02 06:00:02" },
        { model: "ecmwf_balchug", runTime: "2023-07-03 14:54:16" },
        { model: "gem_global", runTime: "2023-07-02 06:00:02" },
        { model: "gfs_global", runTime: "2023-07-02 06:00:02" },
        { model: "icon_eu", runTime: "2023-07-02 06:00:02" },
        { model: "icon_global", runTime: "2023-07-02 06:00:02" },
        { model: "jma_gsm", runTime: "2023-07-02 06:00:02" },
        { model: "meteofrance_arpege_europe", runTime: "2023-07-02 06:00:02" },
        { model: "meteofrance_arpege_world", runTime: "2023-07-02 06:00:02" },
      ];
      dataFromFront.forEach(
        ({ model, runTime }) =>
          (str += `(runtime="${runTime}" AND model="${model}") OR `)
      );
      str = str.slice(0, -4);
      const sqlModelRuntime = `
    SELECT
      runtime,
      forecast_time,
      ROUND(temperature_2m, 2) AS temp,
      model
    FROM
      ${tabName}
    WHERE
      ${str}
    ORDER BY
      forecast_time
      `;

      const [rows] = await connection
        .execute(sqlModelRuntime)
        .catch((error) => {
          throw error;
        });
      if (rows.length === 0) console.log("Empty rows! Check query params!");
      // await connection.end();
      return rows ?? [];
    };

    const result = await query();
    res.json(result);
  } catch (err) {
    console.error(`Error while query forecast_time`, err.message);
    next(err);
  }
});

/**
 * POST all models, one runtime
 */
// app.get("/runtime", (req, res) => {
//   res.set("Access-Control-Allow-Origin", "*");
//   res.send(result);
// });

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
