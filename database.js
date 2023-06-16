import "dotenv/config";
import { createConnection } from "mysql2/promise";

const model = "best_match";
const reqTime = "2023-06-09 08:54:08";

/**
 * Function query data mysql.
 * @param model Weather model name.
 * @param reqTime API request time.
 * @returns Data object.
 */
export const query = async (model, reqTime) => {
  const connection = await createConnection({
    host: process.env.HOST,
    user: process.env.USER_DB,
    password: process.env.PASSWORD_DB,
    database: process.env.NAME_DB,
  });

  connection.ping(function (err) {
    if (err) throw err;
    console.log("Server responded to ping");
  });
  console.log("start");
  // db table name
  const tabName = "data_copy";
  const sql = `SELECT runtime, ROUND(temperature_2m, 2) AS temp FROM ${tabName} WHERE request_time = '${reqTime}' AND model = '${model}' ORDER BY runtime`;
  const [rows] = await connection.execute(sql).catch((error) => {
    throw error;
  });
  if (rows.length === 0) console.log("Empty rows! Check query params!");
  await connection.end();
  return {
    data: rows ?? [],
    model,
  };
};
export const result = await query(model, reqTime);
