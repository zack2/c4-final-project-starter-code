// import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import {DynamoDB} from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import UpdateItemInput = DocumentClient.UpdateItemInput;
import QueryInput = DocumentClient.QueryInput;
import PutItemInput = DocumentClient.PutItemInput;
import DeleteItemInput = DocumentClient.DeleteItemInput;

//const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')


//const dbClient: DocumentClient = new XAWS.DynamoDB.DocumentClient();
const dbClient = new DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const todoTable = process.env.TODOS_TABLE

export async function getTodoItemsPerUser(userId: string): Promise<TodoItem[]> {
    logger.info("Getting all todos for user: " + userId)

    const params: QueryInput = {
        TableName: todoTable,
        IndexName: process.env.TODOS_CREATED_AT_INDEX,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        }
    }

    const result = await dbClient.query(params).promise()
    const todoItems = result.Items as TodoItem[]
    logger.info("Returning Todos: " + todoItems)
    return todoItems
}

export async function createTodoItem(todoItem: TodoItem): Promise<TodoItem> {
    const params : PutItemInput = {
        TableName: todoTable,
        Item: todoItem
    }

    await dbClient.put(params).promise()
    return todoItem
}

export async function updateTodoItem(userId: string, todoId: string, todoUpdate: TodoUpdate): Promise<TodoItem> {
    const params: UpdateItemInput = {
        TableName: todoTable,
        Key: {
            userId: userId,
            todoId: todoId
        },
        ExpressionAttributeNames: {
            "#N": "name"
        },
        UpdateExpression: "set #N = :todoName, dueDate = :dueDate, done = :done",
        ExpressionAttributeValues: {
            ":todoName": todoUpdate.name,
            ":dueDate": todoUpdate.dueDate,
            ":done": todoUpdate.done
        },
        ReturnValues: "ALL_NEW"
    }

    const updatedItem = await dbClient.update(params).promise()
    return updatedItem.Attributes as TodoItem
}

export async function deleteTodoItem(userId: string, todoId: string): Promise<void> {
    const params: DeleteItemInput = {
        TableName: todoTable,
        Key: {
            userId: userId,
            todoId: todoId
        }
    }

    await dbClient.delete(params).promise()
}

export async function updateAttachmentUrl(userId: string, todoId: string, attachmentUrl: string): Promise<void> {
    await dbClient.update({
        TableName: todoTable,
        Key: {
            userId,
            todoId
        },
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
            ':attachmentUrl': attachmentUrl
        }
    }).promise()
}

// export class TodosAccess {
//
//     constructor(
//         private readonly docClient: DocumentClient = createDynamoDBClient(),
//         private readonly toDoTable = process.env.TODOS_TABLE) {
//     }
//
//     async getTodosForUser(userId: String): Promise<TodoItem[]> {
//         const result = await this.docClient.query({
//             TableName: this.toDoTable,
//             KeyConditionExpression: 'userId = :userId',
//             ExpressionAttributeValues: {
//                 ':userId': userId
//             }
//         }).promise()
//         const items = result.Items
//         return items as TodoItem[];
//     }
//
//     async createTodosForUser(todoItem: TodoItem): Promise<TodoItem> {
//         await this.docClient.put({
//             TableName: this.toDoTable,
//             Item: todoItem
//         }).promise()
//
//         return todoItem as TodoItem
//     }
//
//     async deleteTodosForUser(todoIds: String, userId: String) {
//         return await this.docClient.delete({
//             TableName: this.toDoTable,
//             Key: {
//                 userId: userId,
//                 todoId: todoIds
//             }
//         }).promise();
//     }
//
//     async updateTodosForUser(todoUpdate: TodoUpdate, userId: String, todoIds: String) {
//         const params = {
//             TableName: this.toDoTable,
//             Key: {
//                 userId: userId,
//                 todoId: todoIds
//             },
//             UpdateExpression: 'set done = :r',
//             ExpressionAttributeValues: {
//                 ':r': todoUpdate.done,
//             }
//         }
//         return await this.docClient.update(params).promise();
//     }
//
//     async updateTodosImage(imageUrl: String, userId: String, todoIds: String) {
//         const params = {
//             TableName: this.toDoTable,
//             Key: {
//                 userId: userId,
//                 todoId: todoIds
//             },
//             UpdateExpression: 'set attachmentUrl = :r',
//             ExpressionAttributeValues: {
//                 ':r': imageUrl,
//             }
//         }
//         return await this.docClient.update(params).promise();
//     }
// }
//
// function createDynamoDBClient() {
//     if (process.env.IS_OFFLINE) {
//         console.log('Creating a local DynamoDB instance')
//         return new XAWS.DynamoDB.DocumentClient({
//             region: 'localhost',
//             endpoint: 'http://localhost:8000'
//         })
//     }
//
//     return new XAWS.DynamoDB.DocumentClient()
// }
