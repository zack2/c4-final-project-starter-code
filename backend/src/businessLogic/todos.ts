import * as TodosAccess  from '../dataLayer/todosAcess'
import * as AttachmentUtils  from '../helpers/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
//import {getTodoItemsPerUser} from "../dataLayer/todosAcess";

const logger = createLogger('todos')

export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    userId: string
): Promise<TodoItem> {
    const todoId = uuid.v4()
    const nowIsoString = new Date().toISOString()

    const newTodoItem: TodoItem = {
        todoId: todoId,
        userId: userId,
        createdAt: nowIsoString,
        done: false,
        ...createTodoRequest
    }

    logger.info('Storing new Todo: ' + newTodoItem)
    return TodosAccess.createTodoItem(newTodoItem)
}

export async function deleteTodo(
    todoId: string,
    userId: string
): Promise<void> {
    logger.info('Delete Todo Item: ', { todoId: todoId, userId: userId })
    return TodosAccess.deleteTodoItem(todoId, userId)
}

export async function createAttachmentPresignedUrl(
    todoId: string,
    userId: string
): Promise<String> {
    const attachmentId = uuid.v4()
    const uploadUrl = await createUploadUrl(attachmentId)
    await addAttachmentToTodo(userId, todoId, attachmentId)
    return uploadUrl
}

export async function createUploadUrl(attachmentId: string): Promise<string> {
    logger.info('Create new pre-signed upload url for todoId: ' + attachmentId)
    const url = AttachmentUtils.createAttachmentPresignedUrl(attachmentId)
    logger.info('Upload URL: ' + url)
    return url
}

export async function addAttachmentToTodo(
    todoId: string,
    userId: string,
    attachmentId: string
): Promise<void> {
    const attachmentUrl = AttachmentUtils.getAttachmentBucketUrl(attachmentId)
    logger.info('Get attachment URL: ' + attachmentUrl)
    await TodosAccess.updateAttachmentUrl(userId, todoId, attachmentUrl)
}

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
    return TodosAccess.getTodoItemsPerUser(userId)
}

export async function updateTodo(
    todoId: string,
    userId: string,
    updateTodoRequest: UpdateTodoRequest
): Promise<TodoItem> {
    logger.info('Update Todo Item: ', {
        todoId: todoId,
        userId: userId,
        updateTodoRequest: updateTodoRequest
    })
    return TodosAccess.updateTodoItem(todoId, userId, updateTodoRequest)
}
