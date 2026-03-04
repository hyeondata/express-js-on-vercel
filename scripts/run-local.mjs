#!/usr/bin/env node

import app from '../src/index.ts'

const port = Number(process.env.PORT || 3000)

app.listen(port, () => {
  console.log(`Flash card server listening on http://localhost:${port}`)
})
