const express = require('express');
const app = express()
const bodyParser = require('body-parser');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql')
const schema = require('./schema')
app.use(bodyParser.json())
const root = {
    employee: schema.getEmployee,
    getAllemployee: schema.getAll,
    updateEmployee: schema.updateEmployee,
    deleteEmployee: schema.deleteEmployee,
    existEmployee: schema.existEmployee,
    updated: schema.updated,
    deleted: schema.deleted
}
app.use('/graphql', graphqlHTTP({
    schema: schema.schema,
    rootValue: root,
    graphiql: true
}))
app.listen(3000, () => {
    console.log("port Connected")
})

