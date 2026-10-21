const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { tablesDir, BUNDLED_DIR } = require('./config/table-paths');

const app = express();

const PORT = process.env.PORT || 3005;

app.use(express.json());
app.use(cors());

const attackTableRouter = require('./routes/attack-table-controller');
const criticalTableRouter = require('./routes/critical-table-controller');
const fumbleTableRouter = require('./routes/fumble-table-controller');

app.use('/v1/attack-tables', attackTableRouter);
app.use('/v1/critical-tables', criticalTableRouter);
app.use('/v1/fumble-tables', fumbleTableRouter);

app.get('/', (req, res) => {
  res.send('TODO');
});

app.listen(PORT, () => {
  console.log(`API started on ${PORT}`);
  const dir = tablesDir();
  if (dir === BUNDLED_DIR) {
    console.log(`Tables: bundled (${dir})`);
  } else if (fs.existsSync(dir)) {
    console.log(`Tables: ${dir} (bundled tables as fallback)`);
  } else {
    console.warn(`Tables: ${dir} does not exist, using the bundled tables (${BUNDLED_DIR})`);
  }
});