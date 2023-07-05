/**
 *  Query data from a table in db.
 * @param {string} str Query string.
 * @param {object} connection Object.
 * @returns Data array.
 */
const query = async (str, connection, res) => {
  const [rows] = await connection.execute(str).catch((error) => {
    console.log(error);
  });
  if (rows.length === 0) {
    console.log("Empty rows! Check query params!");
    res.sendStatus(400);
    throw new Error();
  }
  return rows;
};

module.exports = { query };
