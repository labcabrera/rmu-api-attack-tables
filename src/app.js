const express = require('express');
const cors = require('cors');

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
});