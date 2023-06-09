import "dotenv/config";
import { createConnection } from "mysql2/promise";

const model = "best_match";
const reqTime = "2023-06-07 10:02:02";

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
  // db table name
  const tabName = "data_copy";
  const sql = `SELECT runtime, ROUND(temperature_2m, 2) AS temp FROM ${tabName} WHERE request_time = '${reqTime}' AND model = '${model}' ORDER BY runtime`;
  const [rows] = await connection.execute(sql).catch((error) => {
    throw error;
  });
  await connection.end();
  return {
    data: rows ?? [],
    model,
  };
};
const result = (await query(model, reqTime));
result.data.forEach((v) => console.log(v));
