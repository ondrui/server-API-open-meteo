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

/**
 * Remove milliseconds and the suffix Z from datetime string ('.000Z').
 * @param {string} str Date Time String. In format 'YYYY-MM-DDTHH:mm:ss.sssZ'
 * @param {number} num default value -5.
 * @returns
 */
const removeMsZ = (str, num = -5) => str.slice(0, num);
// Helper Functions
const formatedDatetime = (date) =>
  typeof date === "string" ? removeMsZ(date) : removeMsZ(date.toISOString());

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

    // Проверяем данные с фронта.

    //Получаем все уникальные значения из колонки "model" таблицы "data".
    const sqlUniqueModelName = `
      SELECT DISTINCT
        model
      FROM
        ${TAB_NAME_DB}
    `;
    const listUniqueModelName = await query(
      connection,
      res,
      sqlUniqueModelName
    );
    const arrValidateName = listUniqueModelName.map((v) => v.model);
    const { model, forecast_time, forecast_date } = req.body;

    switch (true) {
      case req.body &&
        Object.keys(req.body).length === 0 &&
        req.body.constructor === Object:
        res.sendStatus(400);
        throw new Error(`Check query params: all empty!`);
      case !arrValidateName.includes(model):
        res.sendStatus(400);
        throw new Error(`Check query params model: '${model}'!`);
      case !req.body.forecast_time:
        res.sendStatus(400);
        throw new Error(
          `Check query params forecast_time: '${forecast_time}'!`
        );
      case !req.body.forecast_date:
        res.sendStatus(400);
        throw new Error(
          `Check query params forecast_time: '${forecast_date}'!`
        );
    }

    /**
     * Запрашиваем все даты скачивания по модели и точке прогноза.
     */
    const datetimeStr = forecast_date + " " + forecast_time;
    const sqlFirst = `SELECT
      request_time
    FROM
      ${TAB_NAME_DB}
    WHERE
      (forecast_time = ? AND model = ?)
    ORDER BY
      forecast_time`;
    const insertsFirst = [datetimeStr, model];
    const sqlFirstFormated = mysql.format(sqlFirst, insertsFirst);

    const listRequestTime = await query(connection, res, sqlFirstFormated);

    /**
     * Second query string - base on result from first query.
     */

    const listRequestTimeFormated = listRequestTime.map(
      (v) => (v = formatedDatetime(v.request_time))
    );

    const insertsSecond = [listRequestTimeFormated, model];

    const sqlSecond = `
    SELECT
      request_time,
      forecast_time,
      ROUND(temperature_2m, 2) AS temp,
      model
    FROM
      ${TAB_NAME_DB}
    WHERE
      request_time IN (?) AND model=?
    ORDER BY
      forecast_time`;

    const sqlSecondFormated = mysql.format(sqlSecond, insertsSecond);

    const result = await query(connection, res, sqlSecondFormated);

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
app.post("/models", upload.none(), async (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  try {
    const connection = await mysql.createConnection({
      host: process.env.HOST,
      user: process.env.USER_DB,
      password: process.env.PASSWORD_DB,
      database: process.env.NAME_DB,
      timezone: process.env.TIMEZONE_DB,
    });

    const insertObj = { request_time: req.body.request_time };

    const sqlModelRuntime = `
    SELECT
      request_time,
      forecast_time,
      ROUND(temperature_2m, 2) AS temp,
      model
    FROM
      ${TAB_NAME_DB}
    WHERE
      ?
    ORDER BY
      forecast_time
      `;

    const sqlModelRuntimeFormated = mysql.format(sqlModelRuntime, insertObj);
    const result = await query(connection, res, sqlModelRuntimeFormated);
    await connection.end();
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
