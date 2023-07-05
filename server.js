const express = require("express");
const mysql = require("mysql2/promise");
const multer = require("multer");
const { query } = require("./function");
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
const TAB_NAME_DB = "data";

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

  try {
    const connection = await mysql.createConnection({
      host: process.env.HOST,
      user: process.env.USER_DB,
      password: process.env.PASSWORD_DB,
      database: process.env.NAME_DB,
      timezone: process.env.TIMEZONE_DB,
      // dateStrings: true,
    });

    connection.ping(function (err) {
      if (err) throw err;
      console.log("Server responded to ping");
    });

    // Проверяем данные с фронта.

    //Получаем все уникальные значения из колонки "model" таблицы "data".
    const sqlUniqueModelName = `
      SELECT DISTINCT
        model
      FROM
        ${TAB_NAME_DB}
    `;
    const listUniqueModelName = await query(sqlUniqueModelName, connection);
    const arrValidateName = listUniqueModelName.map((v) => v.model);
    const { model, forecast_time, forecast_date } = req.body;

    switch (true) {
      case !req.body:
        throw new Error(`Check query params!`);
      case !arrValidateName.includes(model):
        throw new Error(`Check query params model: '${model}'!`);
      case !req.body.forecast_time:
        throw new Error(
          `Check query params forecast_time: '${forecast_time}'!`
        );
      case !req.body.forecast_date:
        throw new Error(
          `Check query params forecast_time: '${forecast_date}'!`
        );
      default:
        break;
    }

    // if (
    //   !req.body ||
    //   !arrValidateName.includes(model) ||
    //   !req.body.forecast_time ||
    //   !req.body.forecast_date
    // ) {
    //   console.log(`Check query params '${model}'!`);
    //   res.sendStatus(400);
    //   throw new Error();
    // }

    /**
     * First query string - getting a list of request times.
     */
    const datetimeStr = forecast_date + " " + forecast_time;
    const sqlFirst = `SELECT
      request_time
    FROM
      ${TAB_NAME_DB}
    WHERE
      (forecast_time = '${datetimeStr}' AND model='${model}')
    ORDER BY
      forecast_time`;

    const listRuntime = await query(sqlFirst, connection);

    /**
     * Second query string - base on result from first query.
     * Remove the last comma from a string.
     */
    let queryStr = "";
    listRuntime.forEach((v) => {
      const str =
        typeof v.request_time === "string"
          ? `"${v.request_time}", `
          : `"${v.request_time.toISOString()}", `;
      queryStr += str;
    });
    const lastCommaRemoved = queryStr.endsWith(", ")
      ? queryStr.slice(0, -2)
      : queryStr;

    const sqlSecond = `
    SELECT
      runtime,
      request_time,
      forecast_time,
      ROUND(temperature_2m, 2) AS temp,
      model
    FROM
      ${TAB_NAME_DB}
    WHERE
      request_time IN (${lastCommaRemoved}) AND model='${model}'
    ORDER BY
      request_time`;

    const result = await query(sqlSecond, connection);

    await connection.end();

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
      ${TAB_NAME_DB}
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
