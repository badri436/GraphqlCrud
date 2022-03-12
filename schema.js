const AWS = require('aws-sdk')
const { buildSchema, subscribe, } = require('graphql');
const { PubSub } = require('graphql-subscriptions')
const pubSub = new PubSub();
const config = require('./config/config')

AWS.config.update({
    region: config.aws_local_config.region,
    accessKeyId: config.aws_local_config.accessKeyId,
    secretAccessKey: config.aws_local_config.secretAccessKey,
    endpoint: config.aws_local_config.endpoint
})
var docClient = new AWS.DynamoDB.DocumentClient();
const dynamoDb = new AWS.DynamoDB();

var schema = buildSchema(`
    type Query {
        employee(id: Int!): [employee]
        getAllemployee(tableName:String):[employee]

    },
    type Mutation{
        updateEmployee(id:Int!,name:String!):[employee]
        deleteEmployee(id:Int!):[employee]
    }
    type Subscription{
        existEmployee:employee
        updated:employee
        deleted:employee
    }
    type employee {
        employeeId: Int
        name: String
        email: String
        password: String
    }
    
    
`);


var getEmployee = async function (args) {
    var id = args.id;
    const params = {
        Key: {
            "employeeId": id
        },
        TableName: config.aws_table_name,

    }
    let scanResult = []
    const { Item } = await docClient.get(params).promise()
    scanResult.push(Item)
    pubSub.publish('existEmployee', { "existEmployee": Item })
    return scanResult.map(ele => {
        console.log(ele)


        return ele
    })

}

const deleted = async () => {
    return pubSub.asyncIterator("deleted")
}

const updated = async () => {
    return pubSub.asyncIterator("updated")
}

const existEmployee = async () => {
    console.log("hi")
    return pubSub.asyncIterator("existEmployee")

}


const getAll = async (args) => {
    const tableName = args.tableName

    const params = {
        TableName: tableName
    }
    const { Items } = await docClient.scan(params).promise()
    console.log(Items)
    return Items.map(ele => {
        return ele
    })

}

const updateEmployee = async (args) => {
    const id = args.id;
    const name = args.name

    const params = {
        TableName: config.aws_table_name,
        Item: {
            "employeeId": { "N": id.toString() },
            "name": { "S": name }
        },
        ReturnConsumedCapacity: "TOTAL"
    }

    await dynamoDb.putItem(params).promise()

    const param = {
        Key: {
            "employeeId": id
        },
        TableName: "Employee_Data",

    }
    let scanResult = []
    const { Item } = await docClient.get(param).promise()
    scanResult.push(Item)
    console.log(scanResult)

    return scanResult.map(ele => {
        pubSub.publish("updated", { ele })
        return ele
    })

}

const deleteEmployee = async (args) => {
    const id = args.id

    const params = {
        TableName: config.aws_table_name,
        Key: {
            "employeeId": { "N": id.toString() },
        },
    };
    await dynamoDb.deleteItem(params).promise()

    const param = {
        Key: {
            "employeeId": id
        },
        TableName: config.aws_table_name,

    }
    let scanResult = []
    const { Item } = await docClient.get(param).promise()
    scanResult.push(Item)
    console.log(scanResult)

    return scanResult.map(ele => {
        pubSub.publish('deleted', { ele })
        return ele
    })

}

module.exports = { schema, updated, deleted, existEmployee, updateEmployee, getEmployee, getAll, deleteEmployee }