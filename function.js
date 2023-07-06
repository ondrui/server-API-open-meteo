/**
 *  Query data from a table in db.
 * @param {string} str Query string.
 * @param {array} inserts Query values.
 * @param {object} connection Object.
 * @param {object} res Object.
 * @returns Data array.
 */
const query = async (connection, res, str) => {
  const [rows] = await connection.execute(str).catch((error) => {
    console.log(error);
  });
  if (rows.length === 0) {
    res.sendStatus(400);
    throw new Error("Empty rows! Check query params!");
  }
  return rows;
};

module.exports = { query };
